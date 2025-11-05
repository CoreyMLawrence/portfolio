document.addEventListener('DOMContentLoaded', () => {
  // Create sticky control HTML and append to body
  const control = document.createElement('button');
  control.id = 'sticky-audio-control';
  control.className = 'hide';
  control.setAttribute('aria-label', 'Play long form audio');

  const inner = document.createElement('span');
  inner.className = 'inner-btn';
  inner.innerHTML = '<i class="fa-solid fa-play"></i>';
  control.appendChild(inner);

  document.body.appendChild(control);

  // Create audio element (but don't autoplay)
  const audio = document.createElement('audio');
  audio.id = 'long-audio';
  audio.preload = 'metadata';
  const source = document.createElement('source');
  source.src = './long-audio.mp3';
  source.type = 'audio/mpeg';
  audio.appendChild(source);
  // keep offscreen
  audio.style.display = 'none';
  document.body.appendChild(audio);

  let isVisible = false;

  function setProgress(percent) {
    // percent: 0-100
    control.style.setProperty(
      '--progress',
      Math.max(0, Math.min(100, percent))
    );
    // update background-image to reflect progress more precisely
    control.style.backgroundImage = `conic-gradient(from 0deg, #5cc0ff ${percent}%, rgba(255,255,255,0.12) ${percent}% )`;
  }

  function updateFromAudio() {
    if (!audio.duration || isNaN(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    setProgress(pct);
  }

  audio.addEventListener('timeupdate', updateFromAudio);
  audio.addEventListener('loadedmetadata', updateFromAudio);
  audio.addEventListener('ended', () => {
    inner.innerHTML = '<i class="fa-solid fa-play"></i>';
    setProgress(0);
  });

  // Distinguish clicks on inner button vs ring. Inner toggles play/pause. Ring seeks.
  function isInsideInnerBtn(clientX, clientY) {
    const rect = control.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // inner radius = (width/2) - padding (6px). Use a threshold to detect inner
    return dist <= rect.width / 2 - 10;
  }

  function handleToggle() {
    if (audio.paused) {
      audio.play();
      inner.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
      audio.pause();
      inner.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  }

  // Simplified click behavior: any click or touch toggles playback.
  control.addEventListener('click', (e) => {
    e.preventDefault();
    handleToggle();
  });

  // Support touch events on mobile for toggling
  control.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    handleToggle();
  });

  // Show control only when the long-form ("in-depth") mode is active.
  // Check the pill option active state and update visibility accordingly.
  function updateVisibility() {
    const inDepthActive = !!document.querySelector(
      '.pill-option.active[data-mode="in-depth"]'
    );
    if (inDepthActive) {
      if (!isVisible) {
        control.classList.remove('hide');
        control.setAttribute('aria-hidden', 'false');
        isVisible = true;
      }
    } else {
      if (isVisible) {
        control.classList.add('hide');
        control.setAttribute('aria-hidden', 'true');
        isVisible = false;
        // pause audio when hidden
        try {
          audio.pause();
          inner.innerHTML = '<i class="fa-solid fa-play"></i>';
        } catch (e) {}
        setProgress(0);
      }
    }
  }

  // Wire up clicks on the pill options to update visibility (toggle-content.js also handles the UI)
  const pillButtons = document.querySelectorAll('.pill-option');
  pillButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      // Delay slightly to allow toggle-content.js to flip the active class
      setTimeout(updateVisibility, 60);
    })
  );

  // Initial visibility check (page may start in in-depth)
  updateVisibility();
});
