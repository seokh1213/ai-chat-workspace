(function () {
  let places = window.OKINAWA_PLACES || [];
  let initialPlan = window.OKINAWA_PLAN || { title: "오키나와 여행", days: [] };
  const planKey = "okinawa-trip-planner-plan";
  const layoutKey = "okinawa-trip-planner-layout";
  const state = {
    filter: "all",
    query: "",
    day: 1,
    plan: loadStoredPlan(),
    map: null,
    layers: [],
    markers: new Map(),
    highlightTimer: null,
    sidebarCollapsed: {
      schedule: false,
      places: false,
    },
    panelsCollapsed: {
      sidebar: false,
      chat: false,
    },
    expandedPlanItems: new Set(),
    editingPlanId: null,
    aiPending: false,
    messages: [
      {
        role: "assistant",
        text:
          "일정과 조사 장소를 같이 보고 있어요. 장소 추가는 `Day 2에 코우리해변 추가해줘`처럼 말하면 바로 반영합니다.",
      },
    ],
  };

  const $ = (selector) => document.querySelector(selector);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
  const debugEnabled = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const debug = (...args) => {
    if (debugEnabled) console.debug("[trip-planner]", ...args);
  };
  const normalize = (value) =>
    String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^0-9a-z가-힣ぁ-んァ-ン一-龥]+/g, "");

  async function init() {
    loadLayoutState();
    await loadServerState();
    bindEvents();
    initResizablePanes();
    renderPlaces();
    renderDayTabs();
    renderPlan();
    renderSidebarSections();
    renderPanelVisibility();
    renderChat();
    initMap();
    if (window.lucide) window.lucide.createIcons();
  }

  function bindEvents() {
    $("#place-search").addEventListener("input", (event) => {
      state.query = event.target.value;
      renderPlaces();
    });

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        renderPlaces();
      });
    });

    document.querySelectorAll("[data-toggle-section]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleSidebarSection(button.dataset.toggleSection);
      });
    });

    document.querySelectorAll("[data-toggle-panel]").forEach((button) => {
      button.addEventListener("click", () => {
        togglePanel(button.dataset.togglePanel);
      });
    });

    document.querySelectorAll("[data-open-panel]").forEach((button) => {
      button.addEventListener("click", () => {
        setPanelCollapsed(button.dataset.openPanel, false);
      });
    });

    $("#rollback-latest").addEventListener("click", rollbackLatestCheckpoint);

    $("#chat-input").addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        $("#chat-form").requestSubmit();
      }
    });

    $("#chat-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.aiPending) return;
      const input = $("#chat-input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      addMessage("user", text);
      setAiPending(true);
      try {
        const localAction = await applyLocalIntent(text);
        if (localAction) addMessage("assistant", localAction);
        const reply = await requestAi(text);
        if (reply) addMessage("assistant", reply);
      } finally {
        setAiPending(false);
      }
    });
  }

  function initResizablePanes() {
    const shell = $(".app-shell");
    const layout = readLayout();
    const savedChatWidth = Number(layout.chatWidth);

    if (Number.isFinite(savedChatWidth)) shell.style.setProperty("--chat-width", `${clamp(savedChatWidth, 320, 640)}px`);

    bindResizer("#shell-resizer", (event) => {
      const rect = shell.getBoundingClientRect();
      const max = Math.min(640, rect.width - 560);
      const width = clamp(rect.right - event.clientX - 12, 320, max);
      shell.style.setProperty("--chat-width", `${Math.round(width)}px`);
      saveLayout({ chatWidth: Math.round(width) });
    });
  }

  function bindResizer(selector, onMove) {
    const handle = $(selector);
    if (!handle) return;
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      document.body.classList.add("is-resizing");
      const move = (moveEvent) => {
        onMove(moveEvent);
        refreshMapSize();
      };
      const up = () => {
        document.body.classList.remove("is-resizing");
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        refreshMapSize();
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up, { once: true });
    });
  }

  function readLayout() {
    try {
      return JSON.parse(localStorage.getItem(layoutKey) || "{}");
    } catch {
      return {};
    }
  }

  function saveLayout(next) {
    const current = readLayout();
    localStorage.setItem(layoutKey, JSON.stringify({ ...current, ...next }));
  }

  async function loadServerState() {
    try {
      const response = await fetch("/api/state");
      if (!response.ok) return;
      const data = await response.json();
      setPlannerState(data);
    } catch {
      // Static JS data remains the fallback when the local server is unavailable.
    }
  }

  function setPlannerState(data) {
    if (data?.places?.length) places = data.places;
    if (data?.plan?.days?.length) {
      initialPlan = data.plan;
      state.plan = structuredClone(data.plan);
    }
  }

  async function commitOperations(operations, reason) {
    try {
      const response = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operations,
          reason,
          source: "ui",
        }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      setPlannerState(data);
      renderPlaces();
      renderDayTabs();
      renderPlan();
      renderSidebarSections();
      renderPanelVisibility();
      return true;
    } catch {
      return false;
    }
  }

  async function rollbackLatestCheckpoint() {
    try {
      const checkpointsResponse = await fetch("/api/checkpoints");
      if (!checkpointsResponse.ok) throw new Error("checkpoint list unavailable");
      const checkpointsData = await checkpointsResponse.json();
      const checkpoint = checkpointsData.checkpoints?.[0];
      if (!checkpoint) {
        addMessage("assistant", "되돌릴 변경이 없습니다.");
        return;
      }

      const rollbackResponse = await fetch(`/api/checkpoints/${encodeURIComponent(checkpoint.id)}/rollback`, {
        method: "POST",
      });
      if (!rollbackResponse.ok) throw new Error("rollback failed");
      const data = await rollbackResponse.json();
      setPlannerState(data);
      renderPlaces();
      renderDayTabs();
      renderPlan();
      renderSidebarSections();
      renderPanelVisibility();
      addMessage("assistant", "최근 변경을 되돌렸습니다.");
    } catch {
      addMessage("assistant", "되돌리기를 처리하지 못했습니다. 서버 상태를 확인해주세요.");
    }
  }

  function loadLayoutState() {
    const layout = readLayout();
    if (layout.sidebarCollapsed) {
      state.sidebarCollapsed = {
        ...state.sidebarCollapsed,
        ...layout.sidebarCollapsed,
      };
    }
    if (layout.panelsCollapsed) {
      state.panelsCollapsed = {
        ...state.panelsCollapsed,
        ...layout.panelsCollapsed,
      };
    }
  }

  function toggleSidebarSection(sectionName) {
    if (!(sectionName in state.sidebarCollapsed)) return;
    state.sidebarCollapsed[sectionName] = !state.sidebarCollapsed[sectionName];
    saveLayout({ sidebarCollapsed: state.sidebarCollapsed });
    renderSidebarSections();
  }

  function renderSidebarSections() {
    Object.entries(state.sidebarCollapsed).forEach(([sectionName, collapsed]) => {
      const section = document.querySelector(`[data-sidebar-section="${sectionName}"]`);
      const button = document.querySelector(`[data-toggle-section="${sectionName}"]`);
      if (!section || !button) return;
      section.classList.toggle("collapsed", collapsed);
      button.setAttribute("aria-expanded", String(!collapsed));
    });
    if (window.lucide) window.lucide.createIcons();
    refreshMapSize();
  }

  function togglePanel(panelName) {
    setPanelCollapsed(panelName, !state.panelsCollapsed[panelName]);
  }

  function setPanelCollapsed(panelName, collapsed) {
    if (!(panelName in state.panelsCollapsed)) return;
    state.panelsCollapsed[panelName] = Boolean(collapsed);
    saveLayout({ panelsCollapsed: state.panelsCollapsed });
    renderPanelVisibility();
  }

  function renderPanelVisibility() {
    const shell = $(".app-shell");
    shell.classList.toggle("sidebar-collapsed", state.panelsCollapsed.sidebar);
    shell.classList.toggle("chat-collapsed", state.panelsCollapsed.chat);

    const sidebarOpenButton = document.querySelector('[data-open-panel="sidebar"]');
    const chatOpenButton = document.querySelector('[data-open-panel="chat"]');
    if (sidebarOpenButton) sidebarOpenButton.hidden = !state.panelsCollapsed.sidebar;
    if (chatOpenButton) chatOpenButton.hidden = !state.panelsCollapsed.chat;

    document.querySelectorAll('[data-toggle-panel="sidebar"]').forEach((button) => {
      button.setAttribute("aria-expanded", String(!state.panelsCollapsed.sidebar));
    });
    document.querySelectorAll('[data-toggle-panel="chat"]').forEach((button) => {
      button.setAttribute("aria-expanded", String(!state.panelsCollapsed.chat));
    });

    if (window.lucide) window.lucide.createIcons();
    refreshMapSize();
  }

  function loadStoredPlan() {
    try {
      const saved = JSON.parse(localStorage.getItem(planKey) || "null");
      if (saved?.days?.length) return saved;
    } catch {
      return structuredClone(initialPlan);
    }
    return structuredClone(initialPlan);
  }

  function persistPlan() {
    localStorage.setItem(planKey, JSON.stringify(state.plan));
  }

  function refreshMapSize() {
    if (!state.map) return;
    requestAnimationFrame(() => state.map.invalidateSize(false));
  }

  function renderPlaces() {
    const list = $("#place-list");
    const query = normalize(state.query);
    const visible = places.filter((place) => {
      const statusOk = state.filter === "all" || place.status === state.filter;
      const queryOk = !query || normalize(`${place.name} ${place.category} ${place.note}`).includes(query);
      return statusOk && queryOk;
    });
    list.innerHTML = visible
      .map(
        (place) => `
          <article class="place-item" data-place-id="${place.id}">
            <div class="place-title">
              <h3>${escapeHtml(place.name)}</h3>
            </div>
            <div class="meta">${escapeHtml([place.category, ratingText(place)].filter(Boolean).join(" · "))}</div>
            ${place.note ? `<div class="note">${escapeHtml(place.note)}</div>` : ""}
            <div class="row-actions">
              ${place.lat && place.lng ? iconButton("map-pin", "지도에서 보기", `focusPlace('${place.id}')`) : ""}
              <button class="text-button" type="button" onclick="addPlaceToCurrentDay('${place.id}')">Day ${state.day} 추가</button>
            </div>
          </article>
        `,
      )
      .join("");
    if (window.lucide) window.lucide.createIcons();
  }

  function renderDayTabs() {
    $("#day-tabs").innerHTML = state.plan.days
      .map(
        (day) => `
          <button class="day-tab ${day.day === state.day ? "active" : ""}" type="button" onclick="setDay(${day.day})">
            <strong>Day ${day.day}</strong>
            <span>${day.date} (${day.weekday})</span>
          </button>
        `,
      )
      .join("");
  }

  function renderPlan() {
    const day = state.plan.days.find((item) => item.day === state.day);
    const items = day ? day.items : [];
    $("#plan-list").innerHTML = items
      .map(
        (item) => `
          <article class="plan-item ${state.expandedPlanItems.has(item.id) ? "expanded" : ""} ${
            state.editingPlanId === item.id ? "editing" : ""
          }" data-plan-id="${item.id}">
            ${state.editingPlanId === item.id ? renderPlanEditor(item) : renderPlanReadView(item)}
          </article>
        `,
      )
      .join("");
    renderMapMarkers();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderPlanReadView(item) {
    return `
      <div class="plan-time">${escapeHtml(item.time || item.typeLabel || "")}</div>
      <div class="plan-content">
        <div class="plan-title">
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <div class="meta">${escapeHtml(item.category || item.type)}</div>
        ${renderPlanMemo(item)}
      </div>
      <div class="row-actions">
        ${item.lat && item.lng ? iconButton("map-pin", "지도에서 보기", `focusPlan('${item.id}')`) : ""}
        <button class="icon-button" type="button" title="편집" aria-label="편집" onclick="editPlanItem('${item.id}')">
          <i data-lucide="pencil"></i>
        </button>
        <button class="icon-button" type="button" title="위로" aria-label="위로" onclick="movePlanItem('${item.id}', -1)">
          <i data-lucide="arrow-up"></i>
        </button>
        <button class="icon-button" type="button" title="아래로" aria-label="아래로" onclick="movePlanItem('${item.id}', 1)">
          <i data-lucide="arrow-down"></i>
        </button>
        <button class="icon-button" type="button" title="삭제" aria-label="삭제" onclick="removePlanItem('${item.id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;
  }

  function renderPlanEditor(item) {
    return `
      <form class="plan-edit-form" onsubmit="savePlanEdit(event, '${item.id}')">
        <div class="plan-edit-grid">
          <label>
            <span>시간</span>
            <input name="time" value="${escapeHtml(item.time || "")}" placeholder="예: 12:30" />
          </label>
          <label>
            <span>분류</span>
            <input name="category" value="${escapeHtml(item.category || "")}" placeholder="관광명소" />
          </label>
        </div>
        <label>
          <span>제목</span>
          <input name="title" value="${escapeHtml(item.title || "")}" required />
        </label>
        <label>
          <span>메모</span>
          <textarea name="memo" rows="5">${escapeHtml(cleanMemo(item.memo))}</textarea>
        </label>
        <div class="plan-edit-actions">
          <button class="text-button primary" type="submit">저장</button>
          <button class="text-button" type="button" onclick="cancelPlanEdit()">취소</button>
        </div>
      </form>
    `;
  }

  function initMap() {
    if (!window.L) {
      $("#map").innerHTML = `<div class="map-fallback">지도 라이브러리를 불러오지 못했습니다.</div>`;
      return;
    }
    const savedView = readMapHash();
    state.map = L.map("map", { zoomControl: false }).setView([savedView.lat, savedView.lng], savedView.zoom);
    L.control.zoom({ position: "bottomright" }).addTo(state.map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(state.map);
    state.map.on("moveend", writeMapHash);
    addMapLegend();
    renderMapMarkers();
  }

  function readMapHash() {
    const fallback = { lat: 26.45, lng: 127.87, zoom: 9 };
    const match = window.location.hash.match(/(?:^#|&)map=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+)/);
    if (!match) return fallback;
    const view = {
      lat: Number(match[1]),
      lng: Number(match[2]),
      zoom: Number(match[3]),
    };
    const valid =
      Number.isFinite(view.lat) &&
      Number.isFinite(view.lng) &&
      Number.isFinite(view.zoom) &&
      view.lat >= 20 &&
      view.lat <= 30 &&
      view.lng >= 120 &&
      view.lng <= 135 &&
      view.zoom >= 6 &&
      view.zoom <= 19;
    return valid ? view : fallback;
  }

  function writeMapHash() {
    if (!state.map) return;
    const center = state.map.getCenter();
    const nextHash = `#map=${center.lat.toFixed(5)},${center.lng.toFixed(5)},${state.map.getZoom()}`;
    if (window.location.hash === nextHash) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }

  function renderMapMarkers() {
    if (!state.map) return;
    if (state.highlightTimer) {
      window.clearInterval(state.highlightTimer);
      state.highlightTimer = null;
    }
    state.layers.forEach((layer) => layer.remove());
    state.layers = [];
    state.markers.clear();

    const placeGroups = groupByCoordinate(places.filter((place) => place.lat && place.lng));
    placeGroups.forEach(addPlaceGroupMarker);

    const currentDaySequence = new Map(currentDayRouteItems().map((item, index) => [item.id, index + 1]));
    const planItems = state.plan.days
      .flatMap((day) =>
        day.items.map((item) => ({
          ...item,
          day: day.day,
          isSelectedDay: day.day === state.day,
          sequence: day.day === state.day ? currentDaySequence.get(item.id) : null,
        })),
      )
      .filter((item) => item.lat && item.lng);
    const planGroups = groupByCoordinate(planItems);
    planGroups.forEach(addPlanGroupMarker);
    addDayRoute();
  }

  function addDayRoute() {
    const routeItems = currentDayRouteItems();
    if (routeItems.length === 0) return;

    const path = routeItems.map((item) => [item.lat, item.lng]);
    if (path.length >= 2) {
      const halo = L.polyline(path, {
        color: "#ffffff",
        weight: 8,
        opacity: 0.86,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }).addTo(state.map);
      const route = L.polyline(path, {
        color: varColor("--route"),
        weight: 4,
        opacity: 0.84,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }).addTo(state.map);
      state.layers.push(halo, route);
    }

    routeItems.forEach((item, index) => {
      const sequence = L.marker([item.lat, item.lng], {
        interactive: false,
        icon: L.divIcon({
          className: "route-sequence-marker",
          html: `<span>${index + 1}</span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(state.map);
      state.layers.push(sequence);
    });
  }

  function currentDayRouteItems() {
    const day = state.plan.days.find((item) => item.day === state.day);
    if (!day) return [];
    return day.items.filter((item) => item.lat && item.lng);
  }

  function groupByCoordinate(items) {
    const groups = new Map();
    items.forEach((item) => {
      const key = coordinateKey(item.lat, item.lng);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return Array.from(groups.values());
  }

  function coordinateKey(lat, lng) {
    return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
  }

  function addPlanGroupMarker(group) {
    const first = group[0];
    const hasSelectedDayItem = group.some((item) => item.isSelectedDay);
    const marker = addGroupedMarker(first.lat, first.lng, varColor("--blue"), planPopupHtml(group), {
      fillOpacity: hasSelectedDayItem ? 0.9 : 0.48,
      radius: hasSelectedDayItem ? 7 : 6,
      weight: hasSelectedDayItem ? 2 : 1.5,
    });
    group.forEach((item) => state.markers.set(`plan:${item.id}`, marker));
  }

  function addPlaceGroupMarker(group) {
    const first = group[0];
    const marker = addGroupedMarker(first.lat, first.lng, varColor("--coral"), placePopupHtml(group), {
      fillOpacity: 0.58,
      radius: 6,
      weight: 1.5,
    });
    group.forEach((place) => state.markers.set(`place:${place.id}`, marker));
  }

  function addGroupedMarker(lat, lng, color, popupHtml, options = {}) {
    const marker = L.circleMarker([lat, lng], {
      radius: options.radius || 7,
      color,
      fillColor: color,
      fillOpacity: options.fillOpacity ?? 0.86,
      weight: options.weight || 2,
    }).addTo(state.map);
    marker.bindPopup(popupHtml);
    state.layers.push(marker);
    return marker;
  }

  function planPopupHtml(group) {
    const sorted = group.slice().sort(sortPlanPopupItems);
    const first = sorted[0];
    const sameTitle = sorted.every((item) => normalize(item.title) === normalize(first.title));
    const title = sameTitle ? first.title : `${sorted.length}개 일정`;
    return `
      <div class="pin-popup">
        <div class="pin-label">📅 ${escapeHtml(title)}</div>
        <div class="pin-list">
          ${sorted
            .map(
              (item) => `
                <div class="pin-row">
                  <span class="pin-tag">${item.sequence ? `${item.sequence}번째` : `Day ${item.day}`}</span>
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml([item.time, item.category].filter(Boolean).join(" · "))}</span>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function sortPlanPopupItems(a, b) {
    if (a.isSelectedDay !== b.isSelectedDay) return a.isSelectedDay ? -1 : 1;
    if (a.isSelectedDay && b.isSelectedDay) return (a.sequence || 0) - (b.sequence || 0);
    return a.day - b.day || String(a.time || "").localeCompare(String(b.time || ""));
  }

  function placePopupHtml(group) {
    const title = group.length === 1 ? group[0].name : `${group.length}개 조사 장소`;
    return `
      <div class="pin-popup">
        <div class="pin-label">📍 ${escapeHtml(title)}</div>
        <div class="pin-list">
          ${group
            .map(
              (place) => `
                <div class="pin-row">
                  <span class="pin-tag">조사</span>
                  <div>
                    <strong>${escapeHtml(place.name)}</strong>
                    <span>${escapeHtml([place.category, ratingText(place)].filter(Boolean).join(" · "))}</span>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function addMapLegend() {
    const legend = L.control({ position: "bottomleft" });
    legend.onAdd = () => {
      const element = L.DomUtil.create("div", "map-legend");
      element.innerHTML = `
        <div class="legend-row"><span class="legend-line"></span><span>선택 Day 동선</span></div>
        <div class="legend-row"><span class="legend-dot plan"></span><span>📅 일정</span></div>
        <div class="legend-row"><span class="legend-dot place"></span><span>📍 조사 장소</span></div>
      `;
      L.DomEvent.disableClickPropagation(element);
      return element;
    };
    legend.addTo(state.map);
  }

  function highlightMarker(key) {
    const marker = state.markers.get(key);
    if (!marker) return;
    if (state.highlightTimer) window.clearInterval(state.highlightTimer);

    const baseRadius = marker.options.radius || 7;
    const baseWeight = marker.options.weight || 2;
    const baseOpacity = marker.options.fillOpacity || 0.82;
    const radii = [11, 15, 11, 14, 9, baseRadius];
    let index = 0;

    marker.openPopup();
    marker.setStyle({ fillOpacity: 1, weight: 4 });
    marker.bringToFront();
    state.highlightTimer = window.setInterval(() => {
      marker.setRadius(radii[index]);
      index += 1;
      if (index >= radii.length) {
        window.clearInterval(state.highlightTimer);
        state.highlightTimer = null;
        marker.setRadius(baseRadius);
        marker.setStyle({ fillOpacity: baseOpacity, weight: baseWeight });
      }
    }, 120);
  }

  function renderChat() {
    const log = $("#chat-log");
    const pending = state.aiPending
      ? `<div class="message assistant pending-message" aria-live="polite">
          <span class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>응답을 기다리는 중입니다</span>
        </div>`
      : "";
    log.innerHTML = `${state.messages.map((msg) => `<div class="message ${msg.role}">${escapeHtml(msg.text)}</div>`).join("")}${pending}`;
    log.scrollTop = log.scrollHeight;
  }

  function addMessage(role, text) {
    state.messages.push({ role, text });
    renderChat();
  }

  function setAiPending(pending) {
    state.aiPending = Boolean(pending);
    const form = $("#chat-form");
    const button = form.querySelector("button");
    form.classList.toggle("pending", state.aiPending);
    form.setAttribute("aria-busy", String(state.aiPending));
    button.disabled = state.aiPending;
    renderChat();
  }

  async function requestAi(message) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          currentDay: state.day,
          plan: compactPlan(),
          places: places.map(({ name, category, note, lat, lng, status }) => ({ name, category, note, lat, lng, status })),
        }),
      });
      if (!response.ok) return localCoach(message);
      const data = await response.json();
      debug("ai response", {
        mode: data.mode || "local",
        operations: data.operations?.length || 0,
        checkpointId: data.checkpoint?.id || null,
      });
      if (data.plan) {
        setPlannerState(data);
        renderPlaces();
        renderDayTabs();
        renderPlan();
        renderSidebarSections();
        renderPanelVisibility();
      }
      return data.reply || localCoach(message);
    } catch {
      return localCoach(message);
    }
  }

  async function applyLocalIntent(message) {
    const normalized = normalize(message);
    const targetDay = parseDay(message) || state.day;
    const matchedPlace = places.find((place) => normalized.includes(normalize(place.name)));
    const wantsAdd = /추가|넣어|넣고|가자|포함/.test(message);
    const wantsRemove = /삭제|제거|빼|빼줘|취소/.test(message);

    if (matchedPlace && wantsAdd) {
      const added = await addPlaceToDay(matchedPlace.id, targetDay);
      if (added) return `Day ${targetDay}에 ${matchedPlace.name}을 추가했습니다.`;
    }

    if (wantsRemove) {
      const removed = await removeByMessage(normalized);
      if (removed) return `${removed}을 일정에서 뺐습니다.`;
    }

    return "";
  }

  function localCoach(message) {
    if (/동선|순서|거리|루트/.test(message)) {
      return "지도 기준으로는 북부, 중부, 나하/남부를 같은 날에 과하게 섞지 않는 쪽이 좋습니다. 현재 조사 장소 좌표는 모두 채워져 있어 핀 기준으로 동선을 볼 수 있습니다.";
    }
    if (/비|우천|장마|날씨/.test(message)) {
      return "비가 오면 실내 비중을 올리는 게 좋습니다. 라이카무, 파르코, 돈키호테, 츄라우미 수족관 쪽이 대체 후보입니다.";
    }
    if (/좌표|핀|지도/.test(message)) {
      const missing = places.filter((place) => !place.lat || !place.lng).length;
      if (missing === 0) return `조사 장소 ${places.length}개 모두 좌표가 채워져 있습니다. 이제 지도 기준 동선 상담이 가능합니다.`;
      return `현재 조사 장소 ${places.length}개 중 ${missing}개는 좌표가 비어 있습니다. 정확한 지도 상담 전에는 이 좌표 보강이 우선입니다.`;
    }
    return "로컬 모드로 답변 중입니다. 장소 추가/삭제는 바로 반영하고, 세밀한 일정 상담은 서버에 OpenAI 연결을 붙이면 더 좋아집니다.";
  }

  function compactPlan() {
    return state.plan.days.map((day) => ({
      id: day.id,
      day: day.day,
      date: day.date,
      weekday: day.weekday,
      items: day.items.map(({ id, type, title, time, category, memo, placeId, lat, lng, locked }) => ({
        id,
        type,
        title,
        time,
        category,
        memo,
        placeId,
        lat,
        lng,
        locked,
      })),
    }));
  }

  async function addPlaceToDay(placeId, dayNumber) {
    const place = places.find((item) => item.id === placeId);
    const day = state.plan.days.find((item) => item.day === dayNumber);
    if (!place || !day) return false;
    const exists = day.items.some((item) => normalize(item.title) === normalize(place.name));
    if (exists) return false;

    const serverApplied = await commitOperations(
      [
        {
          op: "add_item",
          day: dayNumber,
          item: {
            type: "saved-place",
            title: place.name,
            category: place.category || "조사 장소",
            memo: place.note || "",
            time: "",
            placeId: place.id,
            lat: place.lat,
            lng: place.lng,
          },
        },
      ],
      `Add ${place.name} to Day ${dayNumber}`,
    );
    if (serverApplied) return true;

    day.items.push({
      id: `manual-${place.id}-${Date.now()}`,
      type: "saved-place",
      title: place.name,
      category: place.category || "조사 장소",
      memo: place.note || "",
      time: "",
      lat: place.lat,
      lng: place.lng,
    });
    state.day = dayNumber;
    state.panelsCollapsed.sidebar = false;
    state.sidebarCollapsed.schedule = false;
    persistPlan();
    saveLayout({
      panelsCollapsed: state.panelsCollapsed,
      sidebarCollapsed: state.sidebarCollapsed,
    });
    renderDayTabs();
    renderPlan();
    renderSidebarSections();
    renderPanelVisibility();
    return true;
  }

  async function removeByMessage(normalizedMessage) {
    for (const day of state.plan.days) {
      const index = day.items.findIndex((item) => normalizedMessage.includes(normalize(item.title)));
      if (index >= 0) {
        const target = day.items[index];
        const serverApplied = await commitOperations(
          [{ op: "delete_item", itemId: target.id }],
          `Remove ${target.title}`,
        );
        if (serverApplied) return target.title;
        const [removed] = day.items.splice(index, 1);
        persistPlan();
        renderPlan();
        return removed.title;
      }
    }
    return "";
  }

  function parseDay(message) {
    const match = message.match(/day\s*([1-4])|([1-4])\s*일차|([1-4])일/iu);
    if (!match) return null;
    return Number(match[1] || match[2] || match[3]);
  }

  function ratingText(place) {
    if (!place.rating) return "";
    return `별점 ${place.rating}${place.reviews ? ` (${place.reviews})` : ""}`;
  }

  function renderPlanMemo(item) {
    const memo = cleanMemo(item.memo);
    if (!memo) return "";
    const expanded = state.expandedPlanItems.has(item.id);
    const lines = memo.split("\n");
    const isLong = memo.length > 180 || lines.length > 4;
    const visibleMemo = isLong && !expanded ? previewMemo(lines) : memo;
    const countLabel = lines.length > 1 ? `${lines.length}줄` : `${memo.length}자`;
    return `
      <div class="note plan-memo ${expanded ? "expanded" : "preview"}">${escapeHtml(visibleMemo)}</div>
      ${
        isLong
          ? `<button class="memo-toggle" type="button" aria-expanded="${expanded}" onclick="togglePlanMemo('${item.id}')">
              <span>${expanded ? "접기" : "전체 보기"}</span>
              <span class="memo-toggle-meta">${expanded ? "요약" : countLabel}</span>
              <i data-lucide="${expanded ? "chevron-up" : "chevron-down"}"></i>
            </button>`
          : ""
      }
    `;
  }

  function cleanMemo(memo) {
    return String(memo || "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function previewMemo(lines) {
    return lines.slice(0, 4).join("\n").trim();
  }

  function iconButton(icon, title, action) {
    return `
      <button class="icon-button" type="button" title="${title}" aria-label="${title}" onclick="${action}">
        <i data-lucide="${icon}"></i>
      </button>
    `;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  window.setDay = (day) => {
    state.day = day;
    renderDayTabs();
    renderPlaces();
    renderPlan();
  };

  window.addPlaceToCurrentDay = async (placeId) => {
    await addPlaceToDay(placeId, state.day);
  };

  window.focusPlace = (placeId) => {
    const place = places.find((item) => item.id === placeId);
    if (state.map && place?.lat && place?.lng) {
      state.map.setView([place.lat, place.lng], 14);
      highlightMarker(`place:${place.id}`);
    }
  };

  window.focusPlan = (itemId) => {
    const item = state.plan.days.flatMap((day) => day.items).find((entry) => entry.id === itemId);
    if (state.map && item?.lat && item?.lng) {
      state.map.setView([item.lat, item.lng], 14);
      highlightMarker(`plan:${item.id}`);
    }
  };

  window.movePlanItem = async (itemId, delta) => {
    const day = state.plan.days.find((entry) => entry.day === state.day);
    const index = day.items.findIndex((item) => item.id === itemId);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= day.items.length) return;
    const serverApplied = await commitOperations(
      [{ op: "move_item", itemId, toDay: state.day, toIndex: next }],
      `Move ${itemId} in Day ${state.day}`,
    );
    if (serverApplied) return;
    const [item] = day.items.splice(index, 1);
    day.items.splice(next, 0, item);
    persistPlan();
    renderPlan();
  };

  window.removePlanItem = async (itemId) => {
    const day = state.plan.days.find((entry) => entry.day === state.day);
    const serverApplied = await commitOperations([{ op: "delete_item", itemId }], `Delete ${itemId}`);
    if (serverApplied) return;
    day.items = day.items.filter((item) => item.id !== itemId);
    persistPlan();
    renderPlan();
  };

  window.editPlanItem = (itemId) => {
    state.editingPlanId = itemId;
    state.expandedPlanItems.add(itemId);
    renderPlan();
  };

  window.cancelPlanEdit = () => {
    state.editingPlanId = null;
    renderPlan();
  };

  window.savePlanEdit = async (event, itemId) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = state.plan.days.flatMap((day) => day.items).find((entry) => entry.id === itemId);
    if (!item) return;
    const patch = {
      time: String(form.get("time") || "").trim(),
      title: String(form.get("title") || "").trim() || item.title,
      category: String(form.get("category") || "").trim(),
      memo: String(form.get("memo") || "").trim(),
    };
    state.editingPlanId = null;
    const serverApplied = await commitOperations([{ op: "update_item", itemId, patch }], `Update ${item.title}`);
    if (serverApplied) return;
    item.time = patch.time;
    item.title = patch.title;
    item.category = patch.category;
    item.memo = patch.memo;
    persistPlan();
    renderPlan();
  };

  window.togglePlanMemo = (itemId) => {
    if (state.expandedPlanItems.has(itemId)) {
      state.expandedPlanItems.delete(itemId);
    } else {
      state.expandedPlanItems.add(itemId);
    }
    renderPlan();
  };

  init();
})();
