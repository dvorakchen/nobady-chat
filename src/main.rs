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

    let app = ::nobody_chat::App::new(args.addr);
    app.run().await.unwrap();
}
