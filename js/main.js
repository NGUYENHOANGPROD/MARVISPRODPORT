/**
 * MARVIS PORTFOLIO - MAIN ORCHESTRATION & CANVAS RENDERER
 */

document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP Plugins
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  initCustomCursor();
  initScrollReveal();
  initConcentricCirclesReveal();
  initSmoothScrollBtn();
  initProfileBioPanel();
});

/* ================= 1. CUSTOM TRAILING CURSOR ================= */
function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth lerp trailing loop
  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;

    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover states on interactive elements
  const hoverables = document.querySelectorAll('a, button, .track-card, .nav-indicator, .scroll-indicator, .panel-close-btn');
  hoverables.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });

  window.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  window.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
}

/* ================= 2. SCROLL REVEAL EASE-IN EFFECT ================= */
function initScrollReveal() {
  const sections = document.querySelectorAll('.section');
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-active');
      } else {
        entry.target.classList.remove('section-active');
      }
    });
  }, { threshold: 0.35 });

  sections.forEach((sec) => sectionObserver.observe(sec));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach((el) => observer.observe(el));
}

/* ================= 3. BIG CIRCLE TEXT SCRAMBLE OBSERVER ================= */
function initConcentricCirclesReveal() {
  const section = document.getElementById('section-career');
  if (!section) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const title = document.getElementById('career-title');
        if (window.TextScramble && title && !title.classList.contains('scrambled-done')) {
          title.classList.add('scrambled-done');
          const fx = new TextScramble(title);
          fx.setText('CAREER PATH');
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  observer.observe(section);
}

/* ================= 4. HERO SMOOTH SCROLL BUTTON ================= */
function initSmoothScrollBtn() {
  const btn = document.getElementById('hero-scroll-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const profileSection = document.getElementById('section-profile');
    if (profileSection) {
      profileSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ================= 5. PROFILE RIGHT-TO-LEFT GRADIENT BIO PANEL ================= */
function initProfileBioPanel() {
  const triggerBtn = document.getElementById('nav-info-trigger');
  const closeBtn = document.getElementById('panel-close-btn');
  const panel = document.getElementById('profile-info-panel');
  const titleContainer = document.querySelector('.profile-title-container');

  if (!panel) return;

  if (triggerBtn) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.add('active');
      if (titleContainer) titleContainer.classList.add('faded');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.remove('active');
      if (titleContainer) titleContainer.classList.remove('faded');
    });
  }
}
