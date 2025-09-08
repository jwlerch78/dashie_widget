// Improved method to hide all-day sections in widgets/calendar/calendar.js

hideAllDaySections() {
  // Use a more comprehensive approach with multiple timing attempts
  const hideAttempts = [100, 300, 500, 1000]; // Multiple timings to catch different render phases
  
  hideAttempts.forEach(delay => {
    setTimeout(() => {
      this.forceHideAllDaySections();
    }, delay);
  });
  
  // Also set up a MutationObserver to catch dynamically added elements
  this.setupAllDayObserver();
}

forceHideAllDaySections() {
  // More comprehensive selectors for Toast UI Calendar all-day sections
  const selectors = [
    // Main all-day containers
    '.toastui-calendar-weekday-allday-container',
    '.toastui-calendar-allday-container', 
    '.toastui-calendar-panel-allday',
    
    // Week view specific
    '.toastui-calendar-weekly-view .toastui-calendar-weekday-allday-container',
    '.toastui-calendar-weekly-view .toastui-calendar-allday-container',
    '.toastui-calendar-week-view .toastui-calendar-weekday-allday-container',
    '.toastui-calendar-week-view .toastui-calendar-allday-container',
    
    // Any element with 'allday' in the class name
    '[class*="allday"]',
    '[class*="all-day"]',
    
    // Specific Toast UI Calendar all-day elements
    '.toastui-calendar-panel-allday',
    '.toastui-calendar-allday',
    '.toastui-calendar-weekday-allday'
  ];
  
  let hiddenCount = 0;
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      // Skip if element is already hidden
      if (el.style.display === 'none') return;
      
      // Apply comprehensive hiding styles
      el.style.cssText = `
        display: none !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        visibility: hidden !important;
        opacity: 0 !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
      `;
      
      // Also add a CSS class for easier targeting
      el.classList.add('dashie-hidden-allday');
      hiddenCount++;
    });
  });
  
  if (hiddenCount > 0) {
    console.log(`📅 Hidden ${hiddenCount} all-day elements`);
  }
}

setupAllDayObserver() {
  // Watch for dynamically added all-day elements
  if (this.allDayObserver) {
    this.allDayObserver.disconnect();
  }
  
  const calendarContainer = document.getElementById('calendar');
  if (!calendarContainer) return;
  
  this.allDayObserver = new MutationObserver((mutations) => {
    let shouldHide = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Check if the added node or its children contain all-day elements
          const hasAllDay = node.classList && (
            Array.from(node.classList).some(cls => cls.includes('allday')) ||
            node.querySelector('[class*="allday"]')
          );
          
          if (hasAllDay) {
            shouldHide = true;
          }
        }
      });
    });
    
    if (shouldHide) {
      // Small delay to let the elements fully render
      setTimeout(() => this.forceHideAllDaySections(), 10);
    }
  });
  
  this.allDayObserver.observe(calendarContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
}

// Also add this CSS to widgets/calendar/calendar.css for extra insurance
addAllDayHidingCSS() {
  const style = document.createElement('style');
  style.textContent = `
    /* Force hide all-day sections globally */
    .toastui-calendar-weekday-allday-container,
    .toastui-calendar-allday-container,
    .toastui-calendar-panel-allday,
    .toastui-calendar-allday,
    .toastui-calendar-weekday-allday,
    [class*="allday"]:not(.toastui-calendar-event),
    .dashie-hidden-allday {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      visibility: hidden !important;
      opacity: 0 !important;
      overflow: hidden !important;
    }
    
    /* Ensure time section takes full height */
    .toastui-calendar-week-view .toastui-calendar-time,
    .toastui-calendar-weekly-view .toastui-calendar-time {
      height: 100% !important;
      flex: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

// Update the initializeCalendar method to call these
initializeCalendar() {
  try {
    // ... existing initialization code ...
    
    // Add CSS-based hiding first
    this.addAllDayHidingCSS();
    
    this.calendar = new tui.Calendar('#calendar', {
      // ... existing calendar config ...
    });

    this.calendar.setDate(this.currentDate);
    this.showCalendar();
    this.updateCalendarHeader();
    this.loadCalendarData();
    
    // Improved all-day hiding
    this.hideAllDaySections();
    
    setTimeout(() => this.scrollToTime(8), 200);
    
    console.log('📅 Calendar initialized in', this.currentView, 'view');
    
  } catch (error) {
    console.error('📅 Failed to initialize calendar:', error);
    document.getElementById('loading').textContent = 'Failed to load calendar';
  }
}

// Don't forget to clean up the observer when destroying the calendar
destroy() {
  if (this.allDayObserver) {
    this.allDayObserver.disconnect();
  }
}
