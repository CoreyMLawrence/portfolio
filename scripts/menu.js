const MobileMenu = {
  // Cache DOM elements
  elements: {
    menu: null,
    indicatorUp: null,
    indicatorDown: null,
    menuHidden: null,
  },

  // Configuration
  config: {
    closedHeight: '60px',
    openHeight: '330px',
    animationDelay: 400,
    transitionDuration: 500,
    closedZIndex: 996,
    openZIndex: 9999,
  },

  state: {
    isOpen: false,
  },

  init() {
    // Initialize DOM elements
    this.elements = {
      menu: document.querySelector('#mobile-menu'),
      indicatorDown: document.querySelector('#menu-indicator-down'),
      menuHidden: document.querySelector('#menu-hidden'),
    };

    if (!this.elements.menu) return;

    // Set initial state
    this.elements.menu.style.height = this.config.closedHeight;
    this.elements.menu.style.zIndex = this.config.closedZIndex;

    // Setup GSAP animation timeline
    this.timeline = gsap.timeline({ paused: true });
    this.timeline.to(this.elements.indicatorDown, {
      duration: 0.4,
      rotation: -180,
      y: -6, // Compensate for rotation offset
      transformOrigin: '50% 50%',
      ease: 'power2.inOut',
    });

    // Bind event listeners
    this.bindEvents();
  },

  bindEvents() {
    // Bind methods to this context
    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    // Add click handler for menu itself
    this.elements.menu.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Handle clicks outside menu
    document.addEventListener('click', this.handleClickOutside);

    // Handle scroll to close menu
    window.addEventListener('scroll', this.handleScroll);

    // Prevent menu from closing when clicking menu items (let them handle their own close)
    this.elements.menuHidden.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add menu item click handlers
    const menuItems = this.elements.menuHidden.querySelectorAll('a');
    menuItems.forEach((item) => {
      item.addEventListener('click', () => {
        this.toggleMenu(false);
      });
    });
  },

  toggleMenu(forceState) {
    const newState = forceState !== undefined ? forceState : !this.state.isOpen;
    this.state.isOpen = newState;

    // Update menu height and z-index
    this.elements.menu.style.height = newState
      ? this.config.openHeight
      : this.config.closedHeight;

    if (newState) {
      this.elements.menu.style.zIndex = this.config.openZIndex;
      this.timeline.play();
    } else {
      setTimeout(() => {
        this.elements.menu.style.zIndex = this.config.closedZIndex;
      }, 500);
      this.timeline.reverse();
    }

    // Toggle menu content visibility
    if (newState) {
      this.elements.menuHidden.style.display = 'block';
    } else {
      setTimeout(() => {
        this.elements.menuHidden.style.display = 'none';
      }, this.config.transitionDuration);
    }
  },

  handleClickOutside(event) {
    if (
      this.state.isOpen &&
      !this.elements.menu.contains(event.target) &&
      !event.target.closest('#menu-hidden')
    ) {
      this.toggleMenu(false);
    }
  },

  handleScroll() {
    if (this.state.isOpen) {
      this.toggleMenu(false);
    }
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => MobileMenu.init());
