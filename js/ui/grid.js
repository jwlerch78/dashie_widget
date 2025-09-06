// js/ui/grid.js - Widget Grid & Sidebar Rendering

import { state, elements, widgets, sidebarMapping, setFocus } from '../core/state.js';

// ---------------------
// WIDGET CREATION
// ---------------------

function createWidgetIframe(widget) {
  const iframe = document.createElement("iframe");
  iframe.src = widget.url || "about:blank";
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
    background: #333;
  `;
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  
  // Add load event listener
  iframe.addEventListener("load", () => {
    console.log(`Widget iframe loaded: ${widget.id}`);
  });
  
  // Add error handling
  iframe.addEventListener("error", () => {
    console.warn(`Widget iframe failed to load: ${widget.id}`);
  });
  
  return iframe;
}

function createFallbackWidget(widget) {
  const fallback = document.createElement("div");
  fallback.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #444;
    color: #999;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    padding: 20px;
    box-sizing: border-box;
    flex-direction: column;
  `;
  fallback.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 10px;">${widget.label}</div>
    <div>Widget not available</div>
    <div style="font-size: 12px; margin-top: 10px; color: #777;">URL: ${widget.url || 'No URL'}</div>
  `;
  return fallback;
}

// ---------------------
// GRID RENDERING
// ---------------------

export function renderGrid() {
  elements.grid.innerHTML = "";
  widgets.forEach(w => {
    const div = document.createElement("div");
    div.classList.add("widget");
    div.dataset.row = w.row;
    div.dataset.col = w.col;
    div.style.gridRow = `${w.row} / span ${w.rowSpan}`;
    div.style.gridColumn = `${w.col} / span ${w.colSpan}`;

    // Create iframe or fallback for widget content
    if (w.url) {
      const iframe = createWidgetIframe(w);
      div.appendChild(iframe);
    } else {
      const fallback = createFallbackWidget(w);
      div.appendChild(fallback);
    }

    elements.grid.appendChild(div);
  });
}

// ---------------------
// SIDEBAR RENDERING
// ---------------------

export function renderSidebar() {
  elements.sidebar.innerHTML = ""; // clear previous

  // Add Dashie logo (only visible when expanded)
  const logo = document.createElement("img");
  logo.src = "icons/Dashie_Full_Logo_White_Transparent.png";
  logo.classList.add("dashie-logo");
  logo.alt = "Dashie";
  elements.sidebar.appendChild(logo);

  // Separate main and system items
  const mainItems = sidebarOptions.filter(item => item.type === "main");
  const systemItems = sidebarOptions.filter(item => item.type === "system");

  // Create main items (content selection)
  mainItems.forEach((item, index) => {
    const div = createMenuItem(item, "main", index);
    elements.sidebar.appendChild(div);
  });

  // Add separator
  const separator = document.createElement("div");
  separator.classList.add("menu-separator");
  elements.sidebar.appendChild(separator);

  // Create system functions container (2x2 grid)
  const systemContainer = document.createElement("div");
  systemContainer.classList.add("system-functions");

  systemItems.forEach((item, index) => {
    const div = createMenuItem(item, "system", index + mainItems.length);
    systemContainer.appendChild(div);
  });

  elements.sidebar.appendChild(systemContainer);
}

// ---------------------
// MENU ITEM CREATION
// ---------------------

export function createMenuItem(item, type, globalIndex) {
  const div = document.createElement("div");
  div.classList.add("menu-item", type);
  div.dataset.menu = item.id;
  div.dataset.globalIndex = globalIndex; // for focus navigation

  // Highlight active main widget
  if (["calendar","map","camera"].includes(item.id) && item.id === state.currentMain) {
    div.classList.add("active");
  }

  // Icon - using CSS class instead of inline styles
  const img = document.createElement("img");
  img.src = item.iconSrc;
  img.classList.add("menu-icon"); // CSS handles objectFit and filter
  div.appendChild(img);

  // Label text (hidden by default, shown when expanded)
  const label = document.createElement("span");
  label.classList.add("menu-label");
  label.textContent = item.label || "";
  div.appendChild(label);

  // Add ONLY click events - NO HOVER EVENTS AT ALL
  addMenuItemEventListeners(div, type, globalIndex);

  return div;
}

// ---------------------
// EVENT LISTENERS (CLICK ONLY)
// ---------------------

function addMenuItemEventListeners(div, type, globalIndex) {
  // ONLY click events - absolutely no hover/mouseover/mouseout
  div.addEventListener("click", () => {
    console.log("Menu item clicked:", { 
      item: div.dataset.menu, 
      isAsleep: state.isAsleep, 
      confirmDialog: !!state.confirmDialog,
      selectedCell: !!state.selectedCell 
    });
    
    if (state.confirmDialog || state.isAsleep) return;
    
    // Don't allow menu clicks when widget is focused
    if (state.selectedCell) {
      console.log("⚠️ Menu item clicked while widget focused - ignoring");
      return;
    }
    
    // Set focus and expand sidebar
    setFocus({ type: "menu", index: globalIndex });
    elements.sidebar.classList.add("expanded");
    
    // Import navigation functions and execute
    import('../core/navigation.js').then(({ updateFocus, handleEnter }) => {
      updateFocus();
      
      // For system items, show expansion briefly then execute
      if (type === "system") {
        setTimeout(() => handleEnter(), 150);
      } else {
        handleEnter();
      }
    });
  });
  
  // NO mouseover, mouseout, mouseenter, mouseleave events AT ALL
}
