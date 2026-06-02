# License Ledger

## 목적

Ulsabio의 UI stack은 상업 사용 가능한 오픈소스 중심으로 시작한다. 새 dependency를 추가할 때마다 이 문서에 목적, 라이선스, 사용 범위, 주의사항을 남긴다.

## Frontend Candidates

| 패키지/프로젝트 | 용도 | 라이선스 | 결정 | 주의 |
|---|---|---|---|---|
| Next.js | App Router, route, rendering | MIT | 채택 | 최신 보안 패치 유지 |
| shadcn/ui | UI component source registry | MIT | 채택 | 설치된 컴포넌트는 내부 코드로 관리 |
| AI Elements | AI-native chat/message/tool UI | Apache-2.0 | 채택 | 설치 시 registry code review 필요 |
| lucide-react | icon | ISC | 채택 | icon-only button accessible name 필요 |
| @xyflow/react | infinite canvas, agent graph | MIT | 채택 | canvas fallback/inspector 필요 |
| react-markdown | 일반 markdown rendering | MIT | 채택 | HTML 허용 시 sanitize 정책 필요 |
| remark-gfm | table/tasklist 등 GFM | MIT | 채택 | user content 처리 시 plugin allowlist 유지 |
| Tiptap OSS | WYSIWYG/report editor | MIT | 채택 후보 | Pro/Platform 기능은 별도 라이선스 |
| Tailwind CSS | styling utility | MIT | 채택 | token source와 ad-hoc class 난립 방지 |

## 채택 규칙

- MIT, Apache-2.0, BSD, ISC는 기본 허용.
- GPL, AGPL, 상업 제한, SaaS 제한은 기본 제외.
- dual-license는 무료 OSS 범위와 유료 기능 경계를 문서화하기 전까지 제품 코드에 넣지 않음.
- registry에서 코드를 복사하는 방식은 dependency audit와 별개로 source review를 수행.
- editor/canvas처럼 저장 포맷이 생기는 라이브러리는 export/import 가능성을 먼저 확인.

## 확인 링크

- shadcn/ui: https://github.com/shadcn-ui/ui
- AI Elements: https://elements.ai-sdk.dev/
- React Flow: https://reactflow.dev/
- Tiptap license: https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md
- react-markdown: https://github.com/remarkjs/react-markdown
- remark-gfm: https://github.com/remarkjs/remark-gfm
