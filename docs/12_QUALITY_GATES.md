# Quality Gates

새 프로젝트가 최소 품질을 만족하려면 아래를 통과해야 한다.

## Frontend

- [ ] `npm run build`
- [ ] 채팅 전송 시 user message가 즉시 표시된다.
- [ ] streaming 중 사용자가 위로 스크롤할 수 있다.
- [ ] 하단 근처에서는 자동 스크롤된다.
- [ ] 메시지별 복사는 본문만 복사한다.
- [ ] 전체 세션 복사는 Markdown 구조를 유지한다.
- [ ] Markdown list marker가 보인다.
- [ ] code block, link, bold가 깨지지 않는다.
- [ ] operation preview는 접고 펼칠 수 있다.
- [ ] chat session URL 진입이 가능하다.

## Backend

- [ ] unit test
- [ ] operation parser test
- [ ] operation validator test
- [ ] checkpoint rollback test
- [ ] interrupted run recovery test
- [ ] provider failure path test
- [ ] cancel path test
- [ ] Flyway migration from empty DB

## AI Behavior

- [ ] 일반 답변에는 operation이 없어도 된다.
- [ ] 데이터 수정 요청은 operation을 포함한다.
- [ ] 불확실한 id는 수정하지 않는다.
- [ ] tool block은 사용자에게 노출되지 않는다.
- [ ] operation preview가 사람이 이해 가능한 문장이다.
- [ ] 적용 실패 시 assistant message에 실패 정보가 남는다.

## Security

- [ ] provider API key가 browser bundle에 없다.
- [ ] Codex auth path가 API 응답에 원문 노출되지 않는다.
- [ ] app-server port가 public하게 열리지 않는다.
- [ ] destructive operation은 validator를 통과해야 한다.
- [ ] external bot binding은 link code로 검증한다.

