document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(ScrollTrigger);
  // Initial animations
  gsap.from('.headline', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
  });

  gsap.from('.headline-line2', {
    duration: 1,
    y: 30,
    opacity: 0,
    delay: 0.4, // Slightly increased delay to differentiate from line 1
    ease: 'power3.out',
  });

  gsap.from('.subheadline', {
    duration: 1,
    opacity: 0,
    delay: 0.6,
    ease: 'power3.out',
  });

  gsap.from('.hero .cta', {
    duration: 1,
    opacity: 0,
    delay: 0.9,
    ease: 'power3.out',
  });

  // Add animation for the #highlight block
  gsap.from('#highlight', {
    duration: 1,
    padding: '0.5em 0em', // Initial padding
    ease: 'power3.out',
    delay: 0.0, // Adjust the delay as needed to fit your sequence
    onComplete: () => {
      gsap.to('#highlight', {
        padding: '0.5em 2.5em', // Final padding
        duration: 0.5, // Duration for the padding expansion
        ease: 'power3.out',
      });
    },
  });

  gsap.from('#expertise-title', {
    scrollTrigger: {
      trigger: '#expertise-title',
      start: 'top close%',
      toggleActions: 'play none none reverse',
    },
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
  });

  // Scroll animations
  gsap.fromTo(
    '.expertise-card',
    {
      y: 50,
      opacity: 0,
    },
    {
      y: 0, // End at y: 0
      opacity: 1,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.expertise',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    }
  );

  gsap.from('.journey-content', {
    scrollTrigger: {
      trigger: '.journey-content',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
    duration: 1,
    x: -50,
    opacity: 0,
    ease: 'power3.out',
  });

  gsap.from('.headshot img', {
    scrollTrigger: {
      trigger: '.journey-content',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
    duration: 1.5,
    scale: 0.9,
    opacity: 0,
    rotation: 10,
    ease: 'power3.out',
    transformOrigin: 'center center',
  });

  gsap.from('.stats > div', {
    scrollTrigger: {
      trigger: '.stats',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
    duration: 1,
    y: 30,
    opacity: 0,
    stagger: 0.2,
    ease: 'power3.out',
  });

  gsap.from('#project-title', {
    scrollTrigger: {
      trigger: '#project-title',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
  });

  // Scroll animations
  gsap.fromTo(
    '.project-card',
    {
      x: 50, // Start at x: 50
      opacity: 0,
    },
    {
      x: 0, // End at x: 0
      opacity: 1,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.projects',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    }
  );
  // Create a timeline for the CTA section animations
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.cta-section',
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
  });

  // Add animations to the timeline
  tl.from('.cta-section', {
    duration: 1.5,
    y: 60,
    opacity: 0,
    ease: 'power3.out',
    stagger: {
      each: 0.15,
      from: 'start',
    },
  })
    .from(
      '.cta-content h2',
      {
        duration: 1.2,
        y: 40,
        opacity: 0,
        ease: 'power3.out',
        delay: 0,
      },
      '-=1.2'
    ) // Overlap with the previous animation
    .from(
      '.cta-content p',
      {
        duration: 1.2,
        y: 40,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.4,
      },
      '-=1.2'
    ) // Overlap with the previous animation
    .from(
      '.connect-links',
      {
        duration: 1.2,
        y: 40,
        opacity: 0,
        scale: 0.95,
        ease: 'power3.out',
        delay: 0.6,
        transformOrigin: 'center center',
      },
      '-=1.2'
    ); // Overlap with the previous animation
  //
  //
  //
  //
  //
  let fullStory = document.querySelector('.full-story');
  let closeButton = document.querySelector('.close-button');
  let body = document.querySelector('body');

  function toggleStory() {
    const isVisible = fullStory.style.display === 'flex';

    if (!isVisible) {
      fullStory.style.display = 'flex';
      closeButton.style.display = 'flex';
      body.style.overflowY = 'hidden'; // Disable body scroll

      // Add a new entry to the history stack
      history.pushState({ fullStoryOpen: true }, '');
    } else {
      closeFullStory();
    }
  }

  function closeFullStory() {
    fullStory.style.display = 'none';
    closeButton.style.display = 'none';
    body.style.overflowY = 'auto'; // Re-enable body scroll

    // Go back in history to remove the last entry
    history.back();
  }

  // Listen for the popstate event to close the full story
  window.addEventListener('popstate', function (event) {
    if (event.state && event.state.fullStoryOpen) {
      closeFullStory();
    }
  });

  document
    .querySelector('.read-more-button')
    .addEventListener('click', toggleStory);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && fullStory.style.display === 'flex') {
      closeFullStory();
    }
  });

  fullStory.addEventListener('click', function (event) {
    if (event.target === fullStory) {
      closeFullStory();
    }
  });

  closeButton.addEventListener('click', closeFullStory);

  // Swipe detection variables
  let startX = 0;
  let startY = 0;
  let isSwiping = false;
  const threshold = 70; // Minimum swipe distance

  // Touch start event
  fullStory.addEventListener('touchstart', function (event) {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = false; // Reset swiping status
  });

  // Touch move event
  fullStory.addEventListener('touchmove', function (event) {
    const touch = event.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Determine if we are swiping
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = true; // Set swiping to true if horizontal movement is greater
      event.preventDefault(); // Prevent default scroll behavior only if swiping
    }
  });

  // Touch end event
  fullStory.addEventListener('touchend', function (event) {
    if (isSwiping) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;

      // Check for horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        closeFullStory(); // Close if swipe is beyond threshold
      }
    }
  });

  //
  //
  //
  //
  //
  //
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      // Disable touch interaction
      document.body.classList.add('no-pointer');

      const targetId = this.getAttribute('href');
      let customOffset = 0;

      // Updated breakpoints
      switch (targetId) {
        case '#projects':
          customOffset = -30; // Offset for Projects
          break;
        case '#about':
          customOffset = 80; // Offset for About
          break;
        case '#specialties':
          customOffset = -40; // Offset for Specialties
          break;
      }

      scrollToSection(targetId, customOffset);

      // Re-enable touch interaction after 500ms
      setTimeout(() => {
        document.body.classList.remove('no-pointer');
      }, 500);
    });
  });

  function scrollToSection(targetId, customOffset) {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const elementPosition =
        targetElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition + customOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth', // or 'auto' depending on your needs
      });
    }
  }

  const consoleStyles = {
    title: `
    color: #2563eb;
    font-size: 24px;
    font-weight: bold;
    text-shadow: 2px 2px 0 #dbeafe;
    padding: 20px;
  `,
    subtitle: 'color: #3b82f6; font-size: 16px; font-style: italic;',
    highlight: 'color: #1d4ed8; font-weight: bold;',
    code: 'color: #60a5fa; background: #1e3a8a; padding: 2px 5px; border-radius: 3px;',
    warning: 'color: #f59e0b; font-weight: bold;',
  };

  console.clear();

  // Improved ASCII art logo with more distinct COREY
  console.log(`
█▀▀ █▀█ █▀█ █▀▀ █▄█   █░░ ▄▀█ █░█░█ █▀█ █▀▀ █▄░█ █▀▀ █▀▀
█▄▄ █▄█ █▀▄ ██▄ ░█░   █▄▄ █▀█ ▀▄▀▄▀ █▀▄ ██▄ █░▀█ █▄▄ ██▄
`);

  // Main greeting
  console.log(
    '%cWelcome to the Matrix of Marketing & Code! 🚀',
    consoleStyles.title
  );

  // Clever subtitle
  console.log(
    '%cWhere algorithms meet aesthetics and functions tell stories...',
    consoleStyles.subtitle
  );

  // Interactive element
  console.log(
    "\n%c👾 Hey there, curious developer!%c\nSince you've ventured into the console, you must be someone who appreciates the details. Let's have some fun!\n",
    consoleStyles.highlight,
    ''
  );

  // Create an interactive game/puzzle
  const secretCode = ['marketing', 'code', 'human'];
  console.log(
    '%cTry this:%c Type %crevealTalents()%c to unlock some hidden expertise...',
    consoleStyles.warning,
    '',
    consoleStyles.code,
    ''
  );

  // Define the interactive function
  window.revealTalents = () => {
    console.clear();
    console.log('%c🎯 Skills Unlocked!', consoleStyles.title);

    const skills = [
      { category: '🎨 Marketing Magic', level: '████████░░', years: 8 },
      { category: '💻 Code Crafting', level: '███████░░░', years: 3 },
      {
        category: '🤖 AI Architecture',
        level: '████████░░',
        expertise: 'Advanced',
      },
      {
        category: '🧠 Human-Centered Design',
        level: '█████████░',
        projects: 50,
      },
    ];

    console.table(skills);

    console.log(
      `
%cBut wait, there's more! 🎁
Looking for a developer who can bridge the gap between marketing and technology?
Let's connect and build something amazing together!

%c📧 cmlawrence445@gmail.com
%c💼 https://linkedin.com/in/corey-lawrence-85621386
%c⚡ Fun fact: Did you know that the first "bug" in computing was an actual bug? 
   In 1947, Grace Hopper found a moth causing issues in the Harvard Mark II computer. 
  `,
      consoleStyles.highlight,
      consoleStyles.code,
      consoleStyles.code,
      consoleStyles.subtitle
    );

    return "🚀 Thanks for exploring! Let's create something extraordinary together!";
  };
});
