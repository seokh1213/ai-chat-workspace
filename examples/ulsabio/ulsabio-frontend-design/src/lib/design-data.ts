import { BarChart3, Bell, BookOpen, Bot, CalendarDays, CheckCircle2, Clock3, FileText, FolderOpen, Globe2, Grid2X2, Home, Link2, Send, Sparkles, TrendingUp, Utensils, Waypoints, Zap } from "lucide-react";

export const sidebarPrimaryItems = [
  { id: "today", label: "오늘", icon: Home, active: true },
  { id: "topics", label: "주제 (Topics)", icon: Grid2X2, active: false },
  { id: "delegated", label: "맡긴 일", icon: Waypoints, active: false },
  { id: "memory", label: "기억 (Memory)", icon: BookOpen, active: false },
  { id: "agents", label: "에이전트", icon: Bot, active: false },
  { id: "connections", label: "연결 (Connections)", icon: Link2, active: false }
];

export const sidebarSecondaryItems = [
  { id: "scrap", label: "스크랩", icon: FileText },
  { id: "calendar", label: "캘린더", icon: CalendarDays },
  { id: "todo", label: "할 일", icon: CheckCircle2 },
  { id: "files", label: "파일", icon: FolderOpen }
];

export const promptModes = [
  { id: "fast", title: "빠른 답변", description: "질문에 빠르게 답해요", icon: Sparkles, tone: "blue" },
  { id: "organize", title: "자료 정리", description: "문서, 링크, 파일을 정리해요", icon: FileText, tone: "violet" },
  { id: "travel", title: "여행 계획", description: "여행 일정과 정보를 짜줘요", icon: Globe2, tone: "indigo" },
  { id: "delegate", title: "여러 담당에게 맡기기", description: "여러 에이전트가 함께 처리해요", icon: Zap, tone: "red" },
  { id: "auto", title: "자동으로 해두기", description: "반복 작업을 자동화해요", icon: Clock3, tone: "green" }
];

export const suggestedTools = [
  { id: "workspace", title: "작업면으로 펼치기", description: "결과물을 지도, 문서, 표, 보드 등으로 보기", icon: CheckCircle2, tone: "green" },
  { id: "topic", title: "주제로 저장", description: "이 대화를 주제로 저장하고 계속 발전시키기", icon: FolderOpen, tone: "neutral" },
  { id: "scrap", title: "자료 스크랩", description: "링크, 영상, 기사 등 저장하고 요약하기", icon: BookOpen, tone: "purple" },
  { id: "schedule", title: "자동 실행 등록", description: "스케줄, 알림, 모니터링 등록하기", icon: Clock3, tone: "blue" }
];

export const recentTopics = [
  {
    id: "tokyo-trip",
    title: "도쿄 여행 ✈️",
    subtitle: "3박 4일 일정 · 맛집 · 쇼핑",
    status: "진행 중",
    progress: 70,
    image: "/mock-assets/topic-travel.png",
    meta: { comments: 12, files: 8, bookmarks: 25, updatedAt: "방금 전" }
  },
  {
    id: "invest-research",
    title: "투자 리서치 📈",
    subtitle: "미국 주식 · 성장주 중심",
    status: "검토 중",
    progress: 45,
    image: "/mock-assets/topic-invest.png",
    meta: { comments: 18, files: 7, bookmarks: 13, updatedAt: "1시간 전" }
  },
  {
    id: "blog-ideas",
    title: "블로그 아이디어 💡",
    subtitle: "AI 생산성, 자동화, 도구 리뷰",
    status: "초안",
    progress: 30,
    image: "/mock-assets/topic-blog.png",
    meta: { comments: 7, files: 3, bookmarks: 11, updatedAt: "어제" }
  }
];

export const activeDelegations = [
  { id: "tokyo-research", title: "도쿄 여행 조사 중", description: "항공권/숙소/날씨/교통 조사", progress: "65%", time: "2분 전", icon: Globe2, color: "violet" },
  { id: "tokyo-food", title: "도쿄 맛집 리스트업", description: "현지 인기 맛집 정리 중", progress: "40%", time: "5분 전", icon: Utensils, color: "blue" },
  { id: "stock-report", title: "AAPL, NVDA 리포트 분석", description: "실적/전망/밸류에이션 분석", progress: "75%", time: "10분 전", icon: BarChart3, color: "blue" },
  { id: "blog-draft", title: "블로그 초안 작성", description: "글 초안 작성 및 구조화", progress: "25%", time: "25분 전", icon: FileText, color: "green" }
];

export const scheduledTasks = [
  { id: "flight-price", title: "항공권 가격 모니터링", description: "도쿄 항공권 가격 변동 체크", cadence: "매일", time: "오전 09:00", icon: CalendarDays, color: "blue", enabled: true },
  { id: "market-report", title: "시장 리포트 요약", description: "미국 시장 주요 뉴스 요약", cadence: "월~금", time: "오전 08:30", icon: TrendingUp, color: "red", enabled: true },
  { id: "youtube-summary", title: "유튜브 영상 요약", description: "저장한 영상 자동 요약", cadence: "매일", time: "오후 07:00", icon: Send, color: "youtube", enabled: true },
  { id: "weekly-review", title: "주간 리뷰 알림", description: "주간 진행 상황 정리", cadence: "일요일", time: "오후 09:00", icon: Bell, color: "violet", enabled: true }
];
