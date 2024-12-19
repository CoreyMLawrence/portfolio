let isScrolling = false;

// Define scrollToSection function
function scrollToSection(targetId, customOffset) {
  if (isScrolling) return; // Prevent multiple scrolls
  isScrolling = true;

  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    const elementPosition =
      targetElement.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition + customOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth', // or 'auto' depending on your needs
    });

    setTimeout(() => {
      isScrolling = false; // Allow scrolling again after animation
    }, 1000); // Adjust timeout based on animation duration
  }
}

document.addEventListener('DOMContentLoaded', function () {
  gsap.from('#expertise-title', {
    scrollTrigger: {
      trigger: '#expertise-title',
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

  // Simple slide up for the title
  gsap.from('#languages-title', {
    scrollTrigger: {
      trigger: '#languages-title',
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    duration: 1,
    y: 30,
    opacity: 0,
    ease: 'power2.out',
  });

  let stagger = 0.03;
  if (window.innerWidth < 768) {
    stagger = 0.1;
  }

  // Elastic entrance for all language items together
  gsap.from('.language-item', {
    scrollTrigger: {
      trigger: '.languages-container',
      start: 'top 75%',
      toggleActions: 'play none none reverse',
    },
    duration: 2,
    y: 200,
    opacity: 0,
    ease: 'elastic.out(1, 1.9)', // Smooth elastic bounce
    stagger: stagger, // slightly staggered
  });

  // Animation for #threeD-title
  gsap.from('#threeD-title', {
    scrollTrigger: {
      trigger: '#threeD-title',
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    duration: 1.5,
    y: 50,
    z: -200,
    rotationX: 45,
    rotationY: 45,
    opacity: 0,
    ease: 'power3.out',
  });

  // Animation for #threeD-title-mobile
  gsap.from('#threeD-title-mobile', {
    scrollTrigger: {
      trigger: '#threeD-title-mobile',
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    duration: 1.5,
    y: 50,
    z: -200,
    rotationX: 45,
    rotationY: 45,
    opacity: 0,
    ease: 'power3.out',
  });

  //
  //
  //
  //
  //
  let fullStory = document.querySelector('.full-story');
  let closeButton = document.querySelector('.close-button');
  let body = document.querySelector('body');
  let isFullStoryOpen = false;

  function toggleStory() {
    if (!isFullStoryOpen) {
      openFullStory();
    } else {
      closeFullStory(false);
    }
  }

  function openFullStory() {
    fullStory.style.display = 'flex';
    closeButton.style.display = 'flex';
    body.style.overflowY = 'hidden'; // Disable body scroll
    if (!history.state || !history.state.fullStoryOpen) {
      history.pushState({ fullStoryOpen: true }, ''); // Only push history once
    }
    isFullStoryOpen = true;
  }

  function closeFullStory(updateHistory = true) {
    if (isFullStoryOpen) {
      fullStory.style.display = 'none';
      closeButton.style.display = 'none';
      body.style.overflowY = 'auto'; // Re-enable body scroll
      isFullStoryOpen = false;

      if (updateHistory) {
        history.back(); // Only go back if updateHistory is true
      }
    }
  }

  // Listen for the popstate event to close the full story
  window.addEventListener('popstate', function (event) {
    if (isFullStoryOpen && (!event.state || !event.state.fullStoryOpen)) {
      closeFullStory(false); // Close without triggering history.back()
    }
  });

  document
    .querySelector('.read-more-button')
    .addEventListener('click', toggleStory);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isFullStoryOpen) {
      closeFullStory();
    }
  });

  fullStory.addEventListener('click', function (event) {
    if (event.target === fullStory) {
      closeFullStory();
    }
  });

  closeButton.addEventListener('click', closeFullStory);

  // Swipe detection
  let startX = 0;
  let startY = 0;
  let isSwiping = false;
  const threshold = 70;

  fullStory.addEventListener('touchstart', function (event) {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = false;
  });

  fullStory.addEventListener('touchmove', function (event) {
    const touch = event.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = true;
      event.preventDefault();
    }
  });

  fullStory.addEventListener('touchend', function (event) {
    if (isSwiping) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;

      if (Math.abs(deltaX) > threshold) {
        closeFullStory();
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
          customOffset = window.innerWidth > 900 ? -30 : -20; // Offset for Projects
          break;
        case '#about':
          customOffset = window.innerWidth > 900 ? 90 : -80; // Offset for About
          break;
        case '#expertise':
          customOffset = window.innerWidth > 900 ? 10 : 50; // Offset for Specialties
          break;
      }

      scrollToSection(targetId, customOffset);

      // Re-enable touch interaction after 500ms
      setTimeout(() => {
        document.body.classList.remove('no-pointer');
      }, 500);
    });
  });

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
