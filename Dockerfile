ARG RUST_VERSION=1.81
ARG APP_NAME=nobody-chat

# cache npm
FROM dockerproxy.cn/node:22-alpine as npm-env

WORKDIR /app

RUN yarn config set registry http://registry.npm.taobao.org/

COPY ./package.json ./package.json

RUN yarn

COPY ./input.css ./input.css
COPY ./assets ./assets
COPY ./templates ./templates
COPY ./tailwind.config.js ./tailwind.config.js

RUN yarn build:css

FROM dockerproxy.cn/rust:${RUST_VERSION}-slim AS chef
LABEL author="DvorakChen"
LABEL email="dvorakchen@outlook.com"

ARG APP_NAME
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

# COPY ./Cargo.toml ./Cargo.toml
# COPY ./Cargo.lock ./Cargo.lock
# RUN mkdir ./src
# RUN echo "fn main() {}" > ./src/main.rs

# RUN cargo build --release 

# RUN rm ./* -rf

# build
# COPY . .

# RUN cargo build --release 

FROM dockerproxy.cn/debian:stable-slim AS final

ARG APP_NAME

USER root

COPY --from=npm-env /app/assets/ /bin/assets
COPY --from=rust-build /app/target/release/${APP_NAME} /bin/server

EXPOSE 3000

WORKDIR /bin

CMD ["server", "-a", "0.0.0.0:3000"]