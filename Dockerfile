ARG RUST_VERSION=1.80.1
ARG APP_NAME=nobody-chat

FROM hub.aiursoft.cn/rust:1.74.1 AS build
LABEL author="DvorakChen"
LABEL email="dvorakchen@outlook.com"

ARG APP_NAME

WORKDIR /app

COPY ./Cargo.toml ./Cargo.toml
RUN mkdir ./src
RUN echo "fn main() {}" > ./src/main.rs

RUN cargo build --release 

RUN rm ./* -rf

COPY . .

RUN cargo build --release 

FROM hub.aiursoft.cn/debian:12 AS final

ARG APP_NAME

USER root

COPY --from=build /app/target/release/${APP_NAME} /bin/server

EXPOSE 3000

WORKDIR /bin

CMD ["server", "-a", "0.0.0.0:3000"]