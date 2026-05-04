# Seed Data Plan

Initial data must be separate SQL, not Kotlin code, JS import code, or mixed Flyway schema migration.

## Rules

- Schema migrations live under `backend/src/main/resources/db/migration`.
- Seed SQL lives under `backend/src/main/resources/db/seed`.
- Seed SQL is opt-in and applied by a controlled app command or dev-only bootstrap runner.
- Real external trip data is not committed as application seed data.
- Okinawa source data remains outside the rebuilt app codebase unless explicitly converted into an external SQL seed for local use.

## Planned Files

```text
backend/src/main/resources/db/migration/
  V001__init_core_schema.sql
  V002__init_chat_schema.sql
  V003__init_ai_provider_schema.sql
  V004__init_ai_edit_schema.sql

backend/src/main/resources/db/seed/
  001_default_workspace.sql
```

The current planning copy is stored at:

```text
docs/seed/001_default_workspace.sql
```

The backend scaffold stores the runtime copy at:

```text
backend/src/main/resources/db/seed/001_default_workspace.sql
```

## Seed Runner

The backend should expose a development-only runner, not a public production API.

Acceptable options:

- Spring profile `dev` startup runner guarded by config
- CLI-style application command
- test fixture setup

Not acceptable:

- Public import endpoint enabled by default
- Hardcoded Kotlin seed objects
- Importing `legacy-node/data/plan.js` or `legacy-node/data/places.js` inside the new app runtime
- Mixing seed rows into schema migration files

## External Trip Data

External data, such as the user's Okinawa plan, can be converted to SQL separately.

Recommended local-only location:

```text
../external-seeds/
  okinawa.sql
```

That external SQL should insert into the same tables, but it should not become part of the generic app seed.
