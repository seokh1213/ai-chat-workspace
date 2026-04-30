INSERT INTO workspaces (id, name, ai_provider, ai_settings_json, created_at, updated_at)
SELECT 'ws_default', '개인 계획', 'local-rule', '{}', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM workspaces WHERE id = 'ws_default');

INSERT INTO plans (id, workspace_id, title, summary, due_date, status, current_view, created_at, updated_at)
SELECT
  'plan_sample',
  'ws_default',
  '새 프로젝트 준비',
  'AI와 같이 작업을 쪼개고, 캔버스/칸반/마인드맵으로 바라보는 샘플 계획',
  NULL,
  'active',
  'canvas',
  datetime('now'),
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE id = 'plan_sample');

INSERT INTO task_nodes (
  id, plan_id, parent_id, title, description, status, priority, due_date, x, y, sort_order, created_at, updated_at
)
SELECT 'task_sample_1', 'plan_sample', NULL, '목표 정리', '무엇을 끝내야 하는지 한 문장으로 정의합니다.', 'done', 'high', NULL, 120, 120, 1, datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM task_nodes WHERE id = 'task_sample_1');

INSERT INTO task_nodes (
  id, plan_id, parent_id, title, description, status, priority, due_date, x, y, sort_order, created_at, updated_at
)
SELECT 'task_sample_2', 'plan_sample', NULL, '작업 쪼개기', '큰 일을 30분에서 2시간 단위의 실행 가능한 작업으로 나눕니다.', 'in_progress', 'normal', NULL, 460, 130, 2, datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM task_nodes WHERE id = 'task_sample_2');

INSERT INTO task_nodes (
  id, plan_id, parent_id, title, description, status, priority, due_date, x, y, sort_order, created_at, updated_at
)
SELECT 'task_sample_3', 'plan_sample', 'task_sample_2', '우선순위 결정', '오늘 해야 할 것과 나중에 봐도 되는 것을 구분합니다.', 'todo', 'normal', NULL, 360, 340, 3, datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM task_nodes WHERE id = 'task_sample_3');

INSERT INTO task_links (id, plan_id, source_node_id, target_node_id, label, created_at)
SELECT 'link_sample_1', 'plan_sample', 'task_sample_1', 'task_sample_2', '다음', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM task_links WHERE id = 'link_sample_1');

INSERT INTO chat_sessions (id, plan_id, title, provider, model, status, settings_json, created_at, updated_at)
SELECT 'chat_sample', 'plan_sample', '초기 계획 상담', 'local-rule', NULL, 'idle', '{}', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM chat_sessions WHERE id = 'chat_sample');
