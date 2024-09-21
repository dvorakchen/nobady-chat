use std::collections::HashMap;

use super::{NewMsg, UserId, UserRef};
use kameo::{
    actor::ActorRef,
    message::Message,
    request::{MessageSend, MessageSendSync},
    Actor,
};
use log::debug;

#[derive(Actor)]
pub struct ChatRoom {
    /// new connection user, have no registered
    activity_users: HashMap<String, UserRef>,
}

impl ChatRoom {
    pub fn new() -> ActorRef<Self> {
        let chat_room = kameo::spawn(ChatRoom {
            activity_users: HashMap::default(),
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

        self.activity_users.insert(msg.id, msg.user);
    }
}

pub struct UserDisconnection(pub UserId);

impl Message<UserDisconnection> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: UserDisconnection,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        let _ = self.activity_users.remove(&msg.0);
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
        self.activity_users
            .iter()
            .filter(|(id, _)| **id != msg.0)
            .for_each(|(id, user_ref)| {
                debug!("found id: {}, msg id: {}", id, msg.0);
                user_ref.actor_ref.tell(msg.clone()).send_sync().unwrap();
            });
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
