use std::net::SocketAddr;

use axum::{
    extract::{ws::WebSocket, ConnectInfo, WebSocketUpgrade}, http::StatusCode, response::IntoResponse, Extension, Json
};
use axum_extra::{headers, TypedHeader};
use kameo::{actor::ActorRef, request::MessageSend};
use log::info;
use serde::{Deserialize, Serialize};

use crate::chat::{AllActivityUsers, ChatRoom, User, UserId};

#[derive(Serialize, Deserialize)]
pub struct OnlineUser {
    pub id: UserId,
    pub name: String,
}

pub async fn all_online_users(
    Extension(chat_room): Extension<ActorRef<ChatRoom>>,
) -> impl IntoResponse {
    let list = chat_room.ask(AllActivityUsers).send().await.unwrap();

    let list: Vec<_> = list
        .iter()
        .map(|item| OnlineUser {
            id: item.0.clone(),
            name: item.1.clone(),
        })
        .collect();

    Json(list)
}

pub async fn user_connection(
    ws: WebSocketUpgrade,
    user_agent: Option<TypedHeader<headers::UserAgent>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Extension(chat): Extension<ActorRef<ChatRoom>>,
    // body: String,
) -> impl IntoResponse {
    const UNKNOW_BROWSER: &str = "Unknown browser";
    let user_agent = if let Some(TypedHeader(user_agent)) = user_agent {
        user_agent.to_string()
    } else {
        String::from(UNKNOW_BROWSER)
    };

    info!("`{}` at {:?} connected.", user_agent, addr);

    if user_agent == UNKNOW_BROWSER {
        return (StatusCode::BAD_REQUEST, UNKNOW_BROWSER).into_response();
    }

    ws.on_upgrade(move |socket| append_new_connection(socket, chat))
}

async fn append_new_connection(ws: WebSocket, chat_room: ActorRef<ChatRoom>) {
    let _ = User::new_actor(ws, chat_room).await;
}
