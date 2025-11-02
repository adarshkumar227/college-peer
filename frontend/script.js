// ================================
// 🌐 API ENDPOINTS
// ================================
const STUDENT_API = "http://localhost:5000/api/students";
const PEER_API = "http://localhost:5000/api/peers";

// ================================
// GLOBAL VARIABLES
// ================================
let editStudentId = null;
let editPeerId = null;

// ================================
// 🎓 STUDENT SECTION
// ================================
document.getElementById("studentForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentData = {
    name: document.getElementById("name").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    rangeBudget: parseInt(document.getElementById("rangeBudget").value),
    rating: parseInt(document.getElementById("rating").value),
    experience: parseInt(document.getElementById("experience").value),
  };

  try {
    let res;
    if (editStudentId) {
      // Update existing
      res = await fetch(`${STUDENT_API}/${editStudentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });
      if (!res.ok) throw new Error("Failed to update student");
      alert("✅ Student Updated Successfully!");
    } else {
      // Create new
      res = await fetch(STUDENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });
      if (!res.ok) throw new Error("Failed to add student");
      alert("🎓 Student Registered Successfully!");
    }

    e.target.reset();
    editStudentId = null;
    await loadStudents();
  } catch (error) {
    console.error("❌ Error saving student:", error);
    alert("Failed to save student. Check backend or console.");
  }
});

// ================================
// 🧾 LOAD STUDENTS
// ================================
async function loadStudents() {
  const tableBody = document.querySelector("#studentTable tbody");
  if (!tableBody) return;

  try {
    const res = await fetch(STUDENT_API);
    if (!res.ok) throw new Error("Failed to fetch students");
    const students = await res.json();

    tableBody.innerHTML = "";
    students.forEach((s) => {
      const row = `
        <tr>
          <td>${s.name}</td>
          <td>${s.subject}</td>
          <td>${s.rangeBudget}</td>
          <td>${s.rating}</td>
          <td>${s.experience}</td>
          <td>
            <button class="edit-student-btn" data-id="${s._id}">✏️</button>
            <button class="delete-student-btn" data-id="${s._id}">🗑️</button>
          </td>
        </tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    tableBody.querySelectorAll(".edit-student-btn").forEach((btn) => {
      btn.addEventListener("click", () => startEditStudent(btn.dataset.id));
    });
    tableBody.querySelectorAll(".delete-student-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteStudent(btn.dataset.id));
    });
  } catch (error) {
    console.error("❌ Error loading students:", error);
  }
}

// ================================
// ✏️ EDIT STUDENT
// ================================
async function startEditStudent(id) {
  try {
    const res = await fetch(`${STUDENT_API}/${id}`);
    if (!res.ok) throw new Error("Student not found");
    const s = await res.json();

    document.getElementById("name").value = s.name;
    document.getElementById("subject").value = s.subject;
    document.getElementById("rangeBudget").value = s.rangeBudget;
    document.getElementById("rating").value = s.rating;
    document.getElementById("experience").value = s.experience;

    editStudentId = id;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("❌ Error editing student:", error);
    alert("Could not fetch student details.");
  }
}

// ================================
// 🗑️ DELETE STUDENT
// ================================
async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) return;
  try {
    const res = await fetch(`${STUDENT_API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete student");
    alert("🗑️ Student Deleted");
    await loadStudents();
  } catch (error) {
    console.error("❌ Error deleting student:", error);
  }
}

// ================================
// 🤝 PEER SECTION
// ================================
document.getElementById("peerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const peerData = {
    name: document.getElementById("peerName").value.trim(),
    domain: document.getElementById("peerDomain").value.trim(),
    experience: parseInt(document.getElementById("peerExperience").value) || 0,
    rating: parseInt(document.getElementById("peerRating").value) || 0,
    charges: parseInt(document.getElementById("peerCharges").value) || 0,
  };

  try {
    let res;
    if (editPeerId) {
      res = await fetch(`${PEER_API}/${editPeerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(peerData),
      });
      if (!res.ok) throw new Error("Failed to update peer");
      alert("✅ Peer Updated Successfully!");
    } else {
      res = await fetch(PEER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(peerData),
      });
      if (!res.ok) throw new Error("Failed to add peer");
      alert("🤝 Peer Registered Successfully!");
    }

    e.target.reset();
    editPeerId = null;
    await loadPeers();
  } catch (error) {
    console.error("❌ Error saving peer:", error);
    alert("Failed to save peer. Check backend or console.");
  }
});

// ================================
// 🧑‍🏫 LOAD PEERS
// ================================
async function loadPeers() {
  const tableBody = document.querySelector("#peerTable tbody");
  if (!tableBody) return;

  try {
    const res = await fetch(PEER_API);
    if (!res.ok) throw new Error("Failed to fetch peers");
    const peers = await res.json();

    tableBody.innerHTML = "";
    peers.forEach((p) => {
      const row = `
        <tr>
          <td>${p.name}</td>
          <td>${p.domain}</td>
          <td>${p.experience}</td>
          <td>${p.rating}</td>
          <td>${p.charges}</td>
          <td>
            <button class="edit-peer-btn" data-id="${p._id}">✏️</button>
            <button class="delete-peer-btn" data-id="${p._id}">🗑️</button>
          </td>
        </tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    tableBody.querySelectorAll(".edit-peer-btn").forEach((btn) => {
      btn.addEventListener("click", () => startEditPeer(btn.dataset.id));
    });
    tableBody.querySelectorAll(".delete-peer-btn").forEach((btn) => {
      btn.addEventListener("click", () => deletePeer(btn.dataset.id));
    });
  } catch (error) {
    console.error("❌ Error loading peers:", error);
  }
}

// ================================
// ✏️ EDIT PEER
// ================================
async function startEditPeer(id) {
  try {
    const res = await fetch(`${PEER_API}/${id}`);
    if (!res.ok) throw new Error("Peer not found");
    const p = await res.json();

    document.getElementById("peerName").value = p.name;
    document.getElementById("peerDomain").value = p.domain;
    document.getElementById("peerExperience").value = p.experience;
    document.getElementById("peerRating").value = p.rating;
    document.getElementById("peerCharges").value = p.charges;

    editPeerId = id;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("❌ Error editing peer:", error);
    alert("Could not fetch peer details.");
  }
}

// ================================
// 🗑️ DELETE PEER
// ================================
async function deletePeer(id) {
  if (!confirm("Are you sure you want to delete this peer?")) return;
  try {
    const res = await fetch(`${PEER_API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete peer");
    alert("🗑️ Peer Deleted");
    await loadPeers();
  } catch (error) {
    console.error("❌ Error deleting peer:", error);
  }
}

// ================================
// 🚀 AUTO LOAD EVERYTHING
// ================================
window.addEventListener("load", async () => {
  await loadStudents();
  await loadPeers();
});
