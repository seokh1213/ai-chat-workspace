# Mobile Editor Refactor Plan - 2026-05-17

## Non-Negotiables

- Do not commit until the user explicitly confirms.
- Keep Docker/backend/dev DB as-is; use the local Vite frontend only for fast UI feedback.
- Preserve the current working changes unless a new change directly replaces them.
- Keep newly touched frontend source files near 300 lines and below 400 lines when practical.
- New React components should use named exports and semantic controls.
- Migrate new/refactored UI toward Tailwind utilities; avoid adding more large global CSS blocks.

## UX Direction

- Do not keep desktop three-pane semantics on mobile.
- Mobile should have a clear navigation stack:
  - Workspace list -> trip editor
  - Trip editor -> itinerary, map, AI chat list
  - AI chat list -> AI chat detail
  - AI chat detail back button returns to AI chat list, not workspace list
- Mobile top bars should carry hierarchy and the current title.
- Prefer a top-right view switcher over persistent bottom tabs.
- Schedule mobile header should show:
  - left chevron
  - current trip title
  - compact destination/date
  - info button for trip metadata editing
  - menu/switcher button for itinerary/map/chat
- Map mobile header should remain lightweight and not stack a second title bar.
- Chat mobile detail should hide global switching and focus on conversation.

## Technical Direction

- [x] Split editor shells by layout responsibility:
  - `DesktopEditorShell`: current three-pane composition
  - `MobileEditorShell`: stack-based mobile composition
  - `EditorScreen`: orchestrates shared state and chooses shell
- [x] Do not use user-agent sniffing for separate builds.
- [x] Use viewport/window-size behavior for shell selection.
- Keep shared business actions in existing hooks; avoid duplicating data mutation logic.
- [x] Extract mobile-only top bars and menus into small TSX files.
- [x] Replace the existing `MobileBottomNav` path with a mobile view switcher.
- [x] Reduce reliance on one large `src/styles.css`; new mobile shell styling should be Tailwind-first.

## Tailwind Migration Strategy

- Keep existing global tokens in `styles.css` for now.
- Use Tailwind arbitrary values that reference CSS variables, e.g. `bg-[var(--surface)]`.
- [x] Move newly extracted mobile layout pieces to `className` utilities.
- [x] Remove obsolete mobile bottom-nav CSS once the component is no longer rendered.
- Defer full legacy CSS deletion until components no longer depend on it.

## Progress Notes

- 2026-05-17: `EditorScreen` reduced to shell selection.
- 2026-05-17: Added `DesktopEditorShell`, `MobileEditorShell`, `MobileItineraryView`, `MobileMapView`, `MobileTripTopBar`, `MobileViewSwitcher`, `MobileDayStrip`.
- 2026-05-17: Removed old `MobileBottomNav` and `EditorMobileMapHeader`.
- 2026-05-17: Replaced the map day strip with Tailwind mobile component.
- 2026-05-17: Added mobile chat header safe-area handling in the mobile shell.
- 2026-05-17: Removed obsolete `editor-shell.mobile-*` CSS.
- 2026-05-17: Replaced the top-right popover with a right-side navigation drawer/sheet.
- 2026-05-17: Tuned drawer opening to remove the extra frame delay, enlarged/centered icons, and added menu separators.
- 2026-05-17: Changed mobile chat-list back button from CSS media control to an explicit mobile shell prop.
- 2026-05-17: Removed stale `mobile-*` editor shell class generation from `useEditorScreenState`.
- 2026-05-17: Changed the mobile chat collapse button from CSS hiding to explicit mobile shell rendering control.
- 2026-05-17: Reduced `styles.css` from 3467 to 3055 lines. It briefly reached 3064 before small drawer animation keyframes were added, then mobile CSS cleanup brought it down again.
- 2026-05-17: Removed mobile drawer animation keyframes and changed the drawer to immediate open/close with explicit centered Lucide icon sizing and flat separators.
- 2026-05-17: Replaced numbered CSS chunks with scoped style folders: `global`, `common`, `workspace`, `setup`, `editor`, `map`, `chat`, and `responsive`. `src/styles.css` is now only Tailwind plus scoped imports, and every CSS file is below 400 lines.
- 2026-05-17: Added Tailwind-first mobile itinerary/place sections and mobile edit forms, so the mobile schedule list no longer depends on desktop sidebar CSS or the old mobile responsive overrides.
- 2026-05-17: Converted trip metadata editing controls to Tailwind-first sizing; mobile date inputs now stack on narrow widths and keep a 44px touch target.
- 2026-05-17: Added `EditorChatPanel` as a shared chat adapter so desktop and mobile editor shells no longer duplicate the long `ChatPanel` prop wiring.
- 2026-05-17: Split the editor chat contract into `EditorChatProps`; `EditorChatPanel` no longer receives the whole `EditorScreenProps` or the whole editor state.
- 2026-05-17: Moved chat pending status and operation preview styling to Tailwind utilities, then removed the matching legacy selectors from `chat/messages.css`.
- 2026-05-17: Added shared mobile modal focus/scroll handling for itinerary/place edit forms with dialog semantics and Escape close support.
- 2026-05-17: Removed confirmed dead selectors from editor/sidebar, setup, common controls, and map CSS.
- 2026-05-17: Frontend production build passes after shell split.

## Verification

- `npm run build` from `frontend`.
- `git diff --check`.
- Verify the running Vite server still serves `http://100.73.37.58:18082/`.
- If browser automation is unavailable, report that and rely on build/curl/HMR logs.

## Open Risks

- Legacy CSS is now split under the line-limit harness, but semantic cleanup and deeper Tailwind migration are still staged work.
- `EditorScreenProps` is still wide for itinerary/map responsibilities. Chat is now separated, but planner/map props need the same responsibility-based split.
- Mobile history currently only tracks `details | map | chat`; chat detail needs clearer stack semantics.
- Map topbar/day-strip height is still based on fixed positioning. A later pass should replace the fixed top offset with an explicit layout row or measured CSS variable.
