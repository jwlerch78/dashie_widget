// --- index.js ---

// ---------------------
// CONFIGURATION (comes from config.js)
// ---------------------
// - theme
// - sidebarOptions

// Explicit widget layout
let widgets = [
  { id: "clock", row: 1, col: 1, rowSpan: 1, colSpan: 1, label: "⏰ Clock" },
  { id: "agenda", row: 2, col: 1, rowSpan: 1, colSpan: 1, label: "📝 Agenda" },
  { id: "photos", row: 3, col: 1, rowSpan: 1, colSpan: 1, label: "🖼️ Photos" },
  { id: "map", row: 1, col: 2, rowSpan: 1, colSpan: 1, label: "🗺️ Map" },
  { id: "main", row: 2, col: 2, rowSpan: 2, colSpan: 1, label: "🌟 Main Widget" }
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
      div.textContent = sidebarMapping[currentMain] || "🌟 Main Widget";
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

    // Highlight active main widget
    if (["calendar","map","camera"].includes(item.id) && item.id === currentMain) {
      div.classList.add("active");
    }

    // Icon
    const img = document.createElement("img");
    img.src = item.iconSrc;
    img.classList.add("menu-icon");
    img.width = 24;
    img.height = 24;
    img.style.objectFit = "contain";
    img.style.filter = "invert(100%)"; // force white
    div.appendChild(img);

    // Label text (hidden by default)
    const label = document.createElement("span");
    label.classList.add("menu-label");
    label.textContent = item.label || "";
    div.appendChild(label);

    // Mouse / touch
    div.addEventListener("mouseover", () => {
      focus = { type: "menu", index };
      sidebarEl.classList.add("expanded");
      updateFocus();
    });
    div.addEventListener("mouseout", () => {
      if (focus.type !== "menu") sidebarEl.classList.remove("expanded");
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
  if (items[focus.index]) items[focus.index].classList.add("selected");
  
  // expand sidebar when menu is focused
  sidebarEl.classList.add("expanded");
} else {
  sidebarEl.classList.remove("expanded");
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

    if (dir === "left") col--;
    if (dir === "right") {
      if (col === 2) {
        // Move to sidebar
        focus = { type: "menu", index: 0 };
        updateFocus();
        return;
      }
      col++;
    }
    if (dir === "up") row--;
    if (dir === "down") row++;

    if (findWidget(row, col)) {
      focus = { type: "grid", row, col };
    }
  } else if (focus.type === "menu") {
    if (dir === "up" && focus.index > 0) focus.index--;
    if (dir === "down" && focus.index < sidebarEl.children.length - 1)
      focus.index++;
    if (dir === "left") {
      focus = { type: "grid", row: 1, col: 2 };
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
    const menuKey = menuItem?.dataset?.menu;

    
    if (menuKey === "sleep") {
      alert("Sleep function (placeholder)");  // TODO: hook into real sleep
    } else if (menuKey === "settings") {
      alert("Settings menu (placeholder)");  // TODO: hook into real settings
    } else if (menuKey === "reload") {
      location.reload();
    } else if (menuKey === "exit") {
      alert("Exit Dashie (placeholder)"); // TODO: hook into real exit
    } else if (menuKey) {
      currentMain = menuKey;
      renderGrid();
      renderSidebar();
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
