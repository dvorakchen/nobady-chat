ARG RUST_VERSION=1.80.1
ARG APP_NAME=nobody-chat

# cache npm
FROM hub.aiursoft.cn/node:latest as npm-env

WORKDIR /app

COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
COPY ./input.css ./input.css
COPY ./assets ./assets
COPY ./templates ./templates
COPY ./tailwind.config.js ./tailwind.config.js

RUN yarn

RUN yarn build:css

FROM hub.aiursoft.cn/rust:1.74.1 AS rust-build
LABEL author="DvorakChen"
LABEL email="dvorakchen@outlook.com"

ARG APP_NAME

WORKDIR /app

# cache cargo
COPY ./Cargo.toml ./Cargo.toml
RUN mkdir ./src
RUN echo "fn main() {}" > ./src/main.rs

RUN cargo build --release 

RUN rm ./* -rf

# build
COPY . .


RUN cargo build --release 

FROM hub.aiursoft.cn/debian:12 AS final

ARG APP_NAME

USER root

COPY --from=npm-env /app/assets/ /bin/assets
COPY --from=rust-build /app/target/release/${APP_NAME} /bin/server

EXPOSE 3000

WORKDIR /bin

CMD ["server", "-a", "0.0.0.0:3000"]