use serde::{Deserialize, Serialize};

use super::UserId;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
enum MsgType {
    SetUser { id: UserId, name: String },
    Msg { from: UserId, msg: String },
    UserOnline { id: UserId, name: String },
    UserOffline { id: UserId },
}

#[derive(Serialize)]
pub struct SendData {
    msg_type: MsgType,
}

impl SendData {
    pub fn new_set_user(id: UserId, name: String) -> Self {
        Self {
            msg_type: MsgType::SetUser { id, name },
        }
    }

    pub fn new_msg(msg: String, from: UserId) -> Self {
        Self {
            msg_type: MsgType::Msg { from, msg },
        }
    }

    pub fn new_user_online(id: UserId, name: String) -> Self {
        Self {
            msg_type: MsgType::UserOnline { id, name },
        }
    }

    pub fn new_user_offline(id: UserId) -> Self {
        Self {
            msg_type: MsgType::UserOffline { id },
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecvDataType {
    TalkTo { to: UserId, msg: String },
}

#[derive(Deserialize)]
pub struct RecvData {
    pub msg_type: RecvDataType,
}
