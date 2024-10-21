use std::collections::HashMap;

use super::{NewMsg, UserRef};
use crate::{models::UserId, signal::SignalInfo};
use kameo::{
    actor::{ActorRef, PubSub, Publish, Subscribe},
    message::Message,
    request::MessageSend,
    Actor,
};

#[derive(Actor)]
pub struct ChatRoom {
    /// new connection user, have no registered
    activity_users: HashMap<String, UserRef>,
    online_pubsub: ActorRef<PubSub<UserOnline>>,
    offline_pubsub: ActorRef<PubSub<UserDisconnection>>,
    new_name_pubsub: ActorRef<PubSub<SetName>>,
}

impl ChatRoom {
    pub fn new() -> ActorRef<Self> {
        let chat_room = kameo::spawn(ChatRoom {
            activity_users: HashMap::default(),
            online_pubsub: kameo::spawn(PubSub::new()),
            offline_pubsub: kameo::spawn(PubSub::new()),
            new_name_pubsub: kameo::spawn(PubSub::new()),
        });

        chat_room
    }
}

pub struct NewUserConnection {
    id: String,
    user: UserRef,
}

impl NewUserConnection {
    pub fn new(id: String, user: UserRef) -> Self {
        Self { id, user }
    }
}

impl Message<NewUserConnection> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: NewUserConnection,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if self.activity_users.get(&msg.id).is_some() {
            return;
        }

        macro_rules! user_subscribe {
            ($user_actor_ref: expr) => {
                $user_actor_ref
                    .ask(Subscribe(msg.user.actor_ref.clone()))
                    .send()
                    .await
                    .unwrap();
            };
        }

        user_subscribe!(self.online_pubsub);
        user_subscribe!(self.offline_pubsub);
        user_subscribe!(self.new_name_pubsub);

        self.activity_users.insert(msg.id, msg.user);
    }
}

#[derive(Clone)]
pub struct UserDisconnection(pub UserId);

impl Message<UserDisconnection> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: UserDisconnection,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        let _ = self.activity_users.remove(&msg.0);
        self.offline_pubsub.ask(Publish(msg)).send().await.unwrap();
    }
}

pub struct AllActivityUsers;

impl Message<AllActivityUsers> for ChatRoom {
    type Reply = Vec<(UserId, String)>;

    async fn handle(
        &mut self,
        _msg: AllActivityUsers,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        self.activity_users
            .values()
            .map(|v| (v.id.clone(), v.name.clone()))
            .collect()
    }
}

#[derive(Clone)]
pub struct UserOnline(pub UserId, pub String);

impl Message<UserOnline> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: UserOnline,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        self.online_pubsub.ask(Publish(msg)).send().await.unwrap();
    }
}

#[derive(Clone)]
pub struct SetName(pub UserId, pub String);

impl Message<SetName> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: SetName,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        self.new_name_pubsub.ask(Publish(msg)).send().await.unwrap();
    }
}

pub struct SendMsg {
    pub from: UserId,
    pub to: UserId,
    pub msg: String,
}

impl Message<SendMsg> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: SendMsg,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if let Some(to_user) = self.activity_users.get_mut(&msg.to) {
            let _ = to_user
                .actor_ref
                .tell(NewMsg {
                    from: msg.from,
                    msg: msg.msg,
                })
                .send()
                .await;
        }
    }
}

/// signal forwork to specify User
/// do nothing else, just forwork
pub struct ForwordSignal(pub SignalInfo);

impl Message<ForwordSignal> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: ForwordSignal,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if let Some(to_user) = self.activity_users.get(&msg.0.to_id) {
            to_user.actor_ref.tell(msg).send().await.unwrap();
        }
    }
}
