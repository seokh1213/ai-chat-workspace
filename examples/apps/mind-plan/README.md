# Mind Plan

AI와 채팅하면서 계획, 할 일, 생각 구조를 수정하는 로컬 우선 플래너입니다.

## 구조

- `backend`: Kotlin, Spring Boot 4.0.5, SQLite, Flyway
- `frontend`: React 19, Vite, Markdown 채팅 렌더링
- `docs`: 설계 문서

## 실행

```bash
./scripts/dev-start.sh
```

- Frontend: http://127.0.0.1:5183
- Backend: http://127.0.0.1:8091

기본 AI provider는 `local-rule`입니다. `claude-cli`는 로컬 `claude` 명령어가 설치되어 있으면 워크스페이스 설정에서 선택할 수 있게 설계했습니다.
