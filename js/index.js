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
let isAsleep = false; // sleep mode state
let confirmDialog = null; // exit confirmation dialog state

// ---------------------
// SLEEP MODE
// ---------------------

function enterSleepMode() {
  isAsleep = true;
  
  // Create sleep overlay
  const sleepOverlay = document.createElement("div");
  sleepOverlay.id = "sleep-overlay";
  sleepOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-size: 24px;
    cursor: pointer;
    transition: opacity 0.5s ease;
  `;
  
  sleepOverlay.textContent = "💤";
  document.body.appendChild(sleepOverlay);
  
  // Fade in
  setTimeout(() => {
    sleepOverlay.style.opacity = "1";
  }, 10);
  
  // Add wake up listeners
  sleepOverlay.addEventListener("click", wakeUp);
}

function wakeUp() {
  if (!isAsleep) return;
  
  isAsleep = false;
  const sleepOverlay = document.getElementById("sleep-overlay");
  
  if (sleepOverlay) {
    sleepOverlay.style.opacity = "0";
    setTimeout(() => {
      sleepOverlay.remove();
    }, 500);
  }
}

// ---------------------
// EXIT CONFIRMATION
// ---------------------

function showExitConfirmation() {
  if (confirmDialog) return; // Already showing
  
  // Create modal backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "exit-backdrop";
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Create confirmation dialog
  const dialog = document.createElement("div");
  dialog.id = "exit-dialog";
  dialog.style.cssText = `
    background: #333;
    color: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    min-width: 300px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  `;
  
  // Dialog content
  dialog.innerHTML = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px;">Are you sure you want to exit?</h2>
    <div id="exit-buttons" style="display: flex; gap: 20px; justify-content: center; margin-top: 30px;">
      <button id="exit-yes" style="padding: 12px 24px; background: #d32f2f; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; outline: 3px solid transparent; transition: all 0.2s;">Yes</button>
      <button id="exit-no" style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; outline: 3px solid transparent; transition: all 0.2s;">No</button>
    </div>
  `;
  
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  
  // Set up confirmation state
  confirmDialog = {
    element: backdrop,
    selectedButton: "no", // default to "no"
    buttons: {
      yes: dialog.querySelector("#exit-yes"),
      no: dialog.querySelector("#exit-no")
    }
  };
  
  // Update button highlighting
  updateExitButtonHighlight();
  
  // Add event listeners
  confirmDialog.buttons.yes.addEventListener("click", () => handleExitChoice("yes"));
  confirmDialog.buttons.no.addEventListener("click", () => handleExitChoice("no"));
  
  // Add hover effects for mouse interaction
  Object.entries(confirmDialog.buttons).forEach(([key, button]) => {
    button.addEventListener("mouseenter", () => {
      confirmDialog.selectedButton = key;
      updateExitButtonHighlight();
    });
    
    button.addEventListener("mouseleave", () => {
      // Keep current selection, just update highlight
      updateExitButtonHighlight();
    });
  });
  
  // Click backdrop to cancel
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      handleExitChoice("no");
    }
  });
}

function updateExitButtonHighlight() {
  if (!confirmDialog) return;
  
  // Clear all highlights
  Object.values(confirmDialog.buttons).forEach(btn => {
    btn.style.outline = "3px solid transparent";
    btn.style.transform = "scale(1)";
  });
  
  // Highlight selected button
  const selectedBtn = confirmDialog.buttons[confirmDialog.selectedButton];
  selectedBtn.style.outline = "3px solid #ffaa00";
  selectedBtn.style.transform = "scale(1.05)";
}

function moveExitFocus(direction) {
  if (!confirmDialog) return;
  
  if (direction === "left" || direction === "right") {
    confirmDialog.selectedButton = confirmDialog.selectedButton === "yes" ? "no" : "yes";
    updateExitButtonHighlight();
  }
}

function handleExitChoice(choice) {
  if (!confirmDialog) return;
  
  if (choice === "yes") {
    // In a real app, this would close the application
    alert("Exiting Dashie...");
    // For demo purposes, we'll just close the dialog
  }
  
  // Remove dialog
  confirmDialog.element.remove();
  confirmDialog = null;
}

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
    if (confirmDialog || isAsleep) return; // Don't respond when modal is open or asleep
    focus = { type: "menu", index: globalIndex };
    sidebarEl.classList.add("expanded");
    updateFocus();
  });

  div.addEventListener("mouseout", () => {
    if (confirmDialog || isAsleep) return;
    if (focus.type !== "menu") sidebarEl.classList.remove("expanded");
  });

  div.addEventListener("click", () => {
    if (confirmDialog || isAsleep) return;
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
  if (confirmDialog || isAsleep) return; // Don't update focus when modal is open or asleep
  
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
  if (isAsleep || confirmDialog) return; // Don't move focus when asleep or in modal
  
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
  if (isAsleep) {
    wakeUp();
    return;
  }
  
  if (confirmDialog) {
    handleExitChoice(confirmDialog.selectedButton);
    return;
  }
  
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
      enterSleepMode();
    } else if (menuKey === "settings") {
      alert("Settings menu (placeholder)");  // TODO: hook into real settings
    } else if (menuKey === "reload") {
      location.reload();
    } else if (menuKey === "exit") {
      showExitConfirmation();
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
  if (isAsleep) {
    wakeUp();
    return;
  }
  
  if (confirmDialog) {
    handleExitChoice("no"); // Default to "no" when pressing back
    return;
  }
  
  if (focus.type === "menu") {
    // If in menu, collapse it and return to grid (map in top-left)
    sidebarEl.classList.remove("expanded");
    focus = { type: "grid", row: 1, col: 1 };
  } else {
    // If widget is focused, unfocus it
    selectedCell = null;
  }
  updateFocus();
}

function openMenuWithCurrentSelection() {
  if (isAsleep || confirmDialog) return;
  
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
  // Handle sleep mode - any key wakes up
  if (isAsleep) {
    e.preventDefault();
    wakeUp();
    return;
  }
  
  // Handle exit confirmation dialog
  if (confirmDialog) {
    e.preventDefault();
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowRight":
        moveExitFocus(e.key === "ArrowLeft" ? "left" : "right");
        break;
      case "Enter":
        handleExitChoice(confirmDialog.selectedButton);
        break;
      case "Escape":
      case "Backspace":
        handleExitChoice("no");
        break;
    }
    return;
  }
  
  // Normal navigation
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
  if (confirmDialog || isAsleep) return;
  
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
