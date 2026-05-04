# Security Notes

## 기본 원칙

- 브라우저는 backend만 호출한다.
- AI provider credentials는 backend에만 둔다.
- AI output은 untrusted input이다.
- DB mutation은 validated operation으로만 한다.
- Codex app-server는 public network에 직접 노출하지 않는다.

## Codex app-server

Codex app-server는 강한 권한을 가질 수 있다. 파일시스템, MCP, shell capability가 열릴 수 있으므로 다음을 지킨다.

- Docker 내부 network에만 노출한다.
- `127.0.0.1` 또는 private service name으로만 접근한다.
- browser가 app-server WebSocket에 직접 붙지 않는다.
- auth file은 read-only mount를 기본으로 한다.
- app-server cwd는 가능하면 빈 작업 디렉터리나 `/tmp`를 쓴다.

## External Providers

- API key는 env 또는 encrypted storage에 둔다.
- workspace 설정에 저장할 경우 masking과 export 제한이 필요하다.
- logs에 Authorization header를 남기지 않는다.
- provider error body를 사용자에게 그대로 노출하지 않는다.

## External Bots

- Telegram/Discord user id는 인증이 아니다.
- 반드시 웹에서 생성한 link code 또는 OAuth로 workspace와 연결한다.
- bot command는 현재 선택된 data space/session context를 명확히 표시해야 한다.
- destructive operation은 웹 확인 링크로 돌리는 옵션을 둔다.

## Multi-User 확장 시 추가 필요

- users
- workspace_members
- roles
- row-level authorization check
- audit_logs
- API rate limit
- provider quota per workspace

