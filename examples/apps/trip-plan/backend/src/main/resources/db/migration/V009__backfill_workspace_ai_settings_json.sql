UPDATE workspaces
SET settings_json = '{"aiEffort":"medium"}'
WHERE settings_json = '{}';
