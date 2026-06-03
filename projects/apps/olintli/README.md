# Olintli

Olintli 신규 제품 방향을 검증하기 위한 workspace임. 기존 `trip-plan` 구현은 참고만 하고, 이 폴더는 새 구조를 처음부터 잡는 용도다.

## Projects

| 폴더 | 역할 |
|---|---|
| `backend` | Kotlin/Spring orchestrator API scaffold |
| `frontend` | 실제 제품 프론트 scaffold |
| `frontend-design` | 디자인 시스템과 mockup 비교용 scaffold |

## Local Run

프론트는 Next 기반이라 Node 20 이상을 전제로 한다.

```bash
cd projects/apps/olintli/frontend-design
npm install
npm run dev
```

제품 프론트도 동일한 방식으로 실행한다.

```bash
cd projects/apps/olintli/frontend
npm install
npm run dev
```

백엔드는 Gradle wrapper를 아직 넣지 않은 skeleton이다. 실제 개발 시작 시 wrapper와 Spring dependency version을 고정한다.
