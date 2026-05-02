(function () {
  const slides = Array.from(document.querySelectorAll('.aethon-slide'));
  if (!slides.length) return;

  let index = 0;
  slides.forEach((slide, i) => {
    if (i === 0) {
      slide.classList.add('is-active');
      slide.classList.remove('is-next', 'is-prev');
    } else {
      slide.classList.remove('is-active', 'is-prev');
      slide.classList.add('is-next');
    }
  });

  function advance() {
    const current = slides[index];
    const nextIndex = (index + 1) % slides.length;
    const next = slides[nextIndex];

    current.classList.remove('is-active');
    current.classList.add('is-prev');
    current.classList.remove('is-next');

    next.classList.remove('is-next', 'is-prev');
    next.classList.add('is-active');

    slides.forEach((slide, i) => {
      if (i !== nextIndex && i !== index) {
        slide.classList.remove('is-active', 'is-prev');
        slide.classList.add('is-next');
      }
    });

    index = nextIndex;
  }

  setInterval(advance, 5000);
})();
