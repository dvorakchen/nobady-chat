ARG RUST_VERSION=1.81
ARG APP_NAME=nobody-chat

FROM hub.aiursoft.cn/rust:${RUST_VERSION}-slim AS chef
LABEL author="DvorakChen"
LABEL email="dvorakchen@outlook.com"

ARG APP_NAME

RUN  echo "[source.crates-io]\n\ 
    replace-with = 'rsproxy-sparse'\n\
    [source.rsproxy]\n\
    registry = \"https://rsproxy.cn/crates.io-index\"\n\
    [source.rsproxy-sparse]\n\ 
    registry = \"sparse+https://rsproxy.cn/index/\"\n\ 
    [registries.rsproxy]\n\ 
    index = \"https://rsproxy.cn/crates.io-index\"\n\ 
    [net]\n\
    git-fetch-with-cli = true\n" >> $CARGO_HOME/config.toml

RUN cargo install cargo-chef
WORKDIR /app

FROM chef as planner
COPY . .
RUN cargo chef prepare  --recipe-path recipe.json

FROM chef AS rust-build
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --release

FROM hub.aiursoft.cn/debian:stable-slim AS final

ARG APP_NAME

USER root

COPY --from=rust-build /app/target/release/${APP_NAME} /bin/server

EXPOSE 3000

WORKDIR /bin

CMD ["server", "-a", "0.0.0.0:3000"]
