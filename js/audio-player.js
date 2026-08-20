/**
 * MARVIS PORTFOLIO - AUDIO ENGINE & FLIP MORPH PLAYER
 */

class AudioPlayerEngine {
  constructor() {
    this.audio = new Audio();
    this.isPlaying = false;
    this.currentTrackData = null;
    this.activeCard = null;

    // Background Music (BGM.wav)
    this.bgmAudio = document.getElementById('bgm-audio') || new Audio('assets/audio/BGM.wav');
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.5;
    this.bgmFadeTimer = null;
    this.isBGMMutedByUser = false;

    // DOM Elements
    this.gridContainer = document.getElementById('portfolio-grid-view');
    this.playerOverlay = document.getElementById('player-overlay-view');
    this.backBtn = document.getElementById('player-back-btn');
    this.trackCards = document.querySelectorAll('.track-card');

    // Player Details
    this.coverTarget = document.getElementById('player-cover-target');
    this.expandedCover = document.getElementById('expanded-cover-card');
    this.songDesc = document.getElementById('player-song-desc');
    this.trackNum = document.getElementById('player-track-num');
    this.trackName = document.getElementById('player-track-name');
    this.trackTime = document.getElementById('player-track-time');

    // Controls & Scrubber
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.svgPlay = document.getElementById('svg-play-icon');
    this.svgPause = document.getElementById('svg-pause-icon');
    this.timelineContainer = document.getElementById('timeline-container');
    this.timelineProgress = document.getElementById('timeline-progress');
    this.timelineScrubber = document.getElementById('timeline-scrubber');

    this.init();
    this.initBGM();
  }

  init() {
    // Bind Card Click Events
    this.trackCards.forEach((card) => {
      card.addEventListener('click', () => this.openTrackPlayer(card));
    });

    // Back Button Click Event
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => this.closeTrackPlayer());
    }

    // Play/Pause Click
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    }

    // Audio Event Listeners
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.onTrackEnded());

    // Timeline Scrubber Seek
    if (this.timelineContainer) {
      this.timelineContainer.addEventListener('click', (e) => this.seek(e));
    }
  }

  initBGM() {
    if (!this.bgmAudio) return;

    // Fallback to BGM.mp3 if BGM.wav is not found
    this.bgmAudio.addEventListener('error', () => {
      if (this.bgmAudio.src && this.bgmAudio.src.endsWith('.wav')) {
        this.bgmAudio.src = 'assets/audio/BGM.mp3';
        if (!this.isBGMMutedByUser) this.bgmAudio.play().catch(() => { });
      }
    });

    const startAudio = () => {
      if (!this.bgmAudio || this.isPlaying || this.isBGMMutedByUser) return;
      this.bgmAudio.volume = 0.5;

      const p = this.bgmAudio.play();
      if (p !== undefined) {
        p.then(() => {
          if (!this.isBGMMutedByUser) this.bgmAudio.muted = false;
        }).catch(() => {
          // If unmuted is blocked by browser policy, play muted instantly then unmute
          this.bgmAudio.muted = true;
          this.bgmAudio.play().then(() => {
            const unmuteOnInteraction = () => {
              if (this.bgmAudio && !this.isBGMMutedByUser) {
                this.bgmAudio.muted = false;
                this.bgmAudio.volume = 0.5;
              }
            };
            ['pointerdown', 'click', 'keydown', 'scroll', 'touchstart', 'mousemove', 'wheel'].forEach(e => {
              window.addEventListener(e, unmuteOnInteraction, { once: true, passive: true });
            });
          }).catch(() => { });
        });
      }
    };

    // Trigger on script load & page load
    startAudio();
    document.addEventListener('DOMContentLoaded', startAudio);
    window.addEventListener('load', startAudio);

    // Immediate unmute triggers on any user gesture
    ['pointerdown', 'click', 'keydown', 'scroll', 'touchstart', 'mousemove', 'wheel'].forEach(evt => {
      window.addEventListener(evt, () => {
        if (this.bgmAudio && !this.isBGMMutedByUser) {
          this.bgmAudio.muted = false;
          this.bgmAudio.volume = 0.5;
          if (this.bgmAudio.paused && !this.isPlaying) {
            this.bgmAudio.play().catch(() => { });
          }
        }
      }, { passive: true });
    });
  }

  fadeBGMOut() {
    if (!this.bgmAudio) return;
    if (this.bgmFadeTimer) clearInterval(this.bgmFadeTimer);

    this.bgmFadeTimer = setInterval(() => {
      if (this.bgmAudio.volume > 0.06) {
        this.bgmAudio.volume = Math.max(0, this.bgmAudio.volume - 0.08);
      } else {
        this.bgmAudio.volume = 0;
        this.bgmAudio.pause();
        clearInterval(this.bgmFadeTimer);
      }
    }, 25);
  }

  fadeBGMIn() {
    if (!this.bgmAudio || this.isBGMMutedByUser) return;
    if (this.bgmFadeTimer) clearInterval(this.bgmFadeTimer);

    if (this.bgmAudio.paused && !this.isPlaying) {
      this.bgmAudio.play().catch(() => { });
    }

    this.bgmFadeTimer = setInterval(() => {
      if (this.bgmAudio.volume < 0.45) {
        this.bgmAudio.volume = Math.min(0.5, this.bgmAudio.volume + 0.05);
      } else {
        this.bgmAudio.volume = 0.5;
        clearInterval(this.bgmFadeTimer);
      }
    }, 35);
  }

  openTrackPlayer(card) {
    this.activeCard = card;
    const inner = card.querySelector('.card-inner');

    // Extract metadata
    const title = card.getAttribute('data-title');
    const name = card.getAttribute('data-name');
    const duration = card.getAttribute('data-duration');
    const audioSrc = card.getAttribute('data-audio');
    const desc = card.getAttribute('data-desc');

    this.currentTrackData = { title, name, duration, audioSrc, desc };

    // Update DOM details
    this.trackNum.innerText = title;
    this.trackName.innerText = name;
    this.trackTime.innerText = '00:00:00';
    this.songDesc.innerHTML = desc;

    // Dim background brightness to 25%
    const horseBg = document.getElementById('horse-bg-img');
    if (horseBg) horseBg.classList.add('dimmed');

    // Fade out BGM immediately when opening and playing demo track
    this.fadeBGMOut();

    // Load & Play Demo Audio
    this.audio.src = audioSrc;
    this.playAudio();

    // GSAP FLIP Morphing Transition
    if (window.gsap && window.Flip) {
      const state = Flip.getState(inner);

      // Reparent or position
      this.playerOverlay.classList.add('active');
      this.coverTarget.appendChild(inner);

      Flip.from(state, {
        duration: 0.6,
        ease: 'power3.inOut',
        scale: true,
        onComplete: () => {
          this.gridContainer.style.opacity = '0';
          this.gridContainer.style.visibility = 'hidden';
        }
      });
    } else {
      // Fallback transition
      this.playerOverlay.classList.add('active');
      this.gridContainer.style.opacity = '0';
      this.gridContainer.style.visibility = 'hidden';
      this.coverTarget.appendChild(inner);
    }
  }

  closeTrackPlayer() {
    if (!this.activeCard) return;

    const inner = this.coverTarget.querySelector('.card-inner');
    this.pauseAudio();

    // Fade BGM back in to 50% volume
    this.fadeBGMIn();

    // Restore background brightness to 100%
    const horseBg = document.getElementById('horse-bg-img');
    if (horseBg) horseBg.classList.remove('dimmed');

    this.gridContainer.style.visibility = 'visible';
    this.gridContainer.style.opacity = '1';

    if (window.gsap && window.Flip && inner) {
      const state = Flip.getState(inner);
      this.activeCard.appendChild(inner);

      Flip.from(state, {
        duration: 0.5,
        ease: 'power3.inOut',
        scale: true,
        onComplete: () => {
          this.playerOverlay.classList.remove('active');
          this.activeCard = null;
        }
      });
    } else {
      if (inner) this.activeCard.appendChild(inner);
      this.playerOverlay.classList.remove('active');
      this.activeCard = null;
    }
  }

  playAudio() {
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.svgPlay.style.display = 'none';
      this.svgPause.style.display = 'block';
    }).catch(err => {
      console.log('Audio autoplay prevented or file loading:', err);
    });
  }

  pauseAudio() {
    this.audio.pause();
    this.isPlaying = false;
    this.svgPlay.style.display = 'block';
    this.svgPause.style.display = 'none';
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  updateProgress() {
    if (!this.audio.duration) return;
    const cur = this.audio.currentTime;
    const dur = this.audio.duration;
    const pct = (cur / dur) * 100;

    this.timelineProgress.style.width = `${pct}%`;
    this.timelineScrubber.style.left = `${pct}%`;

    // Format min:sec:ms
    const mins = Math.floor(cur / 60);
    const secs = Math.floor(cur % 60);
    const ms = Math.floor((cur % 1) * 100);

    const pad = (n) => (n < 10 ? '0' + n : n);
    this.trackTime.innerText = `${pad(mins)}:${pad(secs)}:${pad(ms)}`;
  }

  seek(e) {
    if (!this.audio.duration) return;
    const rect = this.timelineContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const pct = Math.max(0, Math.min(1, clickX / width));

    this.audio.currentTime = pct * this.audio.duration;
    this.updateProgress();
  }

  onTrackEnded() {
    this.pauseAudio();
    this.timelineProgress.style.width = '0%';
    this.timelineScrubber.style.left = '0%';
    this.fadeBGMIn();
  }

  initVolumeControls() {
    // BGM Mute/Unmute Toggle Button
    const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    const iconSound = document.getElementById('bgm-icon-sound');
    const iconMute = document.getElementById('bgm-icon-mute');
    const bgmBtnLabel = document.getElementById('bgm-btn-label');

    if (bgmToggleBtn) {
      bgmToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.bgmAudio) return;

        this.isBGMMutedByUser = !this.isBGMMutedByUser;
        this.bgmAudio.muted = this.isBGMMutedByUser;

        if (this.isBGMMutedByUser) {
          this.bgmAudio.volume = 0;
          if (iconSound) iconSound.style.display = 'none';
          if (iconMute) iconMute.style.display = 'block';
          if (bgmBtnLabel) bgmBtnLabel.innerText = 'BGM OFF';
        } else {
          this.bgmAudio.volume = 0.5;
          if (iconSound) iconSound.style.display = 'block';
          if (iconMute) iconMute.style.display = 'none';
          if (bgmBtnLabel) bgmBtnLabel.innerText = 'BGM ON';
          if (this.bgmAudio.paused && !this.isPlaying) {
            this.bgmAudio.play().catch(() => {});
          }
        }
      });
    }

    // Demo Track Small Volume Control Slider (75% smaller than progress bar)
    const volumeContainer = document.getElementById('player-volume-container');
    const volumeBarWrap = document.getElementById('volume-bar-wrap');
    const volumeProgress = document.getElementById('volume-progress');
    const volumeScrubber = document.getElementById('volume-scrubber');

    let isDraggingVolume = false;

    const updateVolumeFromEvent = (e) => {
      const targetWrap = volumeBarWrap || volumeContainer;
      if (!targetWrap) return;
      const rect = targetWrap.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clickX = clientX - rect.left;
      const width = rect.width;
      const pct = Math.max(0, Math.min(1, clickX / width));

      if (this.audio) {
        this.audio.volume = pct;
      }
      if (volumeProgress) volumeProgress.style.width = `${pct * 100}%`;
      if (volumeScrubber) volumeScrubber.style.left = `${pct * 100}%`;
    };

    if (volumeContainer) {
      volumeContainer.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        updateVolumeFromEvent(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
          updateVolumeFromEvent(e);
        }
      });

      window.addEventListener('mouseup', () => {
        isDraggingVolume = false;
      });

      volumeContainer.addEventListener('touchstart', (e) => {
        isDraggingVolume = true;
        if (e.touches && e.touches[0]) updateVolumeFromEvent(e.touches[0]);
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (isDraggingVolume && e.touches && e.touches[0]) {
          updateVolumeFromEvent(e.touches[0]);
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDraggingVolume = false;
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.gsap && window.Flip) {
    gsap.registerPlugin(Flip);
  }
  window.audioEngine = new AudioPlayerEngine();
  window.audioEngine.initVolumeControls();
});
