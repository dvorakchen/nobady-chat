# Nobody-Chat

This is just a Chat room

# Build
```sh
docker compose up -d
```

open your broswer to `localhost:3001`, and could see the UI

## Production
If you would like to deply to production, you might modify the `compose.override.yaml` environment fields first

```
services:
  vue:
    depends_on:
      - server
    environment:
      # this
      # VITE_API_ADDRESS=your.api.com
  server:
    environment:
      # - ALLOW_URLS=["your.UI.domain.com"]
```