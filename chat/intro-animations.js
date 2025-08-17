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
      // Show all characters immediately if they were wrapped in spans
      const spans = this.els.welcomeH3.querySelectorAll('span');
      if (spans.length > 0) {
        gsap.set(spans, { opacity: 1 });
      }
    }
  }

  setInitialStates() {
    // Set up h3 with full text but hidden characters for typing animation
    if (this.els.welcomeH3) {
      this.prepareStaticLayout();
    }

    // Ensure welcome content is hidden
    gsap.set([this.els.welcomeP, this.els.suggestionChips], {
      opacity: 0,
      y: 20,
      pointerEvents: 'none',
    });
  }

  prepareStaticLayout() {
    const element = this.els.welcomeH3;
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
    const typingDuration = (this.originalText.length * 60) / 1000; // Simplified timing

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
    if (!this.els.welcomeH3 || !this.originalText || !this.charSpans) return;

    let currentIndex = 0;
    const text = this.originalText;
    const spans = this.charSpans;

    // Simple typing speed with natural variation
    const baseSpeed = 50; // ms per character

    const revealNextChar = () => {
      if (currentIndex < spans.length) {
        const currentSpan = spans[currentIndex];
        const currentChar = text[currentIndex];

        // Simply reveal character by setting opacity to 1
        gsap.to(currentSpan, {
          duration: 0.1,
          opacity: 1,
          ease: 'power2.out',
        });

        if (currentIndex < spans.length - 1) {
          // Calculate delay with natural variation
          let delay = baseSpeed;

          // Slightly slower for punctuation and spaces
          if (['.', ',', '!', '?', ';', ':'].includes(currentChar)) {
            delay += 150;
          } else if (currentChar === ' ') {
            delay *= 0.7;
          }

          // Add natural variation
          delay += Math.random() * 20 - 10;

          currentIndex++;
          setTimeout(revealNextChar, Math.max(delay, 30));
        } else {
          // Simple finish animation - just a subtle scale
          gsap.to(this.els.welcomeH3, {
            duration: 0.2,
            scale: 1.02,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
          });
        }
      }
    };

    // Start typing after a brief pause
    setTimeout(revealNextChar, 200);
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
