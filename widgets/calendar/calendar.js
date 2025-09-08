// widgets/calendar/calendar.js - Calendar Widget Logic

class CalendarWidget {
  constructor() {
    this.calendar = null;
    this.currentView = 'week';
    this.currentDate = new Date();
    this.viewCycle = ['week', 'month', 'daily'];
    this.allDayObserver = null; // Add this property
    
    this.calendars = [
      {
        id: 'calendar1',
        name: 'Main Calendar',
        url: 'https://calendar.playmetrics.com/calendars/c1334/t398340/p0/t2BDEDC4E/f/calendar.ics',
        color: 'var(--cal-navy)',
        backgroundColor: 'var(--cal-navy)',
        borderColor: 'var(--cal-navy)'
      },
      {
        id: 'calendar2', 
        name: 'Secondary Calendar',
        url: 'https://calendar.playmetrics.com/calendars/c379/t346952/p0/tEB6F077C/f/calendar.ics',
        color: 'var(--cal-green)',
        backgroundColor: 'var(--cal-green)',
        borderColor: 'var(--cal-green)'
      }
    ];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    setTimeout(() => this.initializeCalendar(), 100);
  }

  setupEventListeners() {
    // D-pad Navigation
    window.addEventListener('message', (event) => {
      if (event.data && event.data.action) {
        this.handleCommand(event.data.action);
      }
    });

    // PC testing keys
    document.addEventListener('keydown', (e) => {
      if (document.hasFocus()) {
        switch(e.key) {
          case ',':
            e.preventDefault();
            this.cycleView('forward');
            break;
          case '.':
            e.preventDefault();
            this.cycleView('backward');
            break;
        }
      }
    });

    // Send ready signal
    window.addEventListener('load', () => {
      if (window.parent !== window) {
        window.parent.postMessage({ 
          type: 'widget-ready', 
          widget: 'calendar' 
        }, '*');
      }
    });
  }

  initializeCalendar() {
    try {
      const monday = this.getStartOfWeek(this.currentDate);
      this.currentDate = monday;
      
      // Add CSS-based hiding first
      this.addAllDayHidingCSS();
      
      this.calendar = new tui.Calendar('#calendar', {
        defaultView: this.currentView,
        useCreationPopup: false,
        useDetailPopup: false,
        calendars: this.calendars,
        week: {
          startDayOfWeek: 1,
          dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          narrowWeekend: false,
          workweek: false,
          hourStart: 6,
          hourEnd: 24,
          showNowIndicator: true
        },
        month: {
          startDayOfWeek: 1,
          dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          visibleWeeksCount: 6,
          isAlways6Week: false,
          workweek: false
        },
        template: {
          time: (schedule) => `<span style="color: white;">${schedule.title}</span>`
        }
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

  showCalendar() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('calendarHeader').style.display = 'flex';
    document.getElementById('calendar').style.display = 'block';
  }

  getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  updateCalendarHeader() {
    const titleEl = document.getElementById('calendarTitle');
    const modeEl = document.getElementById('calendarMode');
    
    const options = { 
      year: 'numeric', 
      month: 'long',
      ...(this.currentView === 'daily' ? { day: 'numeric' } : {})
    };
    
    titleEl.textContent = this.currentDate.toLocaleDateString('en-US', options);
    modeEl.textContent = this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1);
  }

  // IMPROVED: Enhanced all-day section hiding
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

  // Add CSS-based hiding for extra insurance
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

  handleCommand(action) {
    console.log('📅 Calendar widget received command:', action);
    
    switch(action) {
      case 'right':
        this.navigateCalendar('next');
        break;
      case 'left':
        this.navigateCalendar('previous');
        break;
      case 'up':
        this.scrollCalendar('up');
        break;
      case 'down':
        this.scrollCalendar('down');
        break;
      case 'enter':
        console.log('📅 Enter pressed on calendar widget');
        break;
      case 'fastforward':
      case 'ff':
      case ',':
        this.cycleView('forward');
        break;
      case 'rewind':
      case 'rw':
      case '.':
        this.cycleView('backward');
        break;
      default:
        console.log('📅 Calendar widget ignoring command:', action);
        break;
    }
  }

  navigateCalendar(direction) {
    const currentDateObj = this.calendar.getDate();
    let newDate = new Date(currentDateObj);
    
    switch(this.currentView) {
      case 'daily':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    this.currentDate = newDate;
    this.calendar.setDate(newDate);
    this.updateCalendarHeader();
    
    console.log('📅 Navigated', direction, 'to', newDate.toDateString());
  }

  scrollToTime(hour) {
    if (this.currentView === 'week' || this.currentView === 'daily') {
      const timeElements = document.querySelectorAll('.toastui-calendar-time-hour');
      const targetElement = Array.from(timeElements).find(el => {
        const hourText = el.textContent || el.innerText;
        return hourText.includes(hour + ':00') || hourText.includes((hour % 12 || 12) + ':00');
      });
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('📅 Scrolled to', hour + ':00');
      }
    }
  }

  scrollCalendar(direction) {
    if (this.currentView === 'week' || this.currentView === 'daily') {
      const scrollContainer = document.querySelector('.toastui-calendar-time-scroll-wrapper') 
                           || document.querySelector('.toastui-calendar-time');
      
      if (scrollContainer) {
        const scrollAmount = 60;
        
        if (direction === 'up') {
          scrollContainer.scrollTop -= scrollAmount;
        } else if (direction === 'down') {
          scrollContainer.scrollTop += scrollAmount;
        }
        
        console.log('📅 Scrolled calendar', direction, 'by', scrollAmount, 'pixels');
      }
    } else {
      console.log('📅 Scrolling only available in week/daily view');
    }
  }

  changeView(newView) {
    if (this.viewCycle.includes(newView)) {
      this.currentView = newView;
      this.calendar.changeView(newView);
      this.updateCalendarHeader();
      
      // Re-hide all-day sections when changing views
      this.hideAllDaySections();
      
      console.log('📅 Changed to', newView, 'view');
      
      if (newView === 'week' || newView === 'daily') {
        setTimeout(() => this.scrollToTime(8), 100);
      }
    }
  }

  cycleView(direction) {
    const currentIndex = this.viewCycle.indexOf(this.currentView);
    let newIndex;
    
    if (direction === 'forward') {
      newIndex = (currentIndex + 1) % this.viewCycle.length;
    } else {
      newIndex = (currentIndex - 1 + this.viewCycle.length) % this.viewCycle.length;
    }
    
    this.changeView(this.viewCycle[newIndex]);
  }

  async loadCalendarData() {
    console.log('📅 Loading calendar data...');
    
    for (const cal of this.calendars) {
      try {
        const sampleEvents = this.createSampleEvents(cal);
        this.calendar.createEvents(sampleEvents);
        console.log('📅 Loaded events for', cal.name);
      } catch (error) {
        console.error('📅 Failed to load calendar', cal.name, error);
      }
    }
  }

  createSampleEvents(cal) {
    const events = [];
    const today = new Date();
    
    for (let i = 0; i < 10; i++) {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + (i % 7));
      eventDate.setHours(8 + (i % 12), 0, 0, 0);
      
      const endDate = new Date(eventDate);
      endDate.setHours(eventDate.getHours() + 1);
      
      events.push({
        id: `${cal.id}-event-${i}`,
        calendarId: cal.id,
        title: `${cal.name.split(' ')[0]} Event ${i + 1}`,
        start: eventDate,
        end: endDate,
        category: 'time',
        backgroundColor: cal.backgroundColor,
        borderColor: cal.borderColor,
        color: 'white'
      });
    }
    
    return events;
  }

  // Clean up observer when destroying calendar
  destroy() {
    if (this.allDayObserver) {
      this.allDayObserver.disconnect();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CalendarWidget();
});
