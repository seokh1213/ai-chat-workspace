# 공통 객체 / 상태 / API 정책

## 1. 문서 목적

이 문서는 개인형 Agent 플랫폼의 화면별 기획에서 반복 등장하는 객체, 상태, 권한, 동시성, 삭제, API 정책을 하나의 기준으로 정리한 공통 개발 문서다.

핵심 방향은 “사용자는 채팅으로 시작하고, 지속 관리 대상은 `topic`, 자료는 `source`/`memory`/`file_asset`, 실행은 `task`/`run`/`schedule`, 안전 제어는 `connection`/`credential`/`approval_request`/`audit_log`로 분리한다”이다. 화면별 문서에 있는 용어 차이는 아래 canonical 객체명과 enum을 우선한다.

## 2. 용어 경계

| 용어 | 공통 정의 | 화면별 충돌 정리 |
| --- | --- | --- |
| `topic` | 오래 살아 있는 작업공간. 여행, 리서치, 글쓰기, 프로젝트 같은 지속 맥락 | workspace/data space는 사용자 노출명 `주제`로 통일 |
| `conversation` | global/topic/run/agent_test/help scope를 가진 대화 묶음 | 채팅 메시지는 항상 conversation에 귀속 |
| `source` | 스크랩 inbox의 원자료. URL, 메모, 파일형 스크랩, 영상, 기사, PDF 원문 | 기억의 “출처 relation”과 혼동 금지. relation은 별도 link 객체 |
| `memory` | 검수되었거나 반복 사용 가치가 있는 장기 지식. 선호도, 결정, 자료, 사람, 프로젝트 | source 요약 그대로가 아니라 AI 참조 정책과 신뢰도 보유 |
| `file_asset` | 업로드/외부/생성 파일 원본 자산 | source가 파일을 읽는 경우 file_asset을 참조 가능 |
| `task` | 사용자가 관리하는 실행 항목. 할 일, 카드, 맵 노드 | AI가 실제 수행한 기록은 run |
| `run` | agent/tool 실행 이력. 수동, task 위임, schedule 실행, 테스트 실행 포함 | “맡긴 일” 화면의 핵심 단위 |
| `schedule` | 반복/예약 실행 규칙. 다음 run을 만드는 템플릿 | 캘린더에는 occurrence/event로 표시 |
| `agent` | tool/model/knowledge/permission을 묶어 실행하는 주체 | registry agent와 builder version을 분리 |
| `connection` | provider, MCP, 외부 API, 저장소, 검색/지도/코드 실행 연결 | 모델 provider도 connection의 category |
| `credential` | API key, OAuth, local token, service account 인증 재료 | 원문 재노출 금지 |
| `document` | source/memory/file을 근거로 만든 문서형 산출물 | help_article은 도움말 문서이고 이 document와 별도 가능 |
| `citation` | document 또는 답변 문장과 source/file/memory anchor의 근거 연결 | source 삭제 시 깨진 citation 상태 필요 |
| `approval_request` | 외부 쓰기, 비용 초과, 예약 실행, 권한 상승 전 승인 단위 | run/task/file/connection/settings 모두에서 생성 가능 |
| `audit_log` | 권한, 토큰, 비용, 실행 제어, 삭제, 외부 쓰기 감사 기록 | 민감 payload 저장 금지 |

## 3. 공통 필드 규칙

모든 주요 객체는 다음 필드를 기본 후보로 가진다.

| 필드 | 설명 |
| --- | --- |
| `id` | 객체별 prefix를 가진 안정 ID |
| `hubId` | 현재 개인/팀 허브 범위 |
| `ownerId` | 소유 사용자 또는 시스템 actor |
| `createdBy` | `user`, `agent`, `system`, `run`, `import` 등 생성 주체 |
| `createdAt`, `updatedAt` | ISO datetime |
| `archivedAt`, `deletedAt` | soft archive/delete 시각. 미적용 시 null |
| `version` | optimistic locking용 정수 또는 ETag |
| `permissionState` | 화면 액션 활성화에 쓰는 계산된 권한 상태 |
| `metadata` | 화면별 확장값. 핵심 검색/필터 필드는 metadata에 숨기지 않음 |

프론트 key는 항상 `id` 또는 안정적인 relation id를 사용한다. 배열 index, 제목, URL만으로 key를 만들지 않는다.

## 4. 핵심 객체 필드 후보

### 4.1 `topic`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId`, `ownerId` | 식별/범위/소유 |
| `title`, `emoji`, `description`, `type`, `coverImageUrl` | 카드와 상세 표시 |
| `status` | `draft`, `active`, `reviewing`, `archived`, `deleted` |
| `progressPercent`, `progressSource` | 카드/상세 공통 진행률 |
| `pinned`, `favorite` | 목록 정렬/고정 |
| `lastOpenedAt`, `lastActiveAt` | 최근 주제/정렬 |
| `stats` | `conversationCount`, `sourceCount`, `fileCount`, `memoryCount`, `artifactCount`, `runCount`, `scheduleCount`, `unreadActivityCount` |
| `nextAction` | 다음 액션 요약. task/schedule/topic_next_action 참조 |
| `permissionRole`, `connectionWarnings` | 읽기/편집/연결 문제 배지 |

### 4.2 `conversation`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId` | 식별/범위 |
| `scopeType` | `global`, `topic`, `run`, `agent_test`, `help` |
| `scopeId` | topicId/runId/agentId/helpArticleId 등 |
| `title`, `summary` | 대화 목록/검색 |
| `status` | `active`, `archived`, `deleted` |
| `messageCount`, `lastMessageAt` | 목록 표시 |
| `sourceRefs` | 대화 생성/답변에 참조한 source/file/memory |
| `createdAt`, `updatedAt` | 생성/수정 |

메시지 필드 후보는 `id`, `conversationId`, `role`, `content`, `attachments`, `toolCalls`, `citations`, `cost`, `status`, `createdAt`이다.

### 4.3 `source`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId` | 식별/범위 |
| `sourceType` | `url`, `memo`, `file`, `video`, `article`, `blog`, `pdf` |
| `status` | `pending`, `processing`, `summarized`, `failed`, `retrying`, `archived`, `deleting`, `deleted` |
| `provider` | `youtube`, `web`, `upload`, `google_drive`, `manual` 등 |
| `title`, `description`, `originalUrl`, `canonicalUrl`, `thumbnailUrl` | 원본 메타와 dedupe |
| `publisher`, `author`, `publishedAt`, `capturedAt` | 출처 정보 |
| `fileAssetId`, `fileName`, `fileSizeBytes`, `pageCount`, `durationSeconds`, `language` | 타입별 메타 |
| `summary`, `keyPoints`, `aiTags`, `userTags` | 처리 결과 |
| `permissionState`, `extractionState`, `failureReason`, `retryCount` | 처리/권한 |
| `topicLinks`, `memoryLinks`, `taskLinks`, `documentLinks` | relation 요약 |
| `favorite`, `archivedAt`, `createdBy`, `updatedAt` | 사용자 상태 |

긴 원문은 `source_content`로 분리한다. 필드 후보는 `rawText`, `extractedText`, `transcriptText`, `noteText`, `textChunks`, `transcriptSegments`, `pdfPages`이다.

### 4.4 `memory`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId` | 식별/범위 |
| `title`, `icon`, `summary`, `content` | 표시/AI 참조 본문 |
| `type` | `preference`, `decision`, `material`, `person`, `project` |
| `status` | `draft`, `review_required`, `active`, `excluded`, `archived`, `deleting`, `deleted` |
| `confidenceLevel`, `confidenceScore` | `high`, `medium`, `low`, `review_required`와 내부 점수 |
| `scope` | `global`, `topic`, `agent`, `excluded` |
| `topicIds`, `sourceLinks` | 사용 맥락과 근거 |
| `favorite`, `userVerified`, `sensitive` | UI/AI 참조 정책 |
| `lastUsedAt`, `lastConfirmedAt`, `deletedAt` | 사용/검수/삭제 |

`sourceLinks`는 source/file/conversation/message/topic/manual/import 근거를 모두 표현하는 relation이다. `source` 객체 자체와 이름이 겹치지 않게 API에서는 `memorySourceLinks` 사용을 권장한다.

### 4.5 `file_asset`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId`, `ownerId` | 식별/범위/소유 |
| `displayName`, `originalFileName`, `extension`, `mimeType`, `sizeBytes`, `checksum` | 원본 파일 정보 |
| `fileType`, `typeCategory` | `document`, `image`, `pdf`, `data`, `generated` |
| `folderId`, `sourceType`, `sourceLabel`, `sourceUrl`, `deviceName` | 탐색/출처 |
| `storageKey` | 내부 저장 위치. 클라이언트 노출 제한 |
| `permissionState`, `aiAccessPolicy` | 파일 접근과 AI 참조 허용 |
| `uploadStatus`, `scanStatus`, `extractionStatus`, `summaryStatus` | 처리 상태 |
| `summaryUpdatedAt`, `deletedAt` | 요약/삭제 |
| `connectionCounts`, `connectedTopics` | 목록 경량 표시 |

요약은 `file_summary`, 미리보기는 `file_preview`, 연결은 `file_connection`, 권한 상세는 `file_permission`, 활동은 `file_activity`로 분리 가능하다.

### 4.6 `task`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId`, `ownerId` | 식별/범위/소유 |
| `title`, `description` | 표시 |
| `status` | `backlog`, `today`, `scheduled`, `in_progress`, `blocked`, `waiting_approval`, `done`, `archived`, `deleted` |
| `priority`, `isUrgent` | `high`, `medium`, `low`, `none` |
| `topicIds`, `primaryTopicId` | 주제 연결 |
| `rootTaskId`, `parentTaskId` | 맵/markmap view의 root와 상위 task |
| `assigneeIds` | 담당자 |
| `deadlineAt`, `scheduledAt`, `remindAt`, `completedAt` | 시간 필드 |
| `progressPercent`, `progressSource` | `run`, `checklist`, `subtask`, `manual`, `status` |
| `sourceCount`, `conversationCount`, `fileCount` | 카드 카운트 |
| `delegatedRunId`, `scheduleId` | AI에게 맡기기 결과 |
| `createdBy`, `createdAt`, `updatedAt`, `archivedAt` | 생성/수정 |

하위 객체는 `checklist_item`, `ai_suggestion`, `task_link`, `task_dependency`, `task_map_view`, `task_map_node_position`으로 둔다. 체크리스트와 subtask는 구분한다. 체크리스트는 task 내부 완료 항목이고, subtask는 별도 task ID와 상태/마감/담당자를 가진다. 맵 edge에는 순환 의존성 검증이 필수다.

### 4.7 `run`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId` | 식별/범위 |
| `title`, `description`, `type` | `single_agent`, `multi_agent`, `scheduled`, `recurring`, `test` |
| `status` | canonical run status |
| `topicId`, `conversationId`, `taskId`, `scheduleId`, `agentId`, `agentVersionId` | 실행 맥락 |
| `progressPercent`, `remainingSeconds`, `elapsedSeconds` | 진행 |
| `createdAt`, `startedAt`, `endedAt`, `updatedAt` | 시간 |
| `cost` | `amount`, `currency`, `externalAmount`, `externalCurrency` |
| `agents`, `tools`, `latestLogs`, `artifactIds` | 상세 탭 요약 |
| `approvalSummary` | `pendingCount`, `urgentApprovalId` |
| `errorCode`, `errorMessage` | 실패 정보 |

`run_agent`, `run_tool`, `run_log`는 별도 테이블/리소스로 분리한다.

### 4.8 `schedule`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId` | 식별/범위 |
| `title`, `description`, `agentId`, `toolIds`, `topicId`, `taskId` | 실행 대상 |
| `runTemplateId`, `agentVersionId` | 실행 snapshot |
| `recurrenceRule`, `nextRunAt`, `timezone`, `estimatedDurationMinutes` | 반복/시간 |
| `status` | `draft`, `active`, `paused`, `failed`, `ended`, `archived`, `deleted` |
| `approvalPolicy` | `none`, `before_each_run`, `on_write`, `on_cost_threshold`, `always` |
| `costLimit`, `exceptionDates`, `overrides` | 비용/occurrence 예외 |
| `lastRunId`, `lastRunStatus` | 최근 실행 |

캘린더에 보이는 자동 작업은 schedule 자체가 아니라 `calendar_event` 또는 occurrence projection이다.

### 4.9 `agent`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId`, `ownerId` | 식별/범위/소유 |
| `name`, `description`, `icon`, `type`, `role` | registry 표시 |
| `status` | `draft`, `active`, `inactive`, `error`, `archived`, `deleted` |
| `instructionSummary`, `systemPrompt` | 기본 지침 |
| `providerId`, `modelId`, `fallbackModelId` | 모델 |
| `toolIds`, `knowledgeSourceIds` | 도구/지식 |
| `permissionMode`, `effectivePermissionMode` | 설정 권한과 계산 권한 |
| `monthlyCost`, `lastRunAt` | 운영 지표 |
| `deployedVersionId`, `draftVersionId` | builder lifecycle |
| `createdAt`, `updatedAt` | 생성/수정 |

`agent_version`은 graph 기반 builder의 draft/deployed snapshot이다. 필드 후보는 `id`, `agentId`, `versionNumber`, `status`, `graph`, `validationSummary`, `lastSavedAt`, `lastTestRunId`, `deployedAt`, `createdBy`이다.

### 4.10 `connection`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId`, `ownerType` | user/workspace/system |
| `displayName`, `description`, `iconUrl`, `category`, `providerKey` | 카드 표시 |
| `status` | `connected`, `degraded`, `error`, `expired`, `disabled`, `setup_required`, `cost_blocked` |
| `enabled` | 실행 후보 포함 여부 |
| `lastSyncedAt`, `lastHealthCheckedAt` | 상태 신선도 |
| `permissionSummary`, `monthlyUsageAmount`, `currency` | 카드 요약 |
| `capabilities`, `allowedTools` | 사용 가능 기능 |
| `createdAt`, `updatedAt` | 생성/수정 |

permission rule은 `connection` 기본값, `agent` override, `schedule/run` runtime approval 순으로 좁아질 수만 있다.

### 4.11 `credential`

| 필드 | 설명 |
| --- | --- |
| `id`, `connectionId`, `hubId` | 식별/범위 |
| `type` | `api_key`, `oauth`, `local_token`, `service_account`, `dev_token` |
| `maskedLabel`, `fingerprint` | 표시/감사 식별 |
| `status` | `valid`, `partial`, `expired`, `revoked`, `unknown`, `error` |
| `scopes`, `expiresAt`, `lastRotatedAt`, `lastValidatedAt`, `lastUsedAt` | 보안/수명 |
| `allowedOrigins`, `accessMethods` | Dev Mode token에 사용 |

credential 원문은 생성/교체 응답에서 한 번만 노출하고 저장 후 재조회하지 않는다.

### 4.12 `document`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId`, `ownerId` | 식별/범위 |
| `title`, `description`, `documentType` | `report`, `draft`, `artifact`, `help_article` 후보 |
| `status` | canonical document status |
| `sourceIds`, `fileAssetIds`, `memoryIds` | 근거 입력 |
| `body`, `bodyBlocks`, `plainText`, `summary` | 문서 본문 |
| `sourceSnapshotIds`, `citationCoverage`, `conflictCount`, `verificationStatus` | 저장 시점 근거 snapshot과 검증 지표 |
| `tone`, `audienceIds`, `templateId`, `outputFormat` | 리포트 빌더 생성 옵션 |
| `artifactId`, `topicId`, `runId` | 생성 맥락 |
| `createdAt`, `updatedAt`, `publishedAt` | 시간 |

도움말 화면의 `help_article`은 별도 CMS 객체로 시작할 수 있으나 검색/본문/버전/권한 패턴은 document와 호환되게 둔다.

리포트 빌더 작업면은 `report_builder_session`을 둘 수 있다. 필드 후보는 `id`, `userId`, `topicId`, `documentId`, `selectedSourceIds`, `templateId`, `tone`, `audienceIds`, `outputFormat`, `status`, `progressPercent`, `createdAt`, `updatedAt`이다. 세션은 편집/생성 진행 상태이고, 저장된 결과물은 document다.

### 4.13 `citation`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId` | 식별/범위 |
| `documentId`, `messageId`, `artifactId` | citation을 붙인 대상 |
| `targetRange` | 문서 블록/문장/문자 범위 |
| `sourceType` | `source`, `file_asset`, `memory`, `conversation`, `document`, `external_url` |
| `sourceId`, `sourceAnchor` | page, paragraph, timecode, chunk id, URL fragment |
| `quote`, `summary` | 짧은 근거 표시. 긴 원문 저장 지양 |
| `status` | `valid`, `stale`, `source_deleted`, `permission_blocked`, `conflict`, `unverified` |
| `strength`, `verificationStatus` | `strong`, `weak`, `unsupported`, `conflict`, `missing_source` 등 검증 결과 |
| `createdAt`, `updatedAt` | 시간 |

source/file/memory 삭제 또는 권한 변경 시 citation은 즉시 제거하지 않고 상태를 바꿔 문서 검증 UI가 깨진 근거를 표시하게 한다.

문서 검증용 하위 객체는 `source_anchor`, `source_conflict`, `verification_result`를 둔다. `source_anchor`는 page, timestamp, paragraph offset, cell range 같은 위치 정보를 저장한다. `source_conflict`는 충돌 주장과 관련 source anchor, 심각도, 추천 조치를 저장한다. `verification_result`는 문장 또는 표 셀 단위의 supported/weak/unsupported/conflict/missing_source 결과를 저장한다.

### 4.14 `approval_request`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId` | 식별/범위 |
| `requestType` | `external_write`, `booking`, `payment`, `cost_limit`, `permission`, `schedule_change`, `file_delete`, `data_export` |
| `status` | `pending`, `approved`, `rejected`, `expired`, `cancelled` |
| `title`, `description`, `payloadSummary` | 사용자 표시 |
| `targetType`, `targetId`, `targetLabel` | 영향 대상 |
| `runId`, `taskId`, `scheduleId`, `agentId`, `connectionId` | 생성 맥락 |
| `permissionScope`, `estimatedCost`, `expiresAt` | 승인 판단 정보 |
| `requestedBy`, `requestedByAgentId`, `resolvedBy` | actor |
| `createdAt`, `resolvedAt` | 시간 |
| `idempotencyKey`, `targetFingerprint` | 중복 외부 쓰기 방지 |

승인 직전 비용, 대상, 권한, credential 상태를 재검증한다. payload가 의미 있게 바뀌면 기존 승인을 무효화하고 재승인한다.

### 4.15 `audit_log`

| 필드 | 설명 |
| --- | --- |
| `id`, `hubId`, `occurredAt` | 식별/범위/시간 |
| `actorType`, `actorId`, `actorLabel` | user/system/agent/token |
| `accessMethod` | `web`, `tui`, `mcp`, `http_api`, `oauth`, `schedule`, `agent` |
| `action` | `created`, `updated`, `deleted`, `archived`, `approved`, `rejected`, `run_paused`, `credential_rotated`, `token_revoked` 등 |
| `resourceType`, `resourceId` | 대상 |
| `beforeSummary`, `afterSummary` | 민감값 제외 요약 |
| `scopeUsed`, `permissionResult` | 권한 판단 |
| `result`, `reason`, `requestId`, `traceId`, `latencyMs` | 추적/결과 |

audit log 저장 실패 시 credential 변경, 외부 쓰기, 파일 삭제, 권한 완화, Dev token 작업은 fail-closed가 기본이다.

## 5. 상태 모델

### 5.1 Canonical enum

| 대상 | 상태 |
| --- | --- |
| `topic` | `draft`, `active`, `reviewing`, `archived`, `deleted` |
| `conversation` | `active`, `archived`, `deleted` |
| `source` | `pending`, `processing`, `summarized`, `failed`, `retrying`, `archived`, `deleting`, `deleted` |
| `memory` | `draft`, `review_required`, `active`, `excluded`, `archived`, `deleting`, `deleted` |
| `file_asset` | `uploading`, `uploaded`, `scanning`, `scan_failed`, `extracting`, `summarizing`, `summarized`, `failed`, `restricted`, `archived`, `deleting`, `deleted` |
| `task` | `backlog`, `today`, `scheduled`, `in_progress`, `blocked`, `waiting_approval`, `done`, `archived`, `deleted` |
| `run` | `draft`, `queued`, `scheduled`, `running`, `approval_waiting`, `paused`, `resuming`, `stopping`, `stopped`, `retrying`, `succeeded`, `partially_succeeded`, `failed`, `expired`, `cancelled_by_system` |
| `schedule` | `draft`, `active`, `paused`, `failed`, `ended`, `archived`, `deleted` |
| `agent` | `draft`, `active`, `inactive`, `error`, `archived`, `deleted` |
| `agent_version` | `draft`, `validating`, `test_ready`, `testing`, `test_failed`, `test_passed`, `deploying`, `deployed`, `superseded`, `archived` |
| `connection` | `connected`, `degraded`, `error`, `expired`, `disabled`, `setup_required`, `cost_blocked` |
| `credential` | `valid`, `partial`, `expired`, `revoked`, `unknown`, `error` |
| `document` | `outline`, `drafting`, `generated`, `edited`, `verifying`, `verification_pending`, `verified`, `review_waiting`, `saved`, `exported`, `published`, `archived`, `deleted` |
| `citation` | `valid`, `stale`, `source_deleted`, `permission_blocked`, `conflict`, `unverified` |
| `approval_request` | `pending`, `approved`, `rejected`, `expired`, `cancelled` |

화면 표시 라벨은 자유롭게 현지화할 수 있지만 API enum은 위 값을 우선한다. 화면 문서의 `waitingApproval`, `completed`, `connected`, `healthy` 같은 camelCase/유사 상태는 canonical enum으로 매핑한다.

### 5.2 주요 상태 전이

`source`

```text
pending -> processing -> summarized
pending -> archived
processing -> summarized
processing -> failed
processing -> deleting -> deleted
failed -> retrying -> processing
summarized -> processing
summarized -> archived -> summarized
archived -> deleting -> deleted
```

`memory`

```text
draft -> review_required -> active
draft -> active
active -> excluded -> active
active -> archived -> active
active -> deleting -> deleted
review_required -> excluded
```

`task`

```text
backlog -> today -> in_progress -> done
backlog -> scheduled -> today
scheduled -> in_progress
in_progress -> blocked -> in_progress
in_progress -> waiting_approval -> in_progress
in_progress -> done
done -> archived
any non-deleted -> archived -> deleted
```

`run`

```text
draft
  -> scheduled -> queued
  -> queued -> running
running -> approval_waiting -> running
running -> approval_waiting -> paused
running -> paused -> resuming -> running
running -> stopping -> stopped
running -> retrying -> running
running -> succeeded
running -> partially_succeeded
running -> failed
running -> expired
running -> cancelled_by_system
failed -> retrying -> running
```

`schedule`

```text
draft -> active
active -> paused -> active
active -> failed -> active
active -> ended
active -> archived
paused -> archived
archived -> deleted
```

`agent_version`

```text
draft -> validating -> test_ready -> testing -> test_passed -> deploying -> deployed
testing -> test_failed -> draft
deployed -> superseded
draft -> archived
```

`approval_request`

```text
pending -> approved
pending -> rejected
pending -> expired
pending -> cancelled
```

모든 위험 상태 전이는 audit log를 남긴다. 위험 전이는 권한 변경, 파일 삭제, 외부 쓰기, 비용 한도 초과, run 제어, schedule 토글, credential/token 변경, agent 배포다.

## 6. 관계와 권한 전파

### 6.1 주요 관계

| 관계 | 설명 |
| --- | --- |
| topic - conversation | topic chat은 topicId를 scope로 가진 conversation |
| topic - source/file/memory/document/task/run/schedule | 주제 자료, 작업, 자동화, 산출물 연결 |
| source - file_asset | 파일형 source 또는 PDF URL 처리 결과가 원본 file_asset 참조 |
| source - memory | source 요약/원문을 근거로 memory 생성 |
| source/file/memory - citation - document/message | 문서/답변 근거 |
| task - run | AI에게 맡기기 결과 run 연결 |
| task - schedule | 반복 모니터링/알림 task의 schedule 연결 |
| run - schedule | schedule이 만든 실행 이력 |
| run - agent/agent_version | 실행 당시 agent snapshot |
| agent - connection/tool/credential | 실행 가능 도구와 모델 |
| connection - credential | 인증 재료. connection은 여러 credential 후보 가능 |
| approval_request - run/task/schedule/file/connection/settings | 승인 발생 맥락 |
| audit_log - 모든 위험 객체 | 변경/실행/승인/삭제 기록 |

### 6.2 권한 산출 우선순위

실행과 표시 권한은 다음 순서로 계산한다.

1. hub/workspace 정책
2. 객체 소유권과 공유 role
3. 객체 자체 정책
4. file/source/memory의 AI 참조 정책
5. connection permission rule
6. agent/node/schedule override
7. runtime approval result
8. credential 상태와 scope
9. 비용 정책

더 제한적인 정책이 우선한다. 예를 들어 connection은 `write`이지만 agent가 `read_only`면 실행 권한은 read-only다. 파일이 `AI 참조 제외`면 topic 멤버가 읽을 수 있어도 AI 분석/채팅 첨부는 차단 또는 확인 대상이다.

### 6.3 권한 전파 규칙

| 변경 | 전파 대상 |
| --- | --- |
| topic 권한 축소 | topic에 연결된 source/file/memory/task/run/schedule 표시와 액션 재계산 |
| file 권한 축소 | source 접근, memory 신뢰도, task/run 입력, citation 상태 재계산 |
| source 삭제/보관 | memory 출처 수, task 근거, document citation, related source 갱신 |
| memory excluded/archive | AI context 검색 제외, topic memory count 갱신 |
| connection disabled/expired | agent 도구, schedule 다음 실행, active run, source/file 재처리 차단 |
| credential revoked/expired | connection 상태와 실행 후보 재계산 |
| agent inactive/error | 새 run 생성 차단, 기존 schedule 영향 분석 |
| cost policy 축소 | 실행 중 run 일시정지 또는 승인 요청, schedule 활성화 차단 |

권한/연결/비용을 넓히는 변경은 저장 전 영향 분석과 확인이 필요하다.

## 7. ID / Key 정책

| 대상 | ID prefix 후보 | 안정 key |
| --- | --- | --- |
| topic | `topic_` | `topic.id` |
| conversation | `conv_` | `conversation.id` |
| message | `msg_` | `message.id` |
| source | `src_` | `source.id` |
| memory | `mem_` | `memory.id` |
| file_asset | `file_` | `file_asset.id` |
| task | `task_` | `task.id` |
| checklist_item | `chk_` | `checklist_item.id` |
| run | `run_` | `run.id` |
| schedule | `sch_` | `schedule.id` |
| agent | `agt_` | `agent.id` |
| agent_version | `agtv_` | `agent_version.id` |
| connection | `conn_` | `connection.id` |
| credential | `cred_` | `credential.id` |
| document | `doc_` | `document.id` |
| citation | `cite_` | `citation.id` |
| approval_request | `appr_` | `approval_request.id` |
| audit_log | `audit_` | `audit_log.id` |
| relation/link | `{type}link_` | relation id |

생성 API는 `clientRequestId` 또는 `clientGeneratedId`를 받는다. 동일 요청 재전송, 브라우저 새로고침, 오프라인 재시도에서 서버는 idempotency를 보장한다.

canonical URL dedupe, checksum dedupe, target fingerprint dedupe는 ID 대체물이 아니다. dedupe 판단 후에도 신규 생성/기존 연결/메모만 추가 중 하나를 사용자 또는 정책이 결정한다.

## 8. Optimistic Update / Rollback

### 8.1 적용 가능

| 액션 | optimistic 정책 |
| --- | --- |
| schedule active/paused 토글 | 즉시 토글, 실패 시 이전 상태 복구 |
| task 상태 드래그 | 즉시 컬럼 이동, 실패 시 원위치와 toast |
| favorite/bookmark/tag 변경 | 즉시 반영, 실패 시 해당 필드 rollback |
| topic/file/source/memory 연결 추가 | 임시 chip 표시, 실패 시 제거 |
| help article bookmark, code copy 상태 | 클라이언트 즉시 상태. 분석 이벤트 실패는 사용자 동작 유지 |
| agent draft autosave | local pending 표시 후 서버 확정 |

### 8.2 적용 금지 또는 제한

| 액션 | 정책 |
| --- | --- |
| 파일 삭제, 권한 완화, 외부 공유 | 영향 분석과 승인/확인 후 서버 확정 상태 표시 |
| 외부 쓰기, 결제, 예약 생성 | approval_request 또는 preflight 성공 전 확정 금지 |
| credential 교체/폐기 | 검증과 audit 성공 전 기존 credential 유지 |
| agent deploy | validation/test/impact 통과 후 서버 확정 |
| 비용 한도 축소 | 영향받는 run/schedule 확인 후 저장 |

### 8.3 Rollback 구현 기준

PATCH 계열 API는 `version` 또는 `If-Match`를 사용한다. 서버가 409를 반환하면 클라이언트는 최신 객체와 사용자의 draft를 비교해 다시 저장하게 한다. 단일 필드 실패는 해당 필드만 되돌리고, relation 실패는 임시 relation id를 제거한다.

실행성 액션은 중복 클릭 방지가 필요하다. 버튼은 pending 동안 비활성화하고 `idempotencyKey`를 함께 보낸다.

## 9. 동시성 / 중복 / 삭제 / 보관

### 9.1 동시성

| 상황 | 정책 |
| --- | --- |
| 같은 topic/task/file을 여러 세션에서 수정 | `version` 충돌 감지, 필드 단위 병합 가능 영역만 자동 병합 |
| agent builder draft 동시 수정 | graph patch 충돌을 node/edge 단위 diff로 표시 |
| 권한 변경 중 run 시작 | run 시작 직전 effective permission 재검증 |
| 비용 정책 변경 중 schedule 실행 | 실행 직전 비용 정책 재조회 |
| source 처리 중 삭제 | job 취소 요청 후 `deleting` 또는 `archived` 전환 |
| file 요약 중 권한 변경 | 다음 processing step 시작 전 권한 재검증 |

### 9.2 중복

| 대상 | 기준 | 처리 |
| --- | --- | --- |
| source URL | `canonicalUrl` | 기존 source 이동, 새 relation 추가, 새 메모 추가 중 선택 |
| file | `checksum`, 파일명, 크기 | checksum 같으면 중복 후보. 파일명만 같으면 별도 파일 |
| task | 제목, source, conversation, topic 유사도 | 중복 후보 표시, 자동 병합 금지 |
| approval_request | `idempotencyKey`, target fingerprint | 같은 외부 쓰기 중복 실행 방지 |
| schedule | agent/tool/topic/rrule 유사도 | 중복 자동 작업 경고 |

### 9.3 삭제와 보관

기본은 hard delete보다 archive/soft delete다. 완전 삭제는 개인정보, 보안, 사용자의 명시 요청, 법적 보존 정책을 함께 판단한다.

| 대상 | 기본 삭제 정책 | 영향 분석 |
| --- | --- | --- |
| topic | archive 우선, hard delete는 별도 확인 | conversation, source/file/memory relation, task, run, schedule, document |
| source | archive 또는 soft delete | memory 출처, task 근거, document citation, embedding |
| memory | `excluded`, `archived`, `deleted` 중 명확 선택 | topic, source, file, conversation, citation, agent knowledge |
| file_asset | soft delete 우선 | source, memory, chat attachment, run artifact, document citation |
| task | archive 우선 | checklist, dependency, run, schedule, calendar_event |
| run | 삭제보다 보관/숨김 | logs, artifacts, cost, audit |
| schedule | pause/archive 우선 | future occurrence, calendar_event, run template |
| agent | inactive/archive 우선 | schedule, run template, gallery/template relation |
| connection | disabled + credential revoke 우선 | agent, schedule, active run, source/file sync |
| credential | revoke/rotate | connection, audit, active token/session |
| document | archive 우선 | citation, topic/file/source relation |

삭제 전 `GET .../impact` API로 영향 범위를 계산한다. 삭제 후 검색/임베딩 인덱스에서는 즉시 제외하고, 비동기 삭제 지연은 UI에 `deleting`으로 표시한다.

## 10. API 설계 힌트

### 10.1 공통 API 규칙

| 규칙 | 내용 |
| --- | --- |
| 경로 | `/api/{resources}` 복수형 기준 |
| 목록 | 검색, 필터, 정렬, cursor/page, pageSize 지원 |
| 상세 | 목록 경량 필드와 상세 확장 필드 분리 |
| 쓰기 | PATCH는 부분 수정, PUT은 정책 전체 교체에만 사용 |
| 영향 분석 | 위험 변경 전 `/impact` 제공 |
| 승인 | 승인 필요 시 원 API 응답이 `approvalRequest`를 반환하고 실행은 보류 |
| 이벤트 | 진행률/상태/로그는 SSE 또는 WebSocket 우선, polling fallback |
| 보안 | credential/token/payload 원문은 응답과 로그에 포함 금지 |
| 멱등성 | 생성/실행/외부 쓰기/승인에는 `idempotencyKey` 사용 |
| 동시성 | `version`/ETag 기반 optimistic locking |

### 10.2 대표 API 후보

| 리소스 | API |
| --- | --- |
| today | `GET /api/today`, `GET /api/topics/recent`, `GET /api/runs/active`, `GET /api/schedules/upcoming` |
| conversation | `POST /api/conversations`, `POST /api/conversations/{conversationId}/messages`, `GET /api/conversations/{conversationId}` |
| topic | `GET /api/topics`, `POST /api/topics`, `GET/PATCH/DELETE /api/topics/{topicId}`, `GET /api/topics/{topicId}/impact`, `GET /api/topics/{topicId}/sources` |
| source | `GET /api/sources`, `POST /api/sources`, `POST /api/sources/upload`, `GET/PATCH/DELETE /api/sources/{sourceId}`, `POST /api/sources/{sourceId}/retry`, `GET /api/sources/{sourceId}/content` |
| memory | `GET /api/memories`, `POST /api/memories`, `GET/PATCH /api/memories/{memoryId}`, `POST /api/memories/{memoryId}/forget`, `POST /api/memories/extract` |
| file | `GET /api/files`, `POST /api/files/uploads`, `GET/PATCH/DELETE /api/files/{fileId}`, `GET /api/files/{fileId}/impact`, `POST /api/files/{fileId}/process` |
| task | `GET /api/tasks`, `GET /api/tasks/board`, `POST /api/tasks`, `GET/PATCH/DELETE /api/tasks/{taskId}`, `POST /api/tasks/{taskId}/delegate` |
| task map | `GET /api/tasks/map`, `GET/POST/PATCH/DELETE /api/tasks/map/views`, `POST /api/tasks/dependencies`, `DELETE /api/tasks/dependencies/{dependencyId}`, `POST /api/tasks/dependencies/validate` |
| run | `GET /api/runs`, `POST /api/runs`, `GET /api/runs/{runId}`, `POST /api/runs/{runId}/pause`, `resume`, `stop`, `retry`, `GET /api/runs/{runId}/logs` |
| schedule | `GET /api/schedules`, `POST /api/schedules`, `PATCH /api/schedules/{scheduleId}`, `PATCH /api/schedules/{scheduleId}/status`, `POST /api/schedules/{scheduleId}/run-now` |
| agent | `GET /api/agents`, `POST /api/agents`, `GET/PATCH /api/agents/{agentId}`, `GET /api/agents/{agentId}/impact`, `POST /api/agents/{agentId}/test-runs` |
| agent builder | `GET /api/agents/{agentId}/builder`, `PATCH /api/agents/{agentId}/versions/{versionId}/graph`, `POST /api/agents/{agentId}/versions/{versionId}/validate`, `test-runs`, `deploy` |
| connection | `GET /api/connections`, `POST /api/connections`, `GET/PATCH /api/connections/{connectionId}`, `GET /api/connections/{connectionId}/impact`, `PUT /permissions`, `PUT /limits` |
| credential | `POST /api/connections/{connectionId}/credentials/rotate`, `POST /api/connections/{connectionId}/oauth/reauthorize`, `DELETE /api/settings/credentials/{credentialId}` |
| document | `GET /api/documents`, `POST /api/documents`, `GET/PATCH /api/documents/{documentId}`, `POST /api/documents/{documentId}/verify` |
| citation | `GET /api/documents/{documentId}/citations`, `POST /api/documents/{documentId}/citations`, `PATCH /api/citations/{citationId}` |
| report builder | `GET /api/report-builder/sessions/{sessionId}`, `PATCH /api/report-builder/sessions/{sessionId}`, `POST /api/report-builder/sessions/{sessionId}/runs`, `POST /api/report-builder/runs/{runId}/cancel`, `GET /api/report-builder/runs/{runId}/events`, `POST /api/report-builder/sessions/{sessionId}/save-document` |
| approval | `GET /api/approval-requests`, `POST /api/approval-requests/{approvalId}/approve`, `POST /api/approval-requests/{approvalId}/reject` |
| audit | `GET /api/audit-logs` |

### 10.3 이벤트 후보

| 이벤트 | 사용처 |
| --- | --- |
| `topic.updated` | 최근 주제, 주제 목록, 상세 |
| `source.processing_updated` | 스크랩 목록/상세, 기억 후보 |
| `memory.updated` | 기억 목록, AI context index |
| `file.upload.progress`, `file.summary.completed`, `file.permission.updated` | 파일 목록/상세/채팅 첨부 |
| `task.status_changed`, `task.suggestion_applied`, `task.delegated` | 할 일 보드/상세 |
| `task.parent_changed`, `task.dependency_created`, `task.dependency_deleted`, `task.layout_applied` | 할 일 맵/저장 뷰 |
| `run.status_changed`, `run.log_created`, `run.artifact_created` | 오늘, 맡긴 일, 에이전트 실행 기록 |
| `schedule.status_changed`, `schedule.next_run_changed` | 오늘, 캘린더 |
| `connection.status_changed`, `credential.expired` | 연결, 에이전트, run/schedule 실행 가능 여부 |
| `approval.requested`, `approval.resolved` | 오늘, 맡긴 일, 알림 |
| `agent.version.deployed` | Agent Registry, builder |
| `document.citation_updated`, `document.verification_completed`, `source_conflict.updated` | 리포트 빌더, 문서 검증 |

## 11. 화면별 충돌 / 중복 정리

| 이슈 | 정리 |
| --- | --- |
| source와 memory의 출처 용어 충돌 | source는 원자료 객체, memory 출처는 `memorySourceLink` relation |
| run 상태 `waitingApproval` vs `approval_waiting` | API는 `approval_waiting`, 화면 라벨은 승인 대기 |
| approval 상태 `requested` vs `pending` | API는 `pending` |
| connection 상태 `healthy` vs `connected` | API는 `connected`, health check 성공을 의미 |
| credential 상태 `connected` 혼용 | credential은 `valid`, connection이 `connected` |
| file summary 상태와 file 전체 상태 혼용 | file_asset은 upload/scan/extraction/summary 상태를 분리 가능. 목록 대표 상태는 `summaryStatus` |
| schedule 토글 off 의미 | 삭제가 아니라 `paused`. 다음 실행 예약 해제, 기록 보존 |
| task `today` 컬럼과 오늘 화면명 충돌 | task 상태 `today`는 할 일 컬럼. 오늘 화면은 home/control tower |
| document와 help_article | help_article은 도움말 CMS 객체로 시작 가능. 리포트/산출물 document와 검색/버전 패턴만 공유 |
| agent test run과 실제 run | test run도 비용 집계에는 포함하되 실제 맡긴 일 목록에서는 `test` type/badge로 구분 |
| checklist와 subtask | checklist는 task 내부 항목, subtask는 별도 task. 맵에서는 둘 다 leaf처럼 보여도 데이터 모델은 분리 |
| report_builder_session과 document | session은 작업면 임시 상태, document는 저장된 산출물. 생성 run은 별도 run/report_generation_run으로 추적 |

## 12. 수용 기준

1. 모든 화면 문서는 위 canonical 객체명과 enum으로 API 필드명을 맞출 수 있다.
2. 각 핵심 객체는 목록 경량 필드와 상세 확장 필드가 분리되어 개발 가능하다.
3. run, source, memory, file_asset, task, schedule, agent_version, connection, credential, document, approval_request의 상태 전이가 정의되어 있다.
4. topic/source/memory/file/task/run/schedule/agent/connection 변경 전 영향 분석 대상이 명확하다.
5. 권한은 hub, 객체, AI 참조, connection, agent, runtime approval, credential, 비용 정책을 합산한 effective permission으로 계산된다.
6. connection rule보다 agent/schedule/node override가 넓어질 수 없다.
7. credential/token 원문은 저장 후 다시 노출되지 않고 audit log에도 남지 않는다.
8. optimistic update 적용 가능 액션과 금지 액션이 분리되어 있다.
9. 동시 수정은 `version` 또는 ETag로 충돌 감지하고, 위험 작업은 idempotency key를 사용한다.
10. 삭제/보관은 relation, citation, embedding, audit 보존 범위를 분리해 처리한다.
11. 파일 삭제, 권한 완화, 외부 쓰기, 결제, 비용 초과, schedule 생성/활성화, agent 배포는 승인/영향 분석/감사 로그 중 필요한 절차를 거친다.
12. source/file/memory 삭제 또는 권한 변경 시 document/message citation 상태가 갱신된다.
13. task에서 AI에게 맡기기는 run 또는 approval_request를 생성하고 task 상태/진행률과 연결된다.
14. schedule은 캘린더 occurrence와 run 생성 규칙을 분리해 관리된다.
15. 화면별 리스트 key는 안정 ID를 사용하고 새 relation에도 서버 확정 전 임시 ID가 있다.
16. 할 일 맵의 parent-child, dependency, saved view, node position은 task 본문/상태와 분리되어 저장된다.
17. 리포트 빌더는 document 저장 시 source snapshot, citations, conflicts, verification result를 함께 저장한다.

## 13. 오픈 질문

| 질문 | 결정 필요 이유 |
| --- | --- |
| 개인 허브 MVP 이후 팀/공유 허브 권한 모델을 언제 확정할지 | topic/file/memory/connection 권한 상속에 영향 |
| topic 삭제를 archive 기본으로 둘지 soft delete까지 허용할지 | 대화, 파일, run, schedule 보존 정책에 영향 |
| source `retrying`을 별도 상태로 유지할지 `processing + retryCount`로 단순화할지 | 스크랩 탭/카운트/API enum 복잡도 |
| file_asset과 파일형 source를 항상 1:1로 만들지 | PDF URL, Drive 파일, 업로드 파일의 중복 관리 |
| memory 완전 삭제 시 원본 conversation/file/source 삭제까지 연결할지 | 개인정보 삭제 기대와 감사/원본 보존 충돌 |
| document/help_article을 같은 테이블로 관리할지 | CMS, 검색, 버전 관리 구현 범위 |
| citation quote를 얼마나 저장할지 | 근거 표시 편의와 민감 원문 보존 위험 |
| run 실패 후 retry가 기존 run 상태를 바꿀지 새 run을 만들지 | 비용/로그/외부 쓰기 중복 추적 |
| schedule occurrence override 모델을 MVP에 포함할지 | 캘린더 반복 일정 정확도와 구현량 |
| agent builder의 graph/node/edge를 별도 리소스로 둘지 agent_version blob으로 둘지 | 부분 저장, 충돌 처리, 감사 로그 상세도 |
| approval_request를 run 단위로 묶어 보여줄지 요청 단위로 보여줄지 | 승인 대기 탭 UX와 API 구조 |
| 비용 통화를 USD로 통일할지 사용자 지역 통화 병기를 지원할지 | 설정/연결/맡긴 일 비용 표시 일관성 |
| audit log 보관 기간과 export 정책은 무엇인지 | 보안/운영/플랜 정책 |
| Dev Mode token과 Local Codex OAuth의 product 경계를 어떻게 노출할지 | 사용자 혼동과 credential 객체 분리 |
| provider fallback이 데이터 외부 전송을 유발할 때 기본 승인 정책은 무엇인지 | 개인정보와 비용 안전 |
| task 맵 root를 반드시 task로 둘지 topic root도 허용할지 | 프로젝트형 task와 주제 기반 탐색의 데이터 모델 차이 |
| document citation 번호를 source 목록 순서로 둘지 등장 순서로 둘지 | 저장 snapshot, source chip, 사용자 인식에 영향 |
