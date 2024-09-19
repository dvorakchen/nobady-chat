use std::net::SocketAddr;

use askama_axum::{IntoResponse, Template};
use axum::{
    extract::{ws::WebSocket, ConnectInfo, WebSocketUpgrade},
    http::StatusCode,
    Extension,
};
use axum_extra::{headers, TypedHeader};
use kameo::actor::ActorRef;
use log::info;

use crate::chat::ChatRoom;

// use crate::chat::ChatRoomBox;

#[derive(Template)]
#[template(path = "home.html")]
pub struct HomePageTemplate<'a> {
    pub welcome: &'a str,
}

pub async fn index() -> HomePageTemplate<'static> {
    HomePageTemplate {
        welcome: "Welcome Nobody Chat",
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
    use log::debug;

    debug!("accpetd ws");
}
