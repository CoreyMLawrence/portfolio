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

  // Fade in for the connect links
  gsap.from('.connect-links', {
    duration: 1,
    opacity: 0,
    delay: 0.9, // Starts after the CTA
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

  // CTA section initial staggered animations
  gsap.from('.cta-content h2', {
    duration: 1.2,
    y: 40,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.2,
  });

  gsap.from('.cta-content p', {
    duration: 1.2,
    y: 40,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.4,
  });

  gsap.from('.cta-button', {
    duration: 1.2,
    y: 40,
    opacity: 0,
    scale: 0.95,
    ease: 'elastic.out(1, 0.6)',
    delay: 0.6,
    transformOrigin: 'center center',
  });

  // CTA section scroll-triggered staggered animations
  gsap.from('.cta-section', {
    scrollTrigger: {
      trigger: '.cta-section',
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    duration: 1.5,
    y: 60,
    opacity: 0,
    ease: 'power3.out',
    stagger: {
      each: 0.15,
      from: 'start',
    },
  });

  let fullStory = document.querySelector('.full-story');
  let storyContent = document.querySelector('.story-content');
  let closeButton = document.querySelector('.close-button');
  let body = document.querySelector('body');

  function toggleStory() {
    const isVisible = fullStory.style.display === 'flex';

    if (!isVisible) {
      fullStory.style.display = 'flex';
      closeButton.style.display = 'flex';
      body.style.overflowY = 'hidden'; // Disable body scroll
    } else {
      closeFullStory();
    }
  }

  function closeFullStory() {
    fullStory.style.display = 'none';
    closeButton.style.display = 'none';
    body.style.overflowY = 'auto'; // Re-enable body scroll
  }

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
      // Only close if clicking outside the content
      closeFullStory();
    }
  });

  closeButton.addEventListener('click', closeFullStory);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent default anchor click behavior

      const targetId = this.getAttribute('href'); // Get the target section ID
      const targetSection = document.querySelector(targetId); // Select the target section

      // Scroll to the target section
      if (targetSection) {
        targetSection.scrollIntoView();

        // Clear the URL hash after a short delay
        history.pushState(
          '',
          document.title,
          window.location.pathname + window.location.search
        );
      } // Adjust the delay as needed
    });
  });
});
