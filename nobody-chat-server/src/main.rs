use clap::Parser;
use log::{debug, info};

#[derive(Parser)]
#[command(version, about)]
struct Args {
    /// Listen address of App
    #[arg(short, long)]
    addr: String,
}

#[tokio::main]
async fn main() {
    if cfg!(debug_assertions) {
        debug!("Dev mode");
        dotenv::dotenv().ok();
    }

    let args = Args::parse();

    env_logger::init();

    info!("Nobody Chat start!");
    info!("Listening: {}", args.addr);

    let urls = if let Ok(allow_urls) = std::env::var("ALLOW_URLS") {
        if let Ok(list) = serde_json::from_str(&allow_urls) {
            list
        } else {
            vec![]
        }
    } else {
        vec![]
    };

    let app = ::nobody_chat::App::new(args.addr, urls);
    app.run().await.unwrap();
}
