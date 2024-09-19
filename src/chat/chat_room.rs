use std::collections::HashMap;

use super::User;
use kameo::{actor::ActorRef, message::Message, Actor};

#[derive(Actor)]
pub struct ChatRoom {
    /// new connection user, have no registered
    unready_users: HashMap<String, User>,
}

impl ChatRoom {
    pub fn new() -> ActorRef<Self> {
        let chat_room = kameo::spawn(ChatRoom {
            unready_users: HashMap::default(),
        });

        chat_room
    }
}

pub struct NewUserConnection(User);

impl Message<NewUserConnection> for ChatRoom {
    type Reply = ();

    async fn handle(
        &mut self,
        msg: NewUserConnection,
        _ctx: kameo::message::Context<'_, Self, Self::Reply>,
    ) -> Self::Reply {
        if self.unready_users.get(&msg.0.get_id()).is_some() {
            return;
        }

        self.unready_users.insert(msg.0.get_id(), msg.0);
    }
}
