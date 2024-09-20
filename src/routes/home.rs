use std::net::SocketAddr;

use askama_axum::{IntoResponse, Template};
use axum::{
    extract::{ws::WebSocket, ConnectInfo, WebSocketUpgrade},
    http::StatusCode,
    Extension,
};
use axum_extra::{headers, TypedHeader};
use kameo::{actor::ActorRef, request::MessageSend};
use log::info;

use crate::chat::{AllActivityUsers, ChatRoom, User, UserId};

// use crate::chat::ChatRoomBox;

#[derive(Template)]
#[template(path = "home.html")]
pub struct HomePageTemplate<'a> {
    pub welcome: &'a str,
    pub all_users: Vec<(UserId, String)>,
}

pub async fn index(
    Extension(chat_room): Extension<ActorRef<ChatRoom>>,
) -> HomePageTemplate<'static> {
    let list = chat_room.ask(AllActivityUsers).send().await.unwrap();

    HomePageTemplate {
        welcome: "Welcome Nobody Chat",
        all_users: list,
    }
}

pub async fn user_connection(
    ws: WebSocketUpgrade,
    user_agent: Option<TypedHeader<headers::UserAgent>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Extension(chat): Extension<ActorRef<ChatRoom>>,
    // body: String,
) -> impl IntoResponse {
    const UNKNOW_BROWSER: &str = "Unknown browser";
print!("");
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
