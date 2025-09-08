// js/main.js - App Initialization & Orchestration

import { initializeEvents } from './core/events.js';
import { updateFocus, initializeHighlightTimeout } from './core/navigation.js';
import { renderGrid, renderSidebar } from './ui/grid.js';
import { initializeSleepTimer } from './ui/settings.js';

// ---------------------
// APP INITIALIZATION
// ---------------------

function initializeApp() {
  console.log("Initializing Dashie Dashboard...");
  
  // Set up event listeners
  initializeEvents();
  
  // Initialize sleep timer system
  initializeSleepTimer();
  
  // Initialize navigation highlight timeout system
  initializeHighlightTimeout();
  
  // Render initial UI
  renderSidebar();
  renderGrid();
  
  // DON'T call updateFocus() here - let it start clean with no highlights
  // updateFocus();
  
  console.log("Dashie Dashboard initialized successfully!");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
