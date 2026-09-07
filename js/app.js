const STORAGE_KEY = "srms-linked-list-records-v1";
const THEME_KEY = "srms-theme-v1";

const demoStudents = [
  { name: "Abdul Wadud", roll: 101, course: "CSE 201", marks: 85 },
  { name: "Nazmus Sakib", roll: 105, course: "CSE 210", marks: 78 },
  { name: "Tawhid Islam", roll: 110, course: "CSE 215", marks: 91 },
  { name: "Tusher Azad", roll: 118, course: "CSE 220", marks: 88 }
];

let students = loadStudents();
let traversalTimer = null;

const $ = (selector) => document.querySelector(selector);

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return normalize(parsed);
    }
  } catch (error) {
    console.warn("Could not read localStorage:", error);
  }
  return normalize(demoStudents);
}

function normalize(list) {
  return list
    .map(s => ({
      name: String(s.name || "").trim(),
      roll: Number(s.roll),
      course: String(s.course || "").trim(),
      marks: Number(s.marks)
    }))
    .filter(s => s.name && Number.isFinite(s.roll))
    .sort((a,b) => a.roll - b.roll);
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function showToast(title, text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${escapeHTML(text)}</span>`;
  $("#toastContainer").appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function renderAll() {
  renderStats();
  renderList();
  renderTable();
  updateRecordCount();
}

function renderStats() {
  $("#statTotal").textContent = students.length;
}

function updateRecordCount() {
  const count = students.length;
  $("#recordCount").textContent = `${count} record${count === 1 ? "" : "s"}`;
}

function renderList(filtered = students) {
  const stage = $("#linkedListStage");
  const list = $("#listScroll");
  const empty = $("#emptyState");

  if (!filtered.length) {
    empty.style.display = "grid";
    list.innerHTML = "";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = "";
  const head = document.createElement("div");
  head.className = "head-tag";
  head.innerHTML = `<b>HEAD</b><span>start</span>`;
  list.appendChild(head);

  filtered.forEach((student, index) => {
    const wrap = document.createElement("div");
    wrap.className = "link-node-wrap";
    wrap.innerHTML = `
      <div class="link-node node-enter" data-roll="${student.roll}">
        <div class="node-header">
          <span class="node-badge">NODE ${String(index + 1).padStart(2,"0")}</span>
          <span class="node-index">#${student.roll}</span>
        </div>
        <div class="node-name">${escapeHTML(student.name)}</div>
        <div class="node-meta">${escapeHTML(student.course)}</div>
        <div class="node-footer">
          <span class="node-marks">${student.marks}/100 marks</span>
          <button class="delete-node" data-delete-roll="${student.roll}" title="Delete record">×</button>
        </div>
      </div>
      ${index < filtered.length - 1 ? '<div class="pointer"></div>' : ''}
    `;
    list.appendChild(wrap);
  });

  const nullTag = document.createElement("div");
  nullTag.className = "null-tag";
  nullTag.innerHTML = `<b>NULL</b><span>end</span>`;
  list.appendChild(nullTag);

  stage.querySelectorAll("[data-delete-roll]").forEach(btn => {
    btn.addEventListener("click", () => deleteStudent(Number(btn.dataset.deleteRoll)));
  });
}

function renderTable() {
  const filter = $("#tableSearch").value.trim().toLowerCase();
  const body = $("#recordTableBody");
  const rows = students.filter(s =>
    !filter ||
    s.name.toLowerCase().includes(filter) ||
    s.course.toLowerCase().includes(filter) ||
    String(s.roll).includes(filter)
  );

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="no-results">No matching student records found.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map(s => `
    <tr>
      <td class="roll-cell">${s.roll}</td>
      <td class="student-cell"><strong>${escapeHTML(s.name)}</strong><span>Student record</span></td>
      <td><span class="course-pill">${escapeHTML(s.course)}</span></td>
      <td><span class="mark-badge">${s.marks}%</span></td>
      <td><button class="table-delete" data-delete-roll="${s.roll}" title="Delete record">×</button></td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-delete-roll]").forEach(btn => {
    btn.addEventListener("click", () => deleteStudent(Number(btn.dataset.deleteRoll)));
  });
}

function addStudent(student) {
  const exists = students.some(s => s.roll === student.roll);
  if (exists) {
    showToast("Duplicate roll number", `Roll ${student.roll} already exists.`);
    return false;
  }
  students.push(student);
  students.sort((a,b) => a.roll - b.roll);
  saveStudents();
  renderAll();
  showToast("Student added", `${student.name} was inserted into the sorted linked list.`);
  return true;
}

function deleteStudent(roll) {
  const index = students.findIndex(s => s.roll === roll);
  if (index === -1) return;
  const removed = students.splice(index, 1)[0];
  saveStudents();
  renderAll();
  showToast("Node deleted", `Roll ${removed.roll} was removed from the linked list.`);
}

async function searchStudent(roll) {
  if (!roll) {
    showToast("Enter a roll number", "Type a roll number before starting traversal.");
    return;
  }

  clearTraversal();
  const nodes = [...document.querySelectorAll(".link-node")];
  if (!nodes.length) {
    setSearchFeedback("List is empty", "Add a student before searching.", "i");
    return;
  }

  setSearchFeedback("Traversing...", `Checking nodes from HEAD for roll ${roll}.`, "→");

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.classList.add("traversing");
    await delay(550);
    const currentRoll = Number(node.dataset.roll);

    if (currentRoll === Number(roll)) {
      node.classList.remove("traversing");
      node.classList.add("found");
      const student = students.find(s => s.roll === Number(roll));
      setSearchFeedback("Match found", `${student.name} • ${student.course} • ${student.marks}/100`, "✓");
      return;
    }
    node.classList.remove("traversing");
  }

  setSearchFeedback("No match", `Roll ${roll} was not found after traversing ${nodes.length} node${nodes.length === 1 ? "" : "s"}.`, "×");
}

function clearTraversal() {
  document.querySelectorAll(".link-node").forEach(node => {
    node.classList.remove("traversing", "found");
  });
}

function setSearchFeedback(title, text, icon) {
  $("#searchFeedback").innerHTML = `
    <div class="feedback-icon">${escapeHTML(icon)}</div>
    <div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(text)}</span></div>
  `;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function resetDemo() {
  students = normalize(demoStudents);
  saveStudents();
  $("#tableSearch").value = "";
  $("#searchInput").value = "";
  setSearchFeedback("Ready to traverse", "Search a roll number to highlight each visited node.", "i");
  renderAll();
  showToast("Demo reset", "Sample linked-list records have been restored.");
}

function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem(THEME_KEY, theme);
  $("#themeToggle").textContent = theme === "light" ? "☾" : "☼";
}

$("#addForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const student = {
    name: $("#nameInput").value.trim(),
    roll: Number($("#rollInput").value),
    course: $("#courseInput").value.trim(),
    marks: Number($("#marksInput").value)
  };

  if (!student.name || !student.course || !student.roll || student.marks < 0 || student.marks > 100) {
    showToast("Check the form", "Please provide valid student information.");
    return;
  }

  if (addStudent(student)) {
    event.target.reset();
    $("#nameInput").focus();
  }
});

$("#searchBtn").addEventListener("click", () => {
  clearTimeout(traversalTimer);
  searchStudent(Number($("#searchInput").value));
});

$("#searchInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchStudent(Number($("#searchInput").value));
  }
});

$("#tableSearch").addEventListener("input", () => renderTable());

$("#resetDemo").addEventListener("click", resetDemo);

$("#themeToggle").addEventListener("click", () => {
  const next = document.body.classList.contains("light") ? "dark" : "light";
  setTheme(next);
});

$("#mobileToggle").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => $("#sidebar").classList.remove("open"));
});

const savedTheme = localStorage.getItem(THEME_KEY);
setTheme(savedTheme || "dark");
renderAll();
