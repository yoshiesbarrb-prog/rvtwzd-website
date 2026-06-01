function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const carousel = document.querySelector('[data-carousel]');

if (carousel) {
  const image = carousel.querySelector('[data-carousel-image]');
  const caption = carousel.querySelector('[data-carousel-caption]');
  const dots = carousel.querySelector('[data-carousel-dots]');
  const previousButton = carousel.querySelector('[data-carousel-prev]');
  const nextButton = carousel.querySelector('[data-carousel-next]');
  let slides = [];
  let currentSlide = 0;
  let autoplayTimer;

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    const slide = slides[currentSlide];
    image.src = slide.src;
    image.alt = slide.alt;
    caption.textContent = slide.caption;
    dots.querySelectorAll('button').forEach((button, buttonIndex) => {
      button.setAttribute('aria-current', String(buttonIndex === currentSlide));
    });
  }

  function startAutoplay() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    stopAutoplay();
    autoplayTimer = window.setInterval(() => showSlide(currentSlide + 1), 6500);
  }

  function stopAutoplay() {
    window.clearInterval(autoplayTimer);
  }

  function buildDots() {
    dots.replaceChildren();

    slides.forEach((slide, index) => {
      const button = document.createElement('button');
      button.className = 'render-viewer__dot';
      button.type = 'button';
      button.setAttribute('aria-label', `Show render ${index + 1}: ${slide.caption}`);
      button.addEventListener('click', () => showSlide(index));
      dots.appendChild(button);
    });
  }

  async function loadSlides() {
    const response = await fetch('assets/carousel.json');

    if (!response.ok) {
      throw new Error('Unable to load carousel manifest.');
    }

    slides = await response.json();

    if (!slides.length) {
      throw new Error('Carousel manifest is empty.');
    }

    buildDots();
    showSlide(0);
    startAutoplay();
  }

  previousButton.addEventListener('click', () => showSlide(currentSlide - 1));
  nextButton.addEventListener('click', () => showSlide(currentSlide + 1));
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      showSlide(currentSlide - 1);
    }

    if (event.key === 'ArrowRight') {
      showSlide(currentSlide + 1);
    }
  });

  loadSlides().catch(() => {
    caption.textContent = 'Add images to assets/Carousel and run scripts/update-carousel.ps1';
  });
}

function setupVideoEmbeds(root = document) {
  root.querySelectorAll('[data-video-id]').forEach((embed) => {
    const button = embed.querySelector('.video-embed__poster');

    button.addEventListener('click', () => {
      const videoId = embed.dataset.videoId;
      const title = embed.dataset.videoTitle;
      const iframe = document.createElement('iframe');

      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';

      embed.replaceChildren(iframe);
    });
  });
}

function createVideoSection(video, index) {
  const sectionTheme = index % 2 === 0 ? 'feature--dark' : 'feature--light';
  const reverseClass = index % 2 === 1 ? ' feature__inner--reverse' : '';
  const headingId = `${video.slug}-title`;
  const extraLink = video.linkUrl && video.linkLabel
    ? `<a class="text-link" href="${escapeHtml(video.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(video.linkLabel)}</a>`
    : '';

  return `
    <section class="feature ${sectionTheme}" id="${escapeHtml(video.slug)}" aria-labelledby="${escapeHtml(headingId)}">
      <div class="feature__inner${reverseClass}">
        <div class="video-frame video-embed" data-video-id="${escapeHtml(video.videoId)}" data-video-title="${escapeHtml(video.title)}">
          <button class="video-embed__poster" type="button" aria-label="Play ${escapeHtml(video.title)}">
            <img src="https://i.ytimg.com/vi/${escapeHtml(video.videoId)}/hqdefault.jpg" alt="${escapeHtml(video.title)} video thumbnail" loading="lazy">
            <span class="video-embed__play" aria-hidden="true"></span>
          </button>
          <a class="video-embed__fallback" href="${escapeHtml(video.youtubeUrl)}" target="_blank" rel="noreferrer">Watch on YouTube</a>
        </div>
        <div class="feature__copy">
          <h2 id="${escapeHtml(headingId)}">${escapeHtml(video.title)}</h2>
          <p>${escapeHtml(video.description)}</p>
          ${extraLink}
        </div>
      </div>
    </section>`;
}

async function loadVideos() {
  const videosContainer = document.querySelector('[data-videos]');

  if (!videosContainer) {
    return;
  }

  const response = await fetch('assets/videos.json');

  if (!response.ok) {
    throw new Error('Unable to load video manifest.');
  }

  const videos = await response.json();
  videosContainer.innerHTML = videos.map(createVideoSection).join('');
  setupVideoEmbeds(videosContainer);
}

loadVideos().catch(() => {
  const videosContainer = document.querySelector('[data-videos]');

  if (videosContainer) {
    videosContainer.innerHTML = '<section class="feature feature--dark"><div class="feature__inner"><div class="feature__copy"><h2>Videos</h2><p>Add YouTube links to videos.txt and run scripts/update-videos.ps1.</p></div></div></section>';
  }
});