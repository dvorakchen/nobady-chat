use std::sync::Arc;

use axum::extract::ws::{Message as WsMessage, WebSocket};
use futures_util::{
    future::{self, Shared},
    stream::{SplitSink, SplitStream},
    StreamExt,
};
use kameo::{
    actor::ActorRef,
    mailbox::unbounded::UnboundedMailbox,
    message::{Message, StreamMessage},
    Actor,
};
use log::{debug, error, info};

pub struct User {
    id: String,
    sender: SplitSink<WebSocket, WsMessage>,
    status: UserState,
}

enum UserState {
    Unready,
    Ready,
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
}

impl Message<StreamMessage<Result<WsMessage, axum::Error>, (), ()>> for User {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: StreamMessage<Result<WsMessage, axum::Error>, (), ()>,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        debug!("user id: {}", self.get_id());

        match msg {
            StreamMessage::Started(()) => {
                info!("Started");
            }
            StreamMessage::Finished(()) => {
                info!("Finish");
            }
            StreamMessage::Next(Ok(message)) => {
                info!("{:?}", message);
            }
            StreamMessage::Next(Err(e)) => {
                error!("Unready User occured: {:?}", e);
            }
        }
    }
}

impl User {
    pub fn new_actor(id: String, socket: WebSocket) -> ActorRef<Self> {
        let (sender, recv) = socket.split();

        let actor = kameo::spawn(Self {
            id,
            sender,
            status: UserState::Unready,
        });

        actor.attach_stream(recv, (), ());

        actor
    }

    pub fn get_id(&self) -> String {
        self.id.clone()
    }
}
