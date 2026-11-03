// Shared fullscreen behaviour for static game hosts. Layout stays in each game.
export function bindFullscreen(view, button, onChange = () => {}) {
  let previousOverflow = '';
  const expanded = () => document.fullscreenElement === view || view.classList.contains('game-view-expanded');
  let previousExpanded = expanded();
  function update() {
    const active = expanded();
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    button.title = active ? 'Exit fullscreen' : 'Fullscreen';
    // The API promise and fullscreenchange can report the same transition.
    // Releasing input twice could discard a fresh key pressed between them.
    if (active !== previousExpanded) {
      previousExpanded = active;
      onChange(active);
    }
  }
  function closeFallback() {
    if (!view.classList.contains('game-view-expanded')) return;
    view.classList.remove('game-view-expanded');
    document.body.style.overflow = previousOverflow;
  }
  let touchHandledAt = -Infinity;
  async function toggle() {
    if (expanded()) {
      closeFallback();
      if (document.fullscreenElement === view) await document.exitFullscreen();
    } else {
      try {
        if (!view.requestFullscreen) throw Error('Fullscreen unavailable');
        await view.requestFullscreen();
      } catch {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        view.classList.add('game-view-expanded');
      }
    }
    update();
  }
  // Secondary touch contacts do not reliably synthesize a click. Pointer-up is
  // also a browser activation gesture, so native fullscreen remains available.
  button.addEventListener('pointerup', event => {
    if (event.pointerType !== 'touch' || event.button !== 0) return;
    const rect = button.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    touchHandledAt = performance.now();
    toggle();
  });
  button.addEventListener('click', event => {
    if (event.detail > 0 && performance.now() - touchHandledAt < 700) return;
    toggle();
  });
  document.addEventListener('fullscreenchange', update);
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape' && view.classList.contains('game-view-expanded')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeFallback();
      update();
    }
  }, {capture:true});
}

// Immediate game actions must work for a second finger while movement is held.
// Native keyboard activation still arrives as a click with detail zero.
export function bindGameAction(button, action) {
  let pointerHandledAt = -Infinity;
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    pointerHandledAt = performance.now();
    action();
  });
  button.addEventListener('click', event => {
    if (event.detail > 0 && performance.now() - pointerHandledAt < 700) return;
    action();
  });
}
