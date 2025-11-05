document.addEventListener('DOMContentLoaded', function () {
  const pillOptions = document.querySelectorAll('.pill-option');
  const article = document.querySelector('article.content');
  const quickRead = document.getElementById('quick-read');
  const postIntro = document.getElementById('post-intro');
  const blogContent = document.querySelector('.blog-content');
  const multimedia = document.getElementById('multimedia');
  const multimediaItems = document.querySelectorAll('.multimedia-item');
  const multimediaPlayer = document.getElementById('multimedia-player');
  const customAudioPlayer = document.getElementById('custom-audio-player');
  let audio = null;

  // Audio player controls
  const playPauseBtn = document.getElementById('play-pause');
  const skipBackwardBtn = document.getElementById('skip-backward');
  const skipForwardBtn = document.getElementById('skip-forward');
  const progressSlider = document.querySelector('.progress-slider');
  const timeElapsed = document.querySelector('.time-elapsed');
  const timeRemaining = document.querySelector('.time-remaining');

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateProgress() {
    if (!audio) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    progressSlider.value = progress;
    timeElapsed.textContent = formatTime(audio.currentTime);
    timeRemaining.textContent = formatTime(audio.duration - audio.currentTime);
  }

  function setupAudioPlayer() {
    // Play/Pause
    playPauseBtn.addEventListener('click', () => {
      if (!audio) return;
      if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    });

    // Skip backward 15 seconds
    skipBackwardBtn.addEventListener('click', () => {
      if (!audio) return;
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });

    // Skip forward 15 seconds
    skipForwardBtn.addEventListener('click', () => {
      if (!audio) return;
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 15);
    });

    // Progress slider
    progressSlider.addEventListener('input', () => {
      if (!audio) return;
      const time = (progressSlider.value / 100) * audio.duration;
      audio.currentTime = time;
    });
  }

  // Set up audio player controls
  setupAudioPlayer();

  function showInDepth() {
    // show in-depth sections
    quickRead && quickRead.classList.add('hidden');
    quickRead && quickRead.setAttribute('aria-hidden', 'true');

    postIntro && postIntro.classList.remove('hidden');
    postIntro && postIntro.setAttribute('aria-hidden', 'false');

    blogContent && blogContent.classList.remove('hidden');
    blogContent && blogContent.setAttribute('aria-hidden', 'false');

    // Hide multimedia view (cleanup any active media)
    if (multimedia) {
      multimedia.classList.add('hidden');
      multimedia.setAttribute('aria-hidden', 'true');
    }

    // Pause and reset audio if present
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeEventListener('timeupdate', updateProgress);
      } catch (e) {
        // ignore if audio element already removed
      }
      audio = null;
    }

    // Pause any active video and clear the multimedia player
    const activeVideo = document.getElementById('active-video');
    if (activeVideo) {
      try {
        activeVideo.pause();
      } catch (e) {}
    }

    if (multimediaPlayer) {
      multimediaPlayer.innerHTML = '';
    }

    if (customAudioPlayer) {
      customAudioPlayer.classList.add('hidden');
    }
  }

  function showQuickRead() {
    quickRead && quickRead.classList.remove('hidden');
    quickRead && quickRead.setAttribute('aria-hidden', 'false');

    postIntro && postIntro.classList.add('hidden');
    postIntro && postIntro.setAttribute('aria-hidden', 'true');

    blogContent && blogContent.classList.add('hidden');
    blogContent && blogContent.setAttribute('aria-hidden', 'true');

    // Hide multimedia view (cleanup any active media)
    if (multimedia) {
      multimedia.classList.add('hidden');
      multimedia.setAttribute('aria-hidden', 'true');
    }

    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeEventListener('timeupdate', updateProgress);
      } catch (e) {}
      audio = null;
    }

    const activeVideo = document.getElementById('active-video');
    if (activeVideo) {
      try {
        activeVideo.pause();
      } catch (e) {}
    }

    if (multimediaPlayer) {
      multimediaPlayer.innerHTML = '';
    }

    if (customAudioPlayer) {
      customAudioPlayer.classList.add('hidden');
    }
  }

  // track currently selected media so we can avoid unnecessary scrolling
  let currentMedia = null;

  function switchMedia(mediaType, shouldScroll = true) {
    // Update active state in list
    multimediaItems.forEach((item) => item.classList.remove('active'));
    document
      .querySelector(`.multimedia-item[data-media="${mediaType}"]`)
      ?.classList.add('active');

    // Reset play button state
    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    let multimediaContainer = document.querySelector('.multimedia-container');
    // Smooth scroll to player only when requested and when selecting a new media
    if (shouldScroll && multimediaContainer && mediaType !== currentMedia) {
      setTimeout(() => {
        multimediaContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }

    // Update player
    if (mediaType === 'video') {
      customAudioPlayer.classList.add('hidden');
      multimediaPlayer.innerHTML =
        '<video id="active-video" controls preload="metadata" playsinline><source src="./Context-Aware_Prototyping_web.mp4" type="video/mp4" />Your browser does not support the video tag.</video>';
    } else if (mediaType === 'podcast') {
      multimediaPlayer.innerHTML =
        '<audio id="active-audio" preload="metadata"><source src="./Context-Aware_Prototyping.mp3" type="audio/mpeg" />Your browser does not support the audio element.</audio>';
      customAudioPlayer.classList.remove('hidden');

      // Setup new audio element
      audio = document.getElementById('active-audio');
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', () => {
        timeRemaining.textContent = formatTime(audio.duration);
        progressSlider.value = 0;
      });
      audio.addEventListener('ended', () => {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      });
    }

    // remember which media is currently active
    currentMedia = mediaType;
  }

  pillOptions.forEach((btn) => {
    btn.addEventListener('click', function () {
      pillOptions.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const mode =
        btn.getAttribute('data-mode') || btn.textContent.trim().toLowerCase();
      if (mode === 'quick') showQuickRead();
      else if (mode === 'in-depth') showInDepth();
      else if (mode === 'multimedia') {
        // show multimedia view
        quickRead && quickRead.classList.add('hidden');
        quickRead && quickRead.setAttribute('aria-hidden', 'true');

        postIntro && postIntro.classList.add('hidden');
        postIntro && postIntro.setAttribute('aria-hidden', 'true');

        blogContent && blogContent.classList.add('hidden');
        blogContent && blogContent.setAttribute('aria-hidden', 'true');

        multimedia && multimedia.classList.remove('hidden');
        multimedia && multimedia.setAttribute('aria-hidden', 'false');

        // Ensure default media (video) is shown when opening multimedia
        // Use switchMedia to set up player and active state
        try {
          // open multimedia without scrolling because user just opened the tab
          switchMedia('video', false);
        } catch (e) {
          // fail silently if switchMedia isn't available yet
        }
      }
    });
  });

  // Handle multimedia item clicks
  multimediaItems.forEach((item) => {
    item.addEventListener('click', function () {
      const mediaType = this.getAttribute('data-media');
      // when user actively selects a media item, allow scrolling
      switchMedia(mediaType, true);
    });
  });

  // stable initial state
  showInDepth();
});
