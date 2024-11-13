use axum::extract::ws::{Message as WsMessage, WebSocket};
use futures_util::{stream::SplitSink, SinkExt, StreamExt};
use kameo::{
    actor::ActorRef,
    error::SendError,
    mailbox::unbounded::UnboundedMailbox,
    message::{Message, StreamMessage},
    request::MessageSend,
    Actor,
};
use log::{debug, error, info, warn};
use serde_json::json;
use uuid::Uuid;

use crate::{
    chat::{models::SendData, PlainUser, SendMsg, UserDisconnection},
    models::UserId,
    signal::SignalInfo,
};

use super::{
    models::{RecvData, RecvDataType},
    ChatRoom, ForwordSignal, NewUserConnection, SetName, UserOnline,
};

pub struct UserRef {
    pub id: UserId,
    pub name: String,
    pub actor_ref: ActorRef<User>,
}

pub struct User {
    id: UserId,
    name: String,
    sender: SplitSink<WebSocket, WsMessage>,
    chat_room: ActorRef<ChatRoom>,
    // pri_key: [u8; 32]
    // cipher: Box<dyn EncryptDecrypt>,
}

impl Actor for User {
    type Mailbox = UnboundedMailbox<Self>;

    async fn on_start(
        &mut self,
        _actor_ref: kameo::actor::ActorRef<Self>,
    ) -> Result<(), kameo::error::BoxError> {
        use log::debug;

        debug!("user, id: {} started", self.get_id());

        Ok(())
    }

    async fn on_stop(
        mut self,
        _actor_ref: kameo::actor::WeakActorRef<Self>,
        reason: kameo::error::ActorStopReason,
    ) -> Result<(), kameo::error::BoxError> {
        warn!("user id: {} stopped, error: {:?}", self.id, reason);

        // close websocket
        let _ = self.sender.close().await;

        Ok(())
    }
}

impl Message<StreamMessage<Result<WsMessage, axum::Error>, (), ()>> for User {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: StreamMessage<Result<WsMessage, axum::Error>, (), ()>,
        ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        debug!("user id: {}", self.get_id());

        match msg {
            StreamMessage::Started(()) => {
                info!("user id: {} started", self.id);
                self.connection_started().await;
            }
            StreamMessage::Finished(()) => {
                info!("user id: {}, Finish", self.get_id());

                self.chat_room
                    .tell(UserDisconnection(self.get_id()))
                    .send()
                    .await
                    .unwrap();

                ctx.actor_ref().kill();
            }
            StreamMessage::Next(Ok(message)) => {
                debug!("{:?}", message);
                match message {
                    WsMessage::Text(raw_msg) => self.handle_recv_msg(raw_msg).await,
                    _ => {}
                }
            }
            StreamMessage::Next(Err(e)) => {
                error!("Unready User occured: {:?}", e);
            }
        }
    }
}

impl User {
    pub async fn new_actor(
        socket: WebSocket,
        chat_room: ActorRef<ChatRoom>,
    ) -> Result<(), SendError<NewUserConnection>> {
        // let plain_user = PlainUser::new(socket);
        // let (socket, key) = plain_user.exchange_key().await.unwrap();

        let (sender, recv) = socket.split();

        let id = Uuid::new_v4().simple().to_string();
        debug!("User new id: {id}");
        let name = Uuid::new_v4().simple().to_string()[..5].to_string();
        let actor = kameo::spawn(Self {
            id: id.clone(),
            name: name.clone(),
            sender,
            chat_room: chat_room.clone(),
            // pri_key: None,
        });

        actor.attach_stream(recv, (), ());
        let tem_actor = actor.clone();

        chat_room
            .tell(NewUserConnection::new(
                id.clone(),
                UserRef {
                    id,
                    name,
                    actor_ref: actor,
                },
            ))
            .send()
            .await
            .map_err(|e| {
                tem_actor.kill();
                e
            })?;

        Ok(())
    }

    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    pub fn get_name(&self) -> String {
        self.name.clone()
    }

    async fn connection_started(&mut self) {
        self.send_user_info_to_client().await;

        self.chat_room
            .tell(UserOnline(self.get_id(), self.get_name()))
            .send()
            .await
            .unwrap();
    }

    async fn send_user_info_to_client(&mut self) {
        let data = SendData::new_set_user(self.get_id(), self.get_name());
        let data = json!(data).to_string();

        self.sender.send(WsMessage::Text(data)).await.unwrap();
    }

    async fn handle_recv_msg(&self, raw_msg: String) {
        if let Ok(data) = serde_json::from_str::<'_, RecvData>(&raw_msg) {
            match data.msg_type {
                RecvDataType::TalkTo { to, msg } => self.handle_talk_to_user(to, msg).await,
                RecvDataType::Signal(signal) => self.handle_signal(signal).await,
            }
        } else {
            error!("received unknow data: {raw_msg}");
        }
    }

    async fn handle_talk_to_user(&self, to: UserId, msg: String) {
        debug!("rece: to: {to}, msg: {msg}");

        self.chat_room
            .tell(SendMsg {
                from: self.get_id(),
                to,
                msg,
            })
            .send()
            .await
            .unwrap();
    }

    async fn handle_signal(&self, signal: SignalInfo) {
        debug!("recv: signal message: {:?}", signal);

        self.chat_room
            .tell(ForwordSignal(signal))
            .send()
            .await
            .unwrap();
    }
}

impl Message<UserOnline> for User {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: UserOnline,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if msg.0 == self.id {
            return;
        }

        let data = SendData::new_user_online(msg.0, msg.1);
        let data = json!(data).to_string();

        self.sender.send(WsMessage::Text(data)).await.unwrap();
    }
}

impl Message<UserDisconnection> for User {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: UserDisconnection,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if msg.0 == self.id {
            return;
        }

        let data = SendData::new_user_offline(msg.0);
        let data = json!(data).to_string();

        self.sender.send(WsMessage::Text(data)).await.unwrap();
    }
}

impl Message<SetName> for User {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: SetName,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if msg.0 == self.id {
            return;
        }

        let data = SendData::new_set_name(msg.0, msg.1);
        let data = json!(data).to_string();

        self.sender.send(WsMessage::Text(data)).await.unwrap();
    }
}

pub struct NewMsg {
    pub from: UserId,
    pub msg: String,
}

impl Message<NewMsg> for User {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: NewMsg,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        let data = SendData::new_msg(msg.msg, msg.from);
        let data = json!(data).to_string();

        self.sender.send(WsMessage::Text(data)).await.unwrap();
    }
}

impl Message<ForwordSignal> for User {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: ForwordSignal,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if msg.0.to_id == self.id {
            let data = json!(SendData::new_signal_forword(msg.0)).to_string();

            self.sender.send(WsMessage::Text(data)).await.unwrap();
        }
    }
}
