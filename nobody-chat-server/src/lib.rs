mod socket;
mod cipher;
use std::{io, net::SocketAddr};

use crate::routes::home::{all_online_users, web_socket_connection};
use axum::{http::HeaderValue, routing::get, Extension, Router};
use chat::ChatRoom;
use log::{debug, info};
use tokio::net::TcpListener;
use tower_http::cors::{AllowOrigin, CorsLayer};

mod chat;
pub(crate) mod models;
pub mod routes;
mod signal;
pub mod state;

use state::new_allow_origin_state;

pub struct App {
    addr: String,
    allow_urls: Vec<String>,
}

impl App {
    pub fn new(addr: impl AsRef<str>, allow_urls: Vec<String>) -> Self {
        Self {
            addr: addr.as_ref().to_string(),
            allow_urls,
        }
    }

    pub async fn run(&self) -> io::Result<()> {
        let routes = self
            .build_routes()
            .into_make_service_with_connect_info::<SocketAddr>();

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

    fn build_routes(&self) -> Router {
        let api_routes = Router::new().route("/allonlineusers", get(all_online_users));

        let app = Router::new()
            .route("/", get(|| async { "Running" }))
            .route("/ws", get(web_socket_connection))
            .nest("/api", api_routes)
            .nest_service("/assets", tower_http::services::ServeDir::new("assets"))
            .nest_service(
                "/favicon.ico",
                tower_http::services::ServeFile::new("assets/favicon.ico"),
            )
            .with_state(new_allow_origin_state(self.allow_urls.clone()))
            .layer(self.cors())
            .layer(Extension(ChatRoom::new()));

        app
    }

    fn cors(&self) -> CorsLayer {
        let allow_origins = if self.allow_urls.iter().any(|url| url == "*") {
            AllowOrigin::any()
        } else {
            AllowOrigin::list(
                self.allow_urls
                    .iter()
                    .map(|url| url.parse::<HeaderValue>().unwrap())
                    .collect::<Vec<_>>(),
            )
        };

        info!("Cros allow origins: {:?}", allow_origins);
        CorsLayer::new().allow_origin(allow_origins)
    }
}
