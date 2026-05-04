# Docker Deployment

## 목표

backend, frontend, codex app-server를 같은 Docker network에 올려 backend가 app-server에 WebSocket으로 접근하게 한다.

## 권장 구조

```text
docker network
  backend
  frontend
  codex-app-server
  sqlite volume
```

## Compose 예시

```yaml
services:
  codex-app-server:
    image: app-codex
    command: codex app-server --listen ws://0.0.0.0:8765
    expose:
      - "8765"
    volumes:
      - ${CODEX_HOME:-~/.codex}:/home/codex/.codex:ro

  backend:
    image: app-backend
    environment:
      CODEX_APP_SERVER_URL: ws://codex-app-server:8765
      CODEX_APP_SERVER_MANAGED: "false"
      TRIP_PLANNER_DB_URL: jdbc:sqlite:/data/app.sqlite
    volumes:
      - app-data:/data
    depends_on:
      - codex-app-server

  frontend:
    image: app-frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  app-data:
```

## 주의

- `codex-app-server`의 8765 포트는 외부 publish 하지 않는다.
- backend만 내부 network로 접근한다.
- `~/.codex`는 read-only mount를 기본으로 한다.
- production에서는 OpenAI-compatible/OpenRouter provider가 더 단순할 수 있다.
- 중앙 app-server를 여러 서비스가 공유하는 경우 tenant isolation과 권한 정책이 필요하다.

## 운영 모드

### Local Personal Mode

- SQLite
- Codex app-server
- single user
- Docker compose 또는 dev script

### Team/Internal Mode

- PostgreSQL 권장
- OpenAI-compatible 또는 OpenRouter 기본
- Codex app-server는 개인별 optional provider
- auth/session 필요

### Public SaaS Mode

- Codex app-server 직접 제공은 비권장
- hosted provider 기반
- workspace auth/RBAC/rate limit 필요
