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
      indicatorUp: document.querySelector('#menu-indicator-up'),
      indicatorDown: document.querySelector('#menu-indicator-down'),
      menuHidden: document.querySelector('#menu-hidden'),
    };

    if (!this.elements.menu) return;

    // Set initial state
    this.elements.menu.style.height = this.config.closedHeight;
    this.elements.menu.style.zIndex = this.config.closedZIndex;

    // Bind event listeners
    this.bindEvents();
  },

  bindEvents() {
    // Bind methods to this context
    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    // Add click handler for menu itself
    this.elements.menu.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Handle clicks outside menu
    document.addEventListener('click', this.handleClickOutside);

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
    } else {
      setTimeout(() => {
        this.elements.menu.style.zIndex = this.config.closedZIndex;
      }, 500);
    }

    // Toggle indicators
    if (newState) {
      this.elements.indicatorDown.style.opacity = '0';
      setTimeout(() => {
        this.elements.indicatorDown.style.display = 'none';
        this.elements.indicatorUp.style.display = 'block';
        this.elements.indicatorUp.style.opacity = '1';
      }, this.config.animationDelay);
    } else {
      this.elements.indicatorUp.style.opacity = '0';
      setTimeout(() => {
        this.elements.indicatorUp.style.display = 'none';
        this.elements.indicatorDown.style.display = 'block';
        this.elements.indicatorDown.style.opacity = '1';
      }, this.config.animationDelay);
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
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => MobileMenu.init());
