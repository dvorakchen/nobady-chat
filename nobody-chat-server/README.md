# Nobody Chat

It's just a Chat room Server

# Prerequisite

You should have the latest Rust toolchain

# Dev

You should have the Rust toolchain and npm

For Hot-Reload, install `cargo install systemfd cargo-watch`

```bash
systemfd --no-pid -s 3000 -- cargo watch -x 'r -- -a 0.0.0.0:3000'
```

# Build

```bash
cargo b --release
```

or just run Ddocker

```bash
docker compose up -d
```

Notice: 
If you run under production, you need change the environment in compose.yaml file.
Field `ALLOW_URLS` as your UI address

open broswer with 0.0.0.0:3000, then you would see:
<!-- 
![1726999287740](https://github.com/user-attachments/assets/0a1fb78e-2b0d-4b46-8841-76b7cc10ee91)
 -->
