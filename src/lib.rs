use std::{io, net::SocketAddr};

use crate::routes::home::{index, user_connection};
use axum::{routing::get, Extension, Router};
use chat::ChatRoom;
use log::debug;
use tokio::net::TcpListener;

mod chat;
pub mod routes;

pub struct App {
    addr: String,
}

impl App {
    pub fn new(addr: impl AsRef<str>) -> Self {
        Self {
            addr: addr.as_ref().to_string(),
        }
    }

    pub async fn run(&self) -> io::Result<()> {
        let routes = Self::build_routes().into_make_service_with_connect_info::<SocketAddr>();

        let listener = if cfg!(debug_assertions) {
            debug!("Debug environment");

            use listenfd::ListenFd;
            let mut listenfd = ListenFd::from_env();
            match listenfd.take_tcp_listener(0).unwrap() {
                // if we are given a tcp listener on listen fd 0, we use that one
                Some(listener) => {
                    debug!("Hot Reloading");
                    listener.set_nonblocking(true).unwrap();
                    TcpListener::from_std(listener).unwrap()
                }
                // otherwise fall back to local listening
                None => TcpListener::bind(self.addr.clone()).await.unwrap(),
            }
        } else {
            TcpListener::bind(self.addr.clone()).await.unwrap()
        };

        axum::serve(listener, routes).await
    }

    fn build_routes() -> Router {
        let app = Router::new()
            .route("/", get(index))
            .route("/ws", get(user_connection))
            .nest_service("/assets", tower_http::services::ServeDir::new("assets"))
            .nest_service(
                "/favicon.ico",
                tower_http::services::ServeFile::new("assets/favicon.ico"),
            )
            .layer(Extension(ChatRoom::new()));

        app
    }
}
