use serde::{Deserialize, Serialize};

use crate::models::UserId;

/// forwording negotiation message
/// # Example:
/// "{"msg_type":{"signal":{"from_id":"from_id","signal_type":"offer","to_id":"to_id","value":"value"}}}"
#[derive(Serialize, Deserialize, Debug)]
pub struct SignalInfo {
    pub from_id: UserId,
    pub to_id: UserId,
    pub signal_type: SignalType,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum SignalType {
    Offer,
    Answer,
    NewCandidate,
    /// user requests to video communicate to other user
    RequestVideo,
    Deny,
    Stop,
}
