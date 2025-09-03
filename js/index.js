// --- index.js ---

// ---------------------
// CONFIGURATION
// ---------------------

// Explicit widget layout
let widgets = [
  { id: "clock", row: 1, col: 1, rowSpan: 1, colSpan: 1, label: "⏰ Clock" },
  { id: "agenda", row: 2, col: 1, rowSpan: 1, colSpan: 1, label: "📝 Agenda" },
  { id: "photos", row: 3, col: 1, rowSpan: 1, colSpan: 1, label: "🖼️ Photos" },
  { id: "map", row: 1, col: 2, rowSpan: 1, colSpan: 1, label: "🗺️ Map" },
  { id: "main", row: 2, col: 2, rowSpan: 2, colSpan: 1, label: "🌟 Main Widget" }
];

// Sidebar menu options
const sidebarOptions = [
  { id: "calendar", iconSrc: "icons/calendar-white.png" },
  { id: "map", icon: "🗺️" },
  { id: "camera", icon: "📷" },
  { id: "settings", icon: "⚙️" }
];

const sidebarOptions = [
  { id: "calendar", iconSrc: "icons/Menu-Calendar-60px.png" },
  { id: "map", iconSrc: "icons/Menu-Location-360px.png" },
  { id: "camera", iconSrc: "icons/Menu-VidCam-60px.png" },
  { id: "settings", iconSrc: "icons/Menu-Settings-60px.png" }
];


// Map sidebar key to main widget content
const sidebarMapping = {
  calendar: "📅 Calendar",
  map: "🗺️ Map",
  camera: "📷 Camera"
};

let currentMain = "calendar"; // default main widget

// ---------------------
// STATE
// ---------------------
const gridEl = document.getElementById("grid");
const sidebarEl = document.getElementById("sidebar");

let focus = { type: "grid", row: 1, col: 1 }; // current focus for D-pad navigation
let selectedCell = null; // focused widget

// ---------------------
// RENDERING
// ---------------------

function renderGrid() {
  gridEl.innerHTML = "";
  widgets.forEach(w => {
    const div = document.createElement("div");
    div.classList.add("widget");
    div.dataset.row = w.row;
    div.dataset.col = w.col;
    div.style.gridRow = `${w.row} / span ${w.rowSpan}`;
    div.style.gridColumn = `${w.col} / span ${w.colSpan}`;

    if (w.id === "main") {
      div.textContent = sidebarMapping[currentMain];
    } else {
      div.textContent = w.label;
    }

    gridEl.appendChild(div);
  });
}

function renderSidebar() {
  sidebarEl.innerHTML = ""; // clear previous

  sidebarOptions.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("menu-item");
    div.dataset.menu = item.id;

    // Create image
    const img = document.createElement("img");
    img.src = item.iconSrc; // path to your icon
    img.classList.add("menu-icon");
    img.width = 60; // force width
    img.height = 60; // force height
    img.style.objectFit = "contain"; // ensure it scales properly
    div.appendChild(img);

    // Mouse / touch support
    div.addEventListener("mouseover", () => {
      focus = { type: "menu", index };
      updateFocus();
    });
    div.addEventListener("click", () => {
      focus = { type: "menu", index };
      handleEnter();
    });

    sidebarEl.appendChild(div);
  });
}

function updateFocus() {
  // clear all highlights
  document.querySelectorAll(".widget, .menu-item")
    .forEach(el => el.classList.remove("selected", "focused"));

  // grid focus
  if (focus.type === "grid") {
    const cell = document.querySelector(
      `.widget[data-row="${focus.row}"][data-col="${focus.col}"]`
    );
    if (cell) cell.classList.add("selected");
  }

  // sidebar focus
  if (focus.type === "menu") {
    const items = sidebarEl.querySelectorAll(".menu-item");
    items[focus.index].classList.add("selected");
  }

  // focused widget
  if (selectedCell) {
    selectedCell.classList.add("focused");
  }
}

// ---------------------
// NAVIGATION HELPERS
// ---------------------

function findWidget(row, col) {
  return widgets.find(w => w.row === row && w.col === col);
}

// Send D-pad action to focused widget
function sendToWidget(action) {
  if (!selectedCell) return;
  const iframe = selectedCell.querySelector("iframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ action }, "*");
  }
}

function moveFocus(dir) {
  if (selectedCell) {
    // Widget is focused — send input there
    sendToWidget(dir);
    return;
  }

  if (focus.type === "grid") {
    let { row, col } = focus;

    if (dir === "left") {
      if (col === 1) {
        // Move to sidebar
        focus = { type: "menu", index: 0 };
        updateFocus();
        return;
      }
      col--;
    }
    if (dir === "right") col++;
    if (dir === "up") row--;
    if (dir === "down") row++;

    if (findWidget(row, col)) {
      focus = { type: "grid", row, col };
    }
  } else if (focus.type === "menu") {
    if (dir === "up" && focus.index > 0) focus.index--;
    if (dir === "down" && focus.index < sidebarEl.children.length - 1)
      focus.index++;
    if (dir === "right") {
      focus = { type: "grid", row: 1, col: 1 };
    }
  }

  updateFocus();
}

// ---------------------
// ENTER / BACK
// ---------------------

function handleEnter() {
  if (focus.type === "grid") {
    const el = document.querySelector(
      `.widget[data-row="${focus.row}"][data-col="${focus.col}"]`
    );
    if (selectedCell === el) {
      selectedCell = null;
    } else {
      selectedCell = el;
    }
  } else if (focus.type === "menu") {
    const menuItem = sidebarEl.children[focus.index];
    const menuKey = menuItem.dataset.menu;

    if (menuKey === "settings") {
      alert("Settings menu (placeholder)");
    } else {
      currentMain = menuKey;
      renderGrid();
    }
  }
  updateFocus();
}

function handleBack() {
  selectedCell = null;
  updateFocus();
}

// ---------------------
// KEY HANDLER
// ---------------------

document.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft": moveFocus("left"); break;
    case "ArrowRight": moveFocus("right"); break;
    case "ArrowUp": moveFocus("up"); break;
    case "ArrowDown": moveFocus("down"); break;
    case "Enter": handleEnter(); break;
    case "Escape": handleBack(); break;
    case "Backspace": handleBack(); break;
  }
});

// ---------------------
// INIT
// ---------------------

renderSidebar();
renderGrid();
updateFocus();
