
# cache npm
FROM dockerproxy.cn/node:22-alpine as npm-env

WORKDIR /app

RUN yarn config set registry https://registry.npmmirror.com

COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock

RUN yarn

COPY . .

RUN yarn build 

FROM nginx as final

COPY --from=npm-env /app/dist/ /usr/share/nginx/html/

