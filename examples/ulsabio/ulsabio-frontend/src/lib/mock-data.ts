export const workspaces = [
  {
    id: "trip-2026-busan",
    type: "Trip",
    title: "부산 3박 4일",
    summary: "지도, 일정, 숙소 후보가 연결된 여행 workspace. 최근 채팅에서 일정 재정렬 요청이 있었음.",
    status: "active",
    updatedAt: "오늘 09:30"
  },
  {
    id: "knowledge-agent-platform",
    type: "Knowledge",
    title: "Agent Platform 리서치",
    summary: "모델 제공사, UX 참고자료, PRD 문서가 묶인 지식 workspace.",
    status: "draft",
    updatedAt: "어제 22:10"
  },
  {
    id: "investment-watch",
    type: "Finance",
    title: "관심 종목 점검",
    summary: "뉴스 scrap, 가격 watch, 리포트 생성을 위한 초기 workspace.",
    status: "setup",
    updatedAt: "월요일"
  }
];

export const runEvents = [
  {
    id: "run-provider-sync",
    title: "provider usage 동기화",
    detail: "OpenRouter token 사용량을 settings usage meter에 반영",
    status: "done"
  },
  {
    id: "run-trip-rewrite",
    title: "여행 일정 후보 재배치",
    detail: "부산 workspace의 day 2 동선을 지도 기준으로 재계산",
    status: "waiting"
  },
  {
    id: "run-scrap-report",
    title: "스크랩 기반 문서 초안",
    detail: "Knowledge workspace에서 report artifact 생성 준비",
    status: "queued"
  }
];
