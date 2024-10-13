# Nobody-Chat

This is just a Chat room

# Build
```sh
docker compose up -d
```

open your broswer to `localhost:3001`, and could see the UI

## Production
If you would like to deply to production, you might modify the `compose.override.yaml` environment fields first

This is modify the API server CORS allow origins:
```
services:
  vue:
    depends_on:
      - server
  server:
    environment:
      # - ALLOW_URLS=["your.UI.domain.com"]
```

This is modify the UI request API address:
```sh
# ./nobody-chat-vue/.env.production

VITE_API_ADDRESS="<your production api address>"
```