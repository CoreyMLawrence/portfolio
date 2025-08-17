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

    // Cache elements
    this.els = {};

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

    this.cacheElements();

    if (this.prefersReducedMotion) {
      this.showAllImmediately();
      return;
    }

    this.setInitialStates();
    this.createTimeline();
  }

  cacheElements() {
    this.els = {
      chatShell: document.querySelector('.chat-shell'),
      profileShell: document.querySelector('.profile-shell'),
      statusDot: document.querySelector('.status-dot'),
      welcomeH3: document.querySelector('.welcome-message h3'),
      welcomeP: document.querySelector('.welcome-message p'),
      suggestionChips: document.querySelector('.suggestion-chips'),
    };

    // Store original text and prepare for typing
    if (this.els.welcomeH3) {
      this.originalText =
        this.els.welcomeH3.textContent || 'Ask me anything about Corey';
    }
  }

  showAllImmediately() {
    // Fallback for reduced motion preference
    gsap.set([this.els.chatShell, this.els.profileShell], {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
    });

    gsap.set([this.els.welcomeP, this.els.suggestionChips], {
      opacity: 1,
      y: 0,
    });

    if (this.els.welcomeH3) {
      this.els.welcomeH3.textContent = this.originalText;
    }
  }

  setInitialStates() {
    // Clear welcome text for typing effect
    if (this.els.welcomeH3) {
      this.els.welcomeH3.textContent = '';
    }

    // Ensure welcome content is hidden
    gsap.set([this.els.welcomeP, this.els.suggestionChips], {
      opacity: 0,
      y: 20,
      pointerEvents: 'none',
    });
  }

  createTimeline() {
    this.isAnimating = true;
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        // Re-enable interactions
        gsap.set([this.els.welcomeP, this.els.suggestionChips], {
          pointerEvents: 'auto',
        });
      },
    });

    const tl = this.timeline;
    const isDesktop = window.innerWidth > 1050;

    // 1. Main containers entrance (0s start)
    tl.to(
      this.els.chatShell,
      {
        duration: 0.8,
        opacity: 1,
        scale: 1,
        y: 0,
        ease: 'power2.out',
      },
      0
    );

    // 2. Profile shell (desktop only, overlapped)
    if (this.els.profileShell && isDesktop) {
      tl.to(
        this.els.profileShell,
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

    // 3. Status dot animation sequence (overlapped with containers)
    tl.to(
      this.els.statusDot,
      {
        duration: 0.5,
        scale: 1.3,
        ease: 'power2.out',
      },
      0.6
    )
      .to(this.els.statusDot, {
        duration: 0.3,
        scale: 0.8,
        ease: 'power2.inOut',
      })
      .to(this.els.statusDot, {
        duration: 0.4,
        scale: 1,
        ease: 'elastic.out(1, 0.3)',
      })
      .to(
        this.els.statusDot,
        {
          duration: 0.3,
          backgroundColor: '#30d158',
          ease: 'power2.out',
        },
        0.6
      ) // Start with scale animation
      .to(this.els.statusDot, {
        duration: 0.6,
        backgroundColor: '#34c759',
        ease: 'power2.out',
      });

    // 4. Welcome message typing (starts overlapped with status dot animation)
    const typingStartTime = 0.2;
    const typingDuration = (this.originalText.length * this.typingSpeed) / 1000;

    tl.call(() => this.startTyping(), null, typingStartTime);

    // 5. Welcome content reveal (after typing completes)
    const contentStartTime = typingStartTime + typingDuration + 0.3;

    tl.to(
      this.els.welcomeP,
      {
        duration: 0.6,
        opacity: 1,
        y: 0,
        ease: 'power2.out',
      },
      contentStartTime
    ).to(
      this.els.suggestionChips,
      {
        duration: 0.7,
        opacity: 1,
        y: 0,
        ease: 'power2.out',
      },
      contentStartTime + 0.2
    ); // Stagger slightly
  }

  startTyping() {
    if (!this.els.welcomeH3 || !this.originalText) return;

    let currentIndex = 0;
    const text = this.originalText;

    const typeNextChar = () => {
      if (currentIndex <= text.length) {
        this.els.welcomeH3.textContent = text.substring(0, currentIndex);
        currentIndex++;

        if (currentIndex <= text.length) {
          // Vary typing speed slightly for natural feel
          const nextDelay = this.typingSpeed + (Math.random() * 20 - 10);
          setTimeout(typeNextChar, nextDelay);
        }
      }
    };

    typeNextChar();
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

// Initialize when script loads
window.ChatIntroAnimations = new ChatIntroAnimations();
