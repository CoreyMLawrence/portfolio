/**
 * Optimized Apple-style Intro Animations for Chat Interface
 * Single timeline, GSAP best practices, reliable timing
 */

class ChatIntroAnimations {
  constructor() {
    this.timeline = null;
    this.isAnimating = false;
    this.prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    this.typingSpeed = 50; // ms per character
    this.originalText = '';

    // Initialize
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    if (!window.gsap) {
      console.warn('GSAP not loaded, skipping animations');
      return;
    }

    // Ensure essential elements exist before starting animations
    const chatShell = document.querySelector('.chat-shell');
    if (!chatShell) {
      console.warn('Essential elements not found, retrying in 100ms');
      setTimeout(() => this.setup(), 100);
      return;
    }

    if (this.prefersReducedMotion) {
      this.showAllImmediately();
      return;
    }

    this.setInitialStates();
    this.createTimeline();
  }

  showAllImmediately() {
    // Fallback for reduced motion preference
    const chatShell = document.querySelector('.chat-shell');
    const profileShell = document.querySelector('.profile-shell');
    const welcomeP = document.querySelector('.welcome-message p');
    const suggestionChips = document.querySelector('.suggestion-chips');
    const welcomeH3 = document.querySelector('.welcome-message h3');

    // Only animate elements that exist
    const containerElements = [chatShell, profileShell].filter((el) => el);
    if (containerElements.length > 0) {
      gsap.set(containerElements, {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      });
    }

    const contentElements = [welcomeP, suggestionChips].filter((el) => el);
    if (contentElements.length > 0) {
      gsap.set(contentElements, {
        opacity: 1,
        y: 0,
      });
    }

    if (welcomeH3) {
      welcomeH3.textContent =
        this.originalText || 'Ask me anything about Corey';
      // Show all characters immediately if they were wrapped in spans
      const spans = welcomeH3.querySelectorAll('span');
      if (spans.length > 0) {
        gsap.set(spans, { opacity: 1 });
      }
    }
  }

  setInitialStates() {
    // Set up h3 with full text but hidden characters for typing animation
    const welcomeH3 = document.querySelector('.welcome-message h3');
    if (welcomeH3) {
      this.originalText =
        welcomeH3.textContent || 'Ask me anything about Corey';
      this.prepareStaticLayout();
    }

    // Ensure welcome content is hidden - with null checks
    const welcomeP = document.querySelector('.welcome-message p');
    const suggestionChips = document.querySelector('.suggestion-chips');

    // Only animate elements that exist
    const elementsToHide = [welcomeP, suggestionChips].filter((el) => el);
    if (elementsToHide.length > 0) {
      gsap.set(elementsToHide, {
        opacity: 0,
        y: 20,
        pointerEvents: 'none',
      });
    }
  }

  prepareStaticLayout() {
    const element = document.querySelector('.welcome-message h3');
    if (!element) return;

    const text = this.originalText;

    // Clear and wrap each character in a span for individual control
    element.innerHTML = '';

    const spans = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const span = document.createElement('span');
      span.textContent = char;
      span.style.display = 'inline';
      element.appendChild(span);
      spans.push(span);
    }

    // Store character spans for animation
    this.charSpans = spans;

    // Use GSAP to set initial opacity instead of inline styles
    gsap.set(this.charSpans, { opacity: 0 });
  }
  createTimeline() {
    this.isAnimating = true;
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        // Re-enable interactions - with null checks
        const welcomeP = document.querySelector('.welcome-message p');
        const suggestionChips = document.querySelector('.suggestion-chips');
        const elementsToEnable = [welcomeP, suggestionChips].filter((el) => el);
        if (elementsToEnable.length > 0) {
          gsap.set(elementsToEnable, {
            pointerEvents: 'auto',
          });
        }
      },
    });

    const tl = this.timeline;

    // Query elements with null checks
    const chatShell = document.querySelector('.chat-shell');
    const profileShell = document.querySelector('.profile-shell');
    const statusDot = document.querySelector('.status-dot');
    const welcomeP = document.querySelector('.welcome-message p');
    const suggestionChips = document.querySelector('.suggestion-chips');

    // 1. Main containers entrance (0s start) - only if element exists
    if (chatShell) {
      tl.to(
        chatShell,
        {
          duration: 0.8,
          opacity: 1,
          scale: 1,
          y: 0,
          ease: 'power2.out',
        },
        0
      );
    }

    // 2. Profile shell (desktop only, overlapped) - only if element exists
    if (profileShell) {
      tl.to(
        profileShell,
        {
          duration: 0.7,
          opacity: 1,
          x: 0,
          scale: 1,
          ease: 'power2.out',
        },
        0.2
      ); // Start 0.2s after chat shell
    }

    // 3. Welcome message typing (starts overlapped with status dot animation)
    const typingStartTime = 0.2;
    const typingDuration = (this.originalText.length * 60) / 1000; // Simplified timing

    tl.call(() => this.startTyping(), null, typingStartTime);

    // 5. Welcome content reveal (after typing completes) - only if elements exist
    const contentStartTime = typingStartTime + typingDuration + 0.3;

    if (welcomeP) {
      tl.to(
        welcomeP,
        {
          duration: 0.6,
          opacity: 1,
          y: 0,
          ease: 'power2.out',
        },
        contentStartTime
      );
    }

    if (suggestionChips) {
      tl.to(
        suggestionChips,
        {
          duration: 0.7,
          opacity: 1,
          y: 0,
          ease: 'power2.out',
        },
        contentStartTime + 0.2
      ); // Stagger slightly
    }

    // 4. Status dot animation sequence — play as the final step so the dot animates last
    if (statusDot) {
      tl.to(statusDot, {
        duration: 0.5,
        scale: 1.3,
        ease: 'power2.out',
      })
        .to(statusDot, {
          duration: 0.3,
          scale: 0.8,
          ease: 'power2.inOut',
        })
        .to(statusDot, {
          duration: 0.4,
          scale: 1,
          ease: 'elastic.out(1, 0.3)',
        })
        .to(statusDot, {
          duration: 0.3,
          backgroundColor: '#30d158',
          ease: 'power2.out',
        }) // color pulse
        .to(statusDot, {
          duration: 0.6,
          backgroundColor: '#34c759',
          ease: 'power2.out',
        });
    }
  }

  startTyping() {
    const welcomeH3 = document.querySelector('.welcome-message h3');
    if (!welcomeH3 || !this.originalText || !this.charSpans) return;

    const spans = this.charSpans;
    const text = this.originalText;

    // Premium smooth staggered reveal using GSAP timeline
    const tl = gsap.timeline();

    // Custom function for premium effect per character
    spans.forEach((span, i) => {
      const char = text[i];
      let baseDelay = 0.045; // seconds
      // Slightly slower for punctuation, faster for spaces
      if (['.', ',', '!', '?', ';', ':'].includes(char)) {
        baseDelay += 0.09;
      } else if (char === ' ') {
        baseDelay -= 0.02;
      }
      tl.to(
        span,
        {
          opacity: 1,
          scale: 1.12,
          y: -2,
          filter: 'blur(0px)',
          duration: 0.22,
          ease: 'power3.out',
          onStart: () => {
            // Subtle fade-in shadow for premium effect
            span.style.textShadow = '0 2px 8px rgba(60,60,60,0.08)';
          },
          onComplete: () => {
            // Remove scale and shadow after reveal
            gsap.to(span, {
              scale: 1,
              y: 0,
              duration: 0.18,
              ease: 'power2.inOut',
              textShadow: 'none',
            });
          },
        },
        i * baseDelay
      );
    });

    // Finish animation for the whole h3 after all chars
    tl.to(
      welcomeH3,
      {
        scale: 1.03,
        duration: 0.18,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      },
      spans.length * 0.045 + 0.1
    );
  }

  // Public method to replay animation
  replay() {
    if (this.isAnimating) return;

    if (this.timeline) {
      this.timeline.kill();
    }

    this.setInitialStates();
    this.createTimeline();
  }

  // Public method to skip to end
  skipToEnd() {
    if (this.timeline) {
      this.timeline.progress(1);
    }
  }

  // Cleanup method
  destroy() {
    if (this.timeline) {
      this.timeline.kill();
    }
    this.timeline = null;
    this.isAnimating = false;
  }
}

// Initialize when script loads - prevent multiple instances
if (!window.ChatIntroAnimations) {
  window.ChatIntroAnimations = new ChatIntroAnimations();
}
