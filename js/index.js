// --- index.js ---

// ---------------------
// CONFIGURATION (comes from config.js)
// ---------------------
// - theme
// - sidebarOptions

// Explicit widget layout
let widgets = [
  { id: "map", row: 1, col: 1, rowSpan: 1, colSpan: 1, label: "🗺️ Locations" },
  { id: "clock", row: 1, col: 2, rowSpan: 1, colSpan: 1, label: "⏰ Clock" },
  { id: "main", row: 2, col: 1, rowSpan: 2, colSpan: 1, label: "📅 Calendar" }, 
  { id: "agenda", row: 2, col: 2, rowSpan: 1, colSpan: 1, label: "📝 Agenda" },
  { id: "photos", row: 3, col: 2, rowSpan: 1, colSpan: 1, label: "🖼️ Photos" }
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

  // Add Dashie logo (only visible when expanded)
  const logo = document.createElement("img");
  logo.src = "icons/Dashie_Full_Logo_White_Transparent.png";
  logo.classList.add("dashie-logo");
  logo.alt = "Dashie";
  sidebarEl.appendChild(logo);

  // Separate main and system items
  const mainItems = sidebarOptions.filter(item => item.type === "main");
  const systemItems = sidebarOptions.filter(item => item.type === "system");

  // Create main items (content selection)
  mainItems.forEach((item, index) => {
    const div = createMenuItem(item, "main", index);
    sidebarEl.appendChild(div);
  });

  // Add separator
  const separator = document.createElement("div");
  separator.classList.add("menu-separator");
  sidebarEl.appendChild(separator);

  // Create system functions container (2x2 grid)
  const systemContainer = document.createElement("div");
  systemContainer.classList.add("system-functions");

  systemItems.forEach((item, index) => {
    const div = createMenuItem(item, "system", index + mainItems.length);
    systemContainer.appendChild(div);
  });

  sidebarEl.appendChild(systemContainer);
}

function createMenuItem(item, type, globalIndex) {
  const div = document.createElement("div");
  div.classList.add("menu-item", type);
  div.dataset.menu = item.id;
  div.dataset.globalIndex = globalIndex; // for focus navigation

  // Highlight active main widget
  if (["calendar","map","camera"].includes(item.id) && item.id === currentMain) {
    div.classList.add("active");
  }

  // Icon
  const img = document.createElement("img");
  img.src = item.iconSrc;
  img.classList.add("menu-icon");
  img.style.objectFit = "contain";
  img.style.filter = "invert(100%)"; // force white
  div.appendChild(img);

  // Label text (hidden by default, shown when expanded)
  const label = document.createElement("span");
  label.classList.add("menu-label");
  label.textContent = item.label || "";
  div.appendChild(label);

  // Mouse / touch events
  div.addEventListener("mouseover", () => {
    focus = { type: "menu", index: globalIndex };
    sidebarEl.classList.add("expanded");
    updateFocus();
  });

  div.addEventListener("mouseout", () => {
    if (focus.type !== "menu") sidebarEl.classList.remove("expanded");
  });

  div.addEventListener("click", () => {
    focus = { type: "menu", index: globalIndex };
    
    // For system items, expand the menu first
    if (type === "system") {
      sidebarEl.classList.add("expanded");
      updateFocus();
      // Small delay to show expansion, then execute
      setTimeout(() => handleEnter(), 150);
    } else {
      handleEnter();
    }
  });

  return div;
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

    if (dir === "left") {
      if (col === 1) {
        // Leaving grid → go to sidebar
        const currentMainIndex = sidebarOptions.findIndex(item => item.id === currentMain);
        focus = { type: "menu", index: currentMainIndex >= 0 ? currentMainIndex : 0 };
        updateFocus();
        return;
      }
      col--;
    }
    if (dir === "right") {
      if (col < 2) col++;
    }
    if (dir === "up") row--;
    if (dir === "down") row++;

    // Clamp to valid cells
    if (row < 1) row = 1;
    if (row > 3) row = 3;
    if (col < 1) col = 1;
    if (col > 2) col = 2;

    // Snap into main widget if moving in its area
    if (col === 1 && (row === 2 || row === 3)) {
      focus = { type: "grid", row: 2, col: 1 }; // main widget cell
    } else if (findWidget(row, col)) {
      focus = { type: "grid", row, col };
    }
  } else if (focus.type === "menu") {
    const totalItems = sidebarOptions.length;

    if (dir === "up" && focus.index > 0) focus.index--;
    if (dir === "down" && focus.index < totalItems - 1) focus.index++;
    if (dir === "right") {
      // Leaving sidebar back into grid, start at top-left (map)
      focus = { type: "grid", row: 1, col: 1 };
      sidebarEl.classList.remove("expanded");
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
    const menuItems = sidebarEl.querySelectorAll(".menu-item");
    const menuItem = menuItems[focus.index];
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
      // Main content items
      currentMain = menuKey;
      renderGrid();
      renderSidebar();
    }
  }
  updateFocus();
}

function handleBack() {
  if (focus.type === "menu") {
    // If in menu, collapse it and return to grid
    sidebarEl.classList.remove("expanded");
    focus = { type: "grid", row: 1, col: 1 };
  } else {
    // If widget is focused, unfocus it
    selectedCell = null;
  }
  updateFocus();
}

function openMenuWithCurrentSelection() {
  // Find the index of the currently active main widget
  const currentMainIndex = sidebarOptions.findIndex(item => item.id === currentMain);
  focus = { type: "menu", index: currentMainIndex >= 0 ? currentMainIndex : 0 };
  sidebarEl.classList.add("expanded");
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
    case "m":
    case "M": openMenuWithCurrentSelection(); break;
  }
});

// Click outside menu to close it
document.addEventListener("click", e => {
  if (!sidebarEl.contains(e.target) && sidebarEl.classList.contains("expanded")) {
    sidebarEl.classList.remove("expanded");
    if (focus.type === "menu") {
      focus = { type: "grid", row: 1, col: 1 };
      updateFocus();
    }
  }
});

// ---------------------
// INIT
// ---------------------

renderSidebar();
renderGrid();
updateFocus();
