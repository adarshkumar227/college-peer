// frontend/sessionScript.js
// Full updated session UI script
// - persistent load on refresh
// - top-10 card grid (horizontal scroll + snapping)
// - vertical draggable list for rest
// - manual status updates only when Peer Mode enabled
// - Join & Details buttons implemented (placeholders / modal)

const API_BASE = "http://localhost:5000/api/sessions";
const STUDENT_API = "http://localhost:5000/api/students";
const PEER_API = "http://localhost:5000/api/peers";

// Static Zoom link (used for Join)
const STATIC_ZOOM_LINK = "https://zoom.us/j/1234567890?pwd=STATICLINK";

const studentSelect = document.getElementById("studentSelect");
const createBtn = document.getElementById("createSessionBtn");
const matchBox = document.getElementById("matchBox");
const matchedPeerName = document.getElementById("matchedPeerName");
const matchedPeerDetails = document.getElementById("matchedPeerDetails");
const matchedScore = document.getElementById("matchedScore");
const matchNotes = document.getElementById("matchNotes");
const topicInput = document.getElementById("topicInput");
const scheduledAtInput = document.getElementById("scheduledAt");

const sessionTableBody = document.getElementById("sessionTableBody");
const cardGrid = document.getElementById("cardGrid");
const verticalList = document.getElementById("verticalList");
const bulkGenerateBtn = document.getElementById("bulkGenerateBtn");
const refreshBtn = document.getElementById("refreshBtn");

// Peer mode state: when true, status controls are enabled
let peerMode = { enabled: false, peerId: null, peerName: null };

// Utility helpers
function showMatchBox(show = true) {
  if (matchBox) matchBox.style.display = show ? "block" : "none";
}
function formatDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return d.toLocaleString();
}
function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k === "className") e.className = v;
    else e.setAttribute(k, v);
  });
  children.flat().forEach(c => {
    if (c == null) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}

// ---------- Close session (permanent removal) ----------
async function handleCloseSession(sessionId, cardElement) {
  if (!confirm("Close and remove this session? This will delete it from the database.")) return;
  // optimistic UI remove
  try {
    if (cardElement && cardElement.remove) cardElement.remove();
    // attempt backend delete (DELETE endpoint)
    const res = await fetch(`${API_BASE}/${sessionId}`, { method: "DELETE" });
    if (!res.ok) {
      // try fallback close endpoint
      const alt = await fetch(`${API_BASE}/${sessionId}/close`, { method: "POST" });
      if (!alt.ok) throw new Error("Server failed to delete/close session");
    }
    // refresh displays to ensure consistent state
    await loadAllDisplays();
  } catch (err) {
    console.error("Error closing session:", err);
    alert("Failed to close session on server. It may reappear on reload.");
    await loadAllDisplays();
  }
}

// --- Peer Mode control (floating) -----------------
function createPeerModeButton() {
  // create only once
  if (document.getElementById("peerModeBtn")) return;
  const btn = el("button", {
    id: "peerModeBtn",
    style: {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      zIndex: 1200,
      background: "#111827",
      color: "#fff",
      border: "none",
      padding: "10px 12px",
      borderRadius: "10px",
      cursor: "pointer",
      boxShadow: "0 6px 18px rgba(15,23,42,0.12)"
    }
  }, "Enable Peer Mode");
  btn.addEventListener("click", async () => {
    if (!peerMode.enabled) {
      const id = prompt("Enter your Peer ID to enable Peer Mode (you may paste Mongo _id):");
      if (!id) return;
      // try to verify peer id
      try {
        const r = await fetch(`${PEER_API}/${id}`);
        if (r.ok) {
          const peer = await r.json();
          peerMode.enabled = true;
          peerMode.peerId = id;
          peerMode.peerName = peer.name || "Peer";
          btn.textContent = `Peer Mode: ${peerMode.peerName}`;
          btn.style.background = "#065f46";
          enableStatusControls(true);
          alert("Peer Mode enabled. You can now update session status.");
        } else {
          // allow enabling without verification (user insisted)
          const proceed = confirm("Peer not found or endpoint unavailable. Enable anyway?");
          if (!proceed) return;
          peerMode.enabled = true;
          peerMode.peerId = id;
          peerMode.peerName = `Peer(${id.slice(0,6)})`;
          btn.textContent = `Peer Mode: ${peerMode.peerName}`;
          btn.style.background = "#065f46";
          enableStatusControls(true);
          alert("Peer Mode enabled (unverified).");
        }
      } catch (err) {
        console.error("Peer verification error:", err);
        const proceed = confirm("Peer verification failed. Enable Peer Mode anyway?");
        if (!proceed) return;
        peerMode.enabled = true;
        peerMode.peerId = id;
        peerMode.peerName = `Peer(${id.slice(0,6)})`;
        btn.textContent = `Peer Mode: ${peerMode.peerName}`;
        btn.style.background = "#065f46";
        enableStatusControls(true);
        alert("Peer Mode enabled (unverified).");
      }
    } else {
      // disable
      peerMode = { enabled: false, peerId: null, peerName: null };
      btn.textContent = "Enable Peer Mode";
      btn.style.background = "#111827";
      enableStatusControls(false);
      alert("Peer Mode disabled.");
    }
  });
  document.body.appendChild(btn);
}

// Enable/disable all status controls in UI
function enableStatusControls(enable) {
  // table selects
  document.querySelectorAll(".session-status-select").forEach(sel => {
    sel.disabled = !enable;
    sel.title = enable ? "Change status (peer mode)" : "Status updates are allowed only in Peer Mode";
  });
  // vertical list selects
  document.querySelectorAll(".vl-status").forEach(sel => {
    sel.disabled = !enable;
    sel.title = enable ? "Change status (peer mode)" : "Status updates are allowed only in Peer Mode";
  });
  // card controls (if we later add)
}

// --- Students / peers loading ---------------------
async function loadStudentsDropdown() {
  try {
    const res = await fetch(STUDENT_API);
    const students = await res.json();
    studentSelect.innerHTML = `<option value="">Select Student</option>`;
    students.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s._id;
      opt.textContent = `${s.name} — ${s.subject} — ₹${s.rangeBudget}`;
      studentSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading students:", err);
  }
}
async function loadPeersList() {
  try {
    const res = await fetch(PEER_API);
    const peers = await res.json();
    return peers;
  } catch (err) {
    console.error("Error loading peers:", err);
    return [];
  }
}

// --- Match & create session (top-3 candidates) ----
createBtn.addEventListener("click", async (ev) => {
  ev.preventDefault();
  const studentId = studentSelect.value;
  if (!studentId) return alert("Select a student first");

  try {
    const res = await fetch(`${API_BASE}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId })
    });
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:"Failed"}));
      throw new Error(e.message || "Failed to compute matches");
    }
    const { candidates } = await res.json();
    if (!candidates || candidates.length === 0) {
      showMatchBox(false);
      alert("No candidate peers found.");
      return;
    }

    showMatchBox(true);
    matchedPeerName.textContent = `Top ${candidates.length} Candidates`;
    matchedPeerDetails.innerHTML = "";
    matchedScore.textContent = "";
    matchNotes.textContent = "Select a peer to create the session.";

    // horizontal container (cards)
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.gap = "10px";
    container.style.marginTop = "10px";
    container.style.overflowX = "auto";
    container.style.scrollSnapType = "x mandatory";
    container.style.paddingBottom = "6px";

    candidates.forEach(c => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.padding = "10px";
      card.style.borderRadius = "10px";
      card.style.boxShadow = "0 6px 12px rgba(15,23,42,0.04)";
      card.style.minWidth = "220px";
      card.style.cursor = "pointer";
      card.style.background = "#fff";
      card.style.scrollSnapAlign = "center";

      card.innerHTML = `
        <div style="font-weight:700">${c.peer.name}</div>
        <div class="small">${c.peer.domain} • ₹${c.peer.charges} • ⭐ ${c.peer.rating} • ${c.peer.experience} yrs</div>
        <div style="margin-top:8px; font-size:13px; color:#374151">Score: <strong>${c.score}</strong></div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="choose-peer" data-id="${c.peer._id}" style="flex:1; padding:8px; border-radius:8px; border:none; background:#2563eb; color:#fff; cursor:pointer;">Choose</button>
          <button class="details" data-id="${c.peer._id}" style="padding:8px; border-radius:8px; border:1px solid #e6edf6; background:#fff; cursor:pointer;">View</button>
        </div>
      `;
      container.appendChild(card);
    });

    matchedPeerDetails.appendChild(container);

    // attach handlers
    matchedPeerDetails.querySelectorAll(".choose-peer").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const peerId = e.currentTarget.dataset.id;
        await createSessionForStudentWithPeer(studentId, peerId);
      });
    });
    matchedPeerDetails.querySelectorAll(".details").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const pid = e.currentTarget.dataset.id;
        const peers = await loadPeersList();
        const p = peers.find(x => String(x._id) === String(pid));
        if (p) {
          showDetailsModal({
            title: p.name,
            body: `Domain: ${p.domain}\nCharges: ₹${p.charges}\nRating: ${p.rating}\nExperience: ${p.experience} yrs`
          });
        } else alert("Peer details not found");
      });
    });

  } catch (err) {
    console.error("Error finding matches:", err);
    alert("Failed to compute matches. See console.");
  }
});

// Create session with chosen peer
async function createSessionForStudentWithPeer(studentId, peerId) {
  try {
    const payload = {
      action: "create",
      studentId,
      peerId,
      topic: topicInput.value || undefined,
      scheduledAt: scheduledAtInput.value || undefined
    };
    const res = await fetch(`${API_BASE}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:"Failed"}));
      throw new Error(e.message || "Failed to create session");
    }
    const data = await res.json();
    alert("Session created with chosen peer!");
    matchNotes.textContent = `Created session with ${data.session.peerId.name} (student: ${data.session.studentId.name}). Score breakdown: ${JSON.stringify(data.score.breakdown)}`;
    await loadAllDisplays();
  } catch (err) {
    console.error("Error creating session:", err);
    alert("Failed to create session. See console.");
  }
}

// Bulk greedy matching (creates sessions)
async function generateBulkMatches() {
  if (!confirm("Run bulk matching (greedy) across all students & peers? This will create sessions in DB.")) return;
  try {
    const res = await fetch(`${API_BASE}/match/bulk`, { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:"Failed"}));
      throw new Error(e.message || "Bulk matching failed");
    }
    const data = await res.json();
    alert(`Bulk matching created ${data.summary.totalCreated} sessions.`);
    await loadAllDisplays();
  } catch (err) {
    console.error("Error running bulk match:", err);
    alert("Bulk match failed. See console.");
  }
}

// Update session (PATCH). Only allowed if peerMode.enabled === true.
// This function still performs the fetch — enforcement of who calls it is UI-side.
async function updateSessionStatus(sessionId, newStatus) {
  if (!peerMode.enabled) {
    alert("Status updates are allowed only in Peer Mode. Click the floating button to enable.");
    // revert UI state by reloading values
    await loadAllDisplays();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:"Failed"}));
      throw new Error(e.message || "Failed to update status");
    }
    // reflect change
    await loadAllDisplays();
  } catch (err) {
    console.error("Error updating session status:", err);
    alert("Failed to update session status. See console.");
  }
}

// --- Load sessions and populate UI ----------------
async function loadSessions() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error("Failed to fetch sessions");
    const sessions = await res.json();

    // clear existing
    sessionTableBody.innerHTML = "";
    cardGrid.innerHTML = "";
    verticalList.innerHTML = "";

    // TABLE: all sessions
    sessions.forEach(s => {
      const tr = document.createElement("tr");
      const studentName = s.studentId?.name || "N/A";
      const peerName = s.peerId?.name || "N/A";
      const topic = s.topic || "-";
      const time = s.scheduledAt ? formatDate(s.scheduledAt) : formatDate(s.createdAt);
      const currentStatus = s.status || "pending";

      const statusSelect = document.createElement("select");
      statusSelect.className = "session-status-select";
      ["pending","active","completed","cancelled"].forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st.charAt(0).toUpperCase() + st.slice(1);
        if (st === currentStatus) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      // status change handler will only actually update if peerMode enabled
      statusSelect.addEventListener("change", () => {
        if (!peerMode.enabled) {
          alert("Only peers can update status. Enable Peer Mode first.");
          // revert
          statusSelect.value = currentStatus;
          return;
        }
        updateSessionStatus(s._id, statusSelect.value);
      });

      // disable by default unless peerMode enabled
      statusSelect.disabled = !peerMode.enabled;
      statusSelect.title = peerMode.enabled ? "Change status (peer mode)" : "Status updates are allowed only in Peer Mode";

      tr.innerHTML = `<td>${studentName}</td><td>${peerName}</td><td>${topic}</td>`;
      const tdStatus = document.createElement("td");
      tdStatus.appendChild(statusSelect);
      tr.appendChild(tdStatus);
      tr.innerHTML += `<td>${time}</td>`;
      sessionTableBody.appendChild(tr);
    });

    // CARDS: top 10 sessions (recent first)
    const top10 = sessions.slice(0, 10);
    // make cardGrid horizontally scrollable with snapping
    cardGrid.style.display = "flex";
    cardGrid.style.gap = "12px";
    cardGrid.style.overflowX = "auto";
    cardGrid.style.scrollSnapType = "x proximity";
    cardGrid.style.paddingBottom = "6px";

    top10.forEach(s => {
      const card = document.createElement("div");
      card.className = "session-card";
      card.style.minWidth = "260px";
      card.style.scrollSnapAlign = "center";
      card.style.position = "relative";

      const studentName = s.studentId?.name || "N/A";
      const peerName = s.peerId?.name || "N/A";
      const topic = s.topic || "-";
      const time = s.scheduledAt ? formatDate(s.scheduledAt) : formatDate(s.createdAt);
      const currentStatus = s.status || "pending";

      let statusClass = "status-pending";
      if (currentStatus === "active") statusClass = "status-active";
      if (currentStatus === "completed") statusClass = "status-completed";
      if (currentStatus === "cancelled") statusClass = "status-cancelled";

      // card content (added close button)
      card.innerHTML = `
        <div class="row-top" style="display:flex;align-items:flex-start;gap:8px;">
          <div style="flex:1">
            <h4 style="margin:0">${studentName}</h4>
            <div class="session-meta" style="margin-top:6px">${peerName} • ${topic}</div>
          </div>
          <div style="text-align:right">
            <div class="status-pill ${statusClass}" style="display:inline-block;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px;">
              ${currentStatus.charAt(0).toUpperCase()+currentStatus.slice(1)}
            </div>
            <div class="small" style="margin-top:6px">${time}</div>
          </div>
        </div>
        <div class="actions-row" style="display:flex;gap:8px;margin-top:12px;">
          <button class="ghost join-btn" data-id="${s._id}" style="padding:8px;border-radius:8px;border:1px solid #e6edf6;background:#fff;cursor:pointer;">Join</button>
          <button class="ghost details-btn" data-id="${s._id}" style="padding:8px;border-radius:8px;border:1px solid #e6edf6;background:#fff;cursor:pointer;">Details</button>
        </div>
        <button class="close-session-btn" title="Close session" style="position:absolute;right:8px;top:8px;background:transparent;border:none;font-size:16px;cursor:pointer;">✕</button>
      `;
      // attach handlers
      card.querySelector(".join-btn").addEventListener("click", () => joinSession(s._id));
      card.querySelector(".details-btn").addEventListener("click", () => showSessionDetails(s));
      const closeBtn = card.querySelector(".close-session-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          handleCloseSession(s._id, card);
        });
      }
      cardGrid.appendChild(card);
    });

    // VERTICAL LIST: remaining sessions (draggable, reorder client-side)
    const rest = sessions.slice(10);
    rest.forEach(s => {
      const item = document.createElement("div");
      item.className = "vertical-item";
      item.draggable = true;
      item.dataset.id = s._id;
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.justifyContent = "space-between";
      item.style.padding = "10px";
      item.style.borderRadius = "8px";
      item.style.marginBottom = "8px";
      item.style.background = "#fff";
      item.style.boxShadow = "0 6px 10px rgba(15,23,42,0.03)";

      const left = document.createElement("div");
      left.style.flex = "1";
      left.innerHTML = `<div style="font-weight:700">${s.studentId?.name || "N/A"} → ${s.peerId?.name || "N/A"}</div><div class="small" style="margin-top:4px">${s.topic || "-"} • ${s.scheduledAt ? formatDate(s.scheduledAt) : formatDate(s.createdAt)}</div>`;

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "8px";

      const sel = document.createElement("select");
      sel.className = "vl-status";
      ["pending","active","completed","cancelled"].forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st.charAt(0).toUpperCase() + st.slice(1);
        if (st === s.status) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.disabled = !peerMode.enabled;
      sel.title = peerMode.enabled ? "Change status (peer mode)" : "Status updates allowed only in Peer Mode";
      sel.addEventListener("change", () => {
        if (!peerMode.enabled) {
          alert("Only peers can update status. Enable Peer Mode first.");
          sel.value = s.status;
          return;
        }
        updateSessionStatus(s._id, sel.value);
      });

      // close button for vertical item
      const vCloseBtn = document.createElement("button");
      vCloseBtn.title = "Close session";
      vCloseBtn.innerText = "✕";
      vCloseBtn.style = "background:transparent;border:none;font-size:16px;cursor:pointer";
      vCloseBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        handleCloseSession(s._id, item);
      });

      right.appendChild(sel);
      right.appendChild(vCloseBtn);
      item.appendChild(left);
      item.appendChild(right);

      // drag events
      item.addEventListener("dragstart", (e) => {
        item.classList.add("dragging");
        e.dataTransfer.setData("text/plain", s._id);
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });

      verticalList.appendChild(item);
    });

    // enable vertical drag reorder
    enableVerticalDragReorder();

    // ensure status controls reflect peer-mode
    enableStatusControls(peerMode.enabled);

  } catch (err) {
    console.error("Error loading sessions:", err);
  }
}

// drag reorder implementation for verticalList
function enableVerticalDragReorder() {
  let draggingEl = null;
  const items = Array.from(verticalList.querySelectorAll(".vertical-item"));
  items.forEach(item => {
    item.addEventListener("dragstart", () => draggingEl = item);
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!draggingEl) return;
      const target = e.currentTarget;
      if (target === draggingEl) return;
      const rect = target.getBoundingClientRect();
      const next = (e.clientY - rect.top) > (rect.height / 2);
      if (next) target.after(draggingEl);
      else target.before(draggingEl);
    });
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      draggingEl = null;
    });
  });
}

// helper to reload everything
async function loadAllDisplays() {
  await loadStudentsDropdown();
  await loadSessions();
}

// Join and Details functionality
function joinSession(sessionId) {
  // Use static Zoom link (or you can change to session-specific link if available)
  window.open(STATIC_ZOOM_LINK, "_blank");
}

function showSessionDetails(sessionObj) {
  // show a simple overlay modal with details
  const modal = el("div", { style: {
    position: "fixed", left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300
  }});
  const card = el("div", { style: { width: "min(720px,95%)", background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 10px 30px rgba(2,6,23,0.2)" }});
  const title = el("h3", {}, `Session details`);
  const body = el("pre", { style: { whiteSpace: "pre-wrap", fontSize: "14px", color: "#111827" }}, JSON.stringify(sessionObj, null, 2));
  const closeBtn = el("button", { style: { marginTop: "12px", padding: "8px 12px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}, "Close");
  closeBtn.addEventListener("click", () => document.body.removeChild(modal));
  card.appendChild(title);
  card.appendChild(body);
  card.appendChild(closeBtn);
  modal.appendChild(card);
  document.body.appendChild(modal);
}

// small helper modal for peer details earlier
function showDetailsModal({ title = "Details", body = "" } = {}) {
  const modal = el("div", { style: {
    position: "fixed", left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1400
  }});
  const card = el("div", { style: { width: "min(480px,95%)", background: "#fff", borderRadius: "10px", padding: "14px", boxShadow: "0 10px 30px rgba(2,6,23,0.12)" }});
  const t = el("h3", {}, title);
  const p = el("div", { style: { whiteSpace: "pre-wrap", color: "#111827" }}, body);
  const b = el("div", { style: { textAlign: "right", marginTop: "10px" }}, el("button", { style: { padding: "8px 12px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }, onClick: () => document.body.removeChild(modal) }, "Close"));
  card.appendChild(t); card.appendChild(p); card.appendChild(b);
  modal.appendChild(card); document.body.appendChild(modal);
}

// enable/disable status controls (table & vertical)
function enableStatusControls(enable) {
  document.querySelectorAll(".session-status-select").forEach(sel => {
    sel.disabled = !enable;
    sel.title = enable ? "Change status (peer mode)" : "Status updates are allowed only in Peer Mode";
  });
  document.querySelectorAll(".vl-status").forEach(sel => {
    sel.disabled = !enable;
    sel.title = enable ? "Change status (peer mode)" : "Status updates are allowed only in Peer Mode";
  });
}

// attach bulk button & refresh
bulkGenerateBtn?.addEventListener("click", generateBulkMatches);
refreshBtn?.addEventListener("click", loadAllDisplays);

// create floating peer mode toggle when page starts
window.addEventListener("load", async () => {
  createPeerModeButton();
  showMatchBox(false);
  await loadAllDisplays();
});
