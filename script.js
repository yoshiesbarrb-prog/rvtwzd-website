function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isSafeRelativeImagePath(path) {
  return typeof path === 'string'
    && path.startsWith('assets/Carousel/')
    && !path.includes('..')
    && /\.(jpe?g|png|webp|gif)$/i.test(path);
}

function isSafeFamilyDownloadPath(path) {
  return typeof path === 'string'
    && path.startsWith('assets/Families/')
    && !path.includes('..')
    && /\.(rfa|rvt|zip)$/i.test(path);
}

function isSafeHttpUrl(url, allowedHosts) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && allowedHosts.includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function isSafeYouTubeId(videoId) {
  return typeof videoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

function formatFileMeta(video) {
  const details = [video.linkFileName, video.linkFileSize].filter(Boolean);
  return details.length ? details.join(' - ') : 'Revit family download';
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
    const response = await fetch('assets/carousel.json', { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error('Unable to load carousel manifest.');
    }

    slides = (await response.json()).filter((slide) => isSafeRelativeImagePath(slide.src));

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
  if (!isSafeYouTubeId(video.videoId) || !isSafeHttpUrl(video.youtubeUrl, ['youtu.be'])) {
    return '';
  }

  const sectionTheme = index % 2 === 0 ? 'feature--dark' : 'feature--light';
  const reverseClass = index % 2 === 1 ? ' feature__inner--reverse' : '';
  const headingId = `${video.slug}-title`;
  const hasSafeExtraLink = video.linkUrl
    && video.linkLabel
    && (isSafeFamilyDownloadPath(video.linkUrl) || isSafeHttpUrl(video.linkUrl, ['drive.google.com', 'youtu.be', 'www.youtube.com']));
  const isLocalDownload = hasSafeExtraLink && isSafeFamilyDownloadPath(video.linkUrl);
  const extraLink = hasSafeExtraLink && isLocalDownload
    ? `<div class="resource-download">
        <span>
          <span class="resource-download__label">${escapeHtml(video.linkLabel)}</span>
          <span class="resource-download__meta">${escapeHtml(formatFileMeta(video))}</span>
        </span>
        <a class="resource-download__button" href="${escapeHtml(video.linkUrl)}" download>Download</a>
      </div>`
    : '';
  const externalLink = hasSafeExtraLink && !isLocalDownload
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
          <div class="feature__actions">
            ${extraLink}
            ${externalLink}
          </div>
        </div>
      </div>
    </section>`;
}

async function loadVideos() {
  const videosContainer = document.querySelector('[data-videos]');

  if (!videosContainer) {
    return;
  }

  const response = await fetch('assets/videos.json', { cache: 'no-cache' });

  if (!response.ok) {
    throw new Error('Unable to load video manifest.');
  }

  const videos = (await response.json()).filter((video) => isSafeYouTubeId(video.videoId));
  videosContainer.innerHTML = videos.map(createVideoSection).join('');
  setupVideoEmbeds(videosContainer);
}

loadVideos().catch(() => {
  const videosContainer = document.querySelector('[data-videos]');

  if (videosContainer) {
    videosContainer.innerHTML = '<section class="feature feature--dark"><div class="feature__inner"><div class="feature__copy"><h2>Videos</h2><p>Add YouTube links to videos.txt and run scripts/update-videos.ps1.</p></div></div></section>';
  }
});

const contactStatus = document.querySelector('[data-contact-status]');

if (contactStatus && new URLSearchParams(window.location.search).get('sent') === '1') {
  contactStatus.hidden = false;
}