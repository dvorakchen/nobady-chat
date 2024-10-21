use serde::{Deserialize, Serialize};

use crate::signal::SignalInfo;

use crate::models::UserId;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
enum MsgType {
    SetUser { id: UserId, name: String },
    Msg { from: UserId, msg: String },
    UserOnline { id: UserId, name: String },
    UserOffline { id: UserId },
    SetName { id: UserId, name: String },

    Signal(SignalInfo),
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

    pub fn new_set_name(id: UserId, name: String) -> Self {
        Self {
            msg_type: MsgType::SetName { id, name },
        }
    }

    pub fn new_signal_forword(signal: SignalInfo) -> Self {
        Self {
            msg_type: MsgType::Signal(signal),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecvDataType {
    TalkTo { to: UserId, msg: String },
    Signal(SignalInfo),
}

#[derive(Deserialize)]
pub struct RecvData {
    pub msg_type: RecvDataType,
}
