use std::net::SocketAddr;

use axum::{
    extract::{ws::WebSocket, ConnectInfo, State, WebSocketUpgrade},
    http::StatusCode,
    response::{IntoResponse, Response},
    Extension, Json,
};
use axum_extra::{headers, TypedHeader};
use kameo::{actor::ActorRef, request::MessageSend};
use log::info;
use serde::{Deserialize, Serialize};

use crate::state::AllowOriginState;
use crate::{
    chat::{AllActivityUsers, ChatRoom, User},
    models::UserId,
};

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

pub async fn web_socket_connection(
    ws: WebSocketUpgrade,
    user_agent: Option<TypedHeader<headers::UserAgent>>,
    origin: Option<TypedHeader<headers::Origin>>,
    State(allow_origins): State<AllowOriginState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Extension(chat): Extension<ActorRef<ChatRoom>>,
) -> impl IntoResponse {
    if let Some(res) = valify_header(origin, user_agent, allow_origins) {
        return res;
    }

    info!("{:?} connected.", addr);

    ws.on_upgrade(move |socket| append_new_connection(socket, chat))
}

async fn append_new_connection(ws: WebSocket, chat_room: ActorRef<ChatRoom>) {
    let _ = User::new_actor(ws, chat_room).await;
}

fn valify_header(
    origin: Option<TypedHeader<headers::Origin>>,
    user_agent: Option<TypedHeader<headers::UserAgent>>,
    allow_origins: AllowOriginState,
) -> Option<Response> {
    match origin {
        Some(TypedHeader(value))
            if allow_origins
                .iter()
                .any(|url| url == "*" || url == &value.to_string()) => {}
        _ => return Some((StatusCode::UNAUTHORIZED, "Disallowed Origin").into_response()),
    }

    const UNKNOW_BROWSER: &str = "Unknown browser";
    if let None = user_agent {
        return Some((StatusCode::BAD_REQUEST, UNKNOW_BROWSER).into_response());
    }

    None
}
