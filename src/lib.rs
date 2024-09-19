use std::{io, net::SocketAddr};

use crate::routes::home::{index, user_connection};
use axum::{routing::get, Extension, Router};
use chat::ChatRoom;
use kameo::actor::ActorRef;

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

        let listener = tokio::net::TcpListener::bind(self.addr.clone())
            .await
            .unwrap();
        axum::serve(listener, routes).await
    }

    // #[cfg(not(debug_assertions))]
    fn build_routes() -> Router {
        let app = Router::new()
            .route("/", get(index))
            .route("/ws", get(user_connection))
            .nest_service("/assets", tower_http::services::ServeDir::new("assets"))
            .nest_service(
                "/favicon.ico",
                tower_http::services::ServeFile::new("assets/favicon.ico"),
            )
            .layer(Extension(chat_room_extension()));

        #[cfg(debug_assertions)]
        let app = Self::hot_reload(app);

        app
    }

    #[cfg(debug_assertions)]
    fn hot_reload(route: Router) -> Router {
        use log::trace;

        let route = {
            use notify::Watcher;
            let livereload = tower_livereload::LiveReloadLayer::new().request_predicate(
                |req: &axum::http::Request<axum::body::Body>| {
                    !req.headers().contains_key("hx-request")
                },
            );
            let reloader = livereload.reloader();
            let mut watcher = notify::recommended_watcher(move |_| reloader.reload()).unwrap();
            watcher
                .watch(
                    std::path::Path::new("assets"),
                    notify::RecursiveMode::Recursive,
                )
                .unwrap();
            watcher
                .watch(
                    std::path::Path::new("templates"),
                    notify::RecursiveMode::Recursive,
                )
                .unwrap();
            trace!("Enableing hot-reload");

            route.layer(livereload)
        };

        route
    }
}

fn chat_room_extension() -> ActorRef<ChatRoom> {
    ChatRoom::new()
}
