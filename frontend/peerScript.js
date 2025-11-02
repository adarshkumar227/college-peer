const API_URL = "http://localhost:5000/api/peers";

let editPeerId = null;

// Elements
const peerForm = document.getElementById("peerForm");
const nameInput = document.getElementById("name");
const domainInput = document.getElementById("domain");
const experienceInput = document.getElementById("experience");
const ratingInput = document.getElementById("rating");
const chargesInput = document.getElementById("charges");
const peerTableBody = document.querySelector("#peerTable tbody");

function resetPeerForm() {
  editPeerId = null;
  peerForm.reset();
  experienceInput.value = 0;
  ratingInput.value = 0;
  chargesInput.value = 3000;

  const submitBtn = peerForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Add Peer";
}

peerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const peerData = {
    name: nameInput.value.trim(),
    domain: domainInput.value.trim(),
    experience: parseInt(experienceInput.value) || 0,
    rating: parseInt(ratingInput.value) || 0,
    charges: parseInt(chargesInput.value) || 0,
  };

  if (!peerData.name || !peerData.domain) {
    alert("Please provide name and domain.");
    return;
  }

  try {
    const res = await fetch(
      editPeerId ? `${API_URL}/${editPeerId}` : API_URL,
      {
        method: editPeerId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(peerData),
      }
    );

    if (!res.ok) throw new Error("Request failed");

    alert(editPeerId ? "✅ Peer updated!" : "✅ Peer added!");
    resetPeerForm();
    await loadPeers();
  } catch (error) {
    console.error("Error saving peer:", error);
    alert("Failed to save peer.");
  }
});

async function loadPeers() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch peers");
    const peers = await res.json();

    peerTableBody.innerHTML = "";
    peers.forEach((p) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${p._id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.domain)}</td>
        <td>${p.experience}</td>
        <td>${p.rating}</td>
        <td>${p.charges}</td>
        <td style="text-align:center;">
          <button class="edit-btn" data-id="${p._id}" title="Edit">✏️</button>
          <button class="delete-btn" data-id="${p._id}" title="Delete">🗑️</button>
        </td>
      `;

      peerTableBody.appendChild(tr);
    });

    // Style small buttons
    document.querySelectorAll(".edit-btn, .delete-btn").forEach(btn => {
      btn.style.border = "none";
      btn.style.padding = "4px 6px";
      btn.style.margin = "0 3px";
      btn.style.borderRadius = "4px";
      btn.style.cursor = "pointer";
      btn.style.fontSize = "14px";
    });

    document.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", (e) => startEditPeer(e.currentTarget.dataset.id))
    );

    document.querySelectorAll(".delete-btn").forEach(btn =>
      btn.addEventListener("click", (e) => deletePeer(e.currentTarget.dataset.id))
    );
  } catch (error) {
    console.error("Error loading peers:", error);
  }
}

async function startEditPeer(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Peer not found");
    const p = await res.json();

    nameInput.value = p.name || "";
    domainInput.value = p.domain || "";
    experienceInput.value = p.experience ?? 0;
    ratingInput.value = p.rating ?? 0;
    chargesInput.value = p.charges ?? 3000;

    editPeerId = id;
    const submitBtn = peerForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Update Peer";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Error editing peer:", error);
    alert("Edit failed.");
  }
}

async function deletePeer(id) {
  if (!confirm("Are you sure you want to delete this peer?")) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete peer");
    alert("✅ Peer deleted.");
    await loadPeers();
  } catch (error) {
    console.error("Error deleting peer:", error);
  }
}

function escapeHtml(text) {
  if (!text && text !== 0) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

window.addEventListener("load", async () => {
  resetPeerForm();
  await loadPeers();
});
