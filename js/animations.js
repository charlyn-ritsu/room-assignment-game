const Animations = {
  showScreen(screenId, onComplete) {
    const screen = document.getElementById(screenId);
    screen.classList.add('active');
    gsap.fromTo(screen, { opacity: 0 }, {
      opacity: 1, duration: 0.5, ease: 'power2.inOut',
      onComplete: onComplete || (() => {}),
    });
  },

  hideScreen(screenId, onComplete) {
    const screen = document.getElementById(screenId);
    gsap.to(screen, {
      opacity: 0, duration: 0.4, ease: 'power2.inOut',
      onComplete: () => {
        screen.classList.remove('active');
        if (onComplete) onComplete();
      },
    });
  },

  _levelTitleCallback: null,

  showLevelTitle(title, subtitle, onComplete) {
    const el = document.getElementById('level-title');
    this._levelTitleCallback = onComplete;
    el.innerHTML = `<div class="lt-main">${title}</div><div class="lt-sub">${subtitle}</div>`;
    el.style.display = 'flex';
    gsap.fromTo(el, { opacity: 0, scale: 0.8 }, {
      opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)',
      onComplete: () => {
        gsap.to(el, {
          opacity: 0, scale: 1.1, duration: 0.4, delay: 1.2, ease: 'power2.in',
          onComplete: () => {
            el.style.display = 'none';
            this._levelTitleCallback = null;
            if (onComplete) onComplete();
          },
        });
      },
    });
  },

  skipLevelTitle() {
    const el = document.getElementById('level-title');
    const cb = this._levelTitleCallback;
    this._levelTitleCallback = null;
    gsap.killTweensOf(el);
    el.style.display = 'none';
    if (cb) cb();
  },

  showDialogue(onComplete) {
    const area = document.getElementById('dialogue-area');
    area.classList.remove('hidden');
    gsap.fromTo(area, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
      onComplete: onComplete,
    });
  },

  slideInRoster(onComplete) {
    const panel = document.getElementById('roster-panel');
    panel.classList.remove('hidden');
    const rooms = panel.querySelectorAll('.room-group');
    gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(rooms, { opacity: 0, x: 40 }, {
      opacity: 1, x: 0, duration: 0.4, stagger: 0.12, ease: 'power2.out',
      onComplete: onComplete,
    });
  },

  slideInPatients(onComplete) {
    const panel = document.getElementById('patient-panel');
    panel.classList.remove('hidden');
    const cards = panel.querySelectorAll('.patient-card');
    gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(cards, { opacity: 0, x: -40 }, {
      opacity: 1, x: 0, duration: 0.4, stagger: 0.15, ease: 'back.out(1.2)',
      onComplete: onComplete,
    });
  },

  popIn(element, onComplete) {
    gsap.fromTo(element, { scale: 0.3, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)',
      onComplete: onComplete,
    });
  },

  shake(element, onComplete) {
    gsap.to(element, {
      x: -6, duration: 0.06, ease: 'power2.inOut',
      onComplete: () => {
        gsap.to(element, {
          x: 6, duration: 0.06, yoyo: true, repeat: 3, ease: 'power2.inOut',
          onComplete: () => {
            gsap.to(element, { x: 0, duration: 0.06, onComplete: onComplete });
          },
        });
      },
    });
  },

  flashRed(element) {
    const orig = element.style.backgroundColor;
    gsap.to(element, {
      backgroundColor: '#ff4757', duration: 0.15,
      onComplete: () => {
        gsap.to(element, { backgroundColor: orig || '', duration: 0.3 });
      },
    });
  },

  celebratePlacement(element, onComplete) {
    gsap.fromTo(element, { scale: 1.15 }, {
      scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.4)',
      onComplete: onComplete,
    });
  },

  levelComplete(onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'level-complete-overlay';
    overlay.innerHTML = '<div class="lc-text">LEVEL COMPLETE!</div>';
    document.getElementById('game-screen').appendChild(overlay);

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(overlay.querySelector('.lc-text'),
      { scale: 0.5, opacity: 0 },
      {
        scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)', delay: 0.15,
        onComplete: () => {
          if (typeof confetti === 'function') {
            confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
          }
          gsap.to(overlay, {
            opacity: 0, duration: 0.4, delay: 1.8,
            onComplete: () => {
              overlay.remove();
              if (onComplete) onComplete();
            },
          });
        },
      }
    );
  },

  victoryScreen() {
    if (typeof confetti === 'function') {
      const end = Date.now() + 2500;
      const colors = ['#ff6b9d', '#4fc3f7', '#ffd700', '#2ecc71'];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  },

  resetGameArea() {
    const roster = document.getElementById('roster-panel');
    const patients = document.getElementById('patient-panel');
    roster.classList.add('hidden');
    patients.classList.add('hidden');
    roster.style.opacity = '';
    patients.style.opacity = '';
  },

  spriteJump(container) {
    const sprite = container.querySelector('.sprite-canvas');
    if (!sprite) return;
    gsap.to(sprite, {
      y: -10, duration: 0.15, ease: 'power2.out',
      onComplete: () => {
        gsap.to(sprite, { y: 0, duration: 0.2, ease: 'bounce.out' });
      },
    });
  },
};
