(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const windows = document.querySelectorAll("[data-ocean-window]");
  if (!windows.length) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function padNumber(value, digits) {
    return String(value).padStart(digits, "0");
  }

  function buildFrameUrl(base, index, digits, ext) {
    return `${base}${padNumber(index, digits)}.${ext}`;
  }

  function drawImageCover(ctx, image, width, height) {
    const canvasRatio = width / height;
    const imageRatio = image.width / image.height;
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * imageRatio;
      offsetX = (width - drawWidth) / 2;
    } else {
      drawWidth = width;
      drawHeight = width / imageRatio;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }

  windows.forEach((section) => {
    const canvas = section.querySelector(".ocean-window-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frameCount = Number(section.dataset.frameCount || 1);
    const framePath = section.dataset.framePath || "/assets/ocean-seq/frame_";
    const frameExt = section.dataset.frameExt || "avif";
    const frameDigits = Number(section.dataset.frameDigits || 4);

    const cache = new Map();
    let currentFrame = 1;
    let ticking = false;

    const ensureImage = (index) => {
      if (cache.has(index)) return cache.get(index);
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = buildFrameUrl(framePath, index, frameDigits, frameExt);
      cache.set(index, img);
      return img;
    };

    const preloadAround = (index) => {
      const range = 4;
      for (let i = index - range; i <= index + range; i++) {
        if (i < 1 || i > frameCount) continue;
        ensureImage(i);
      }
    };

    const renderFrame = (index) => {
      const clamped = clamp(index, 1, frameCount);
      currentFrame = clamped;
      const img = ensureImage(clamped);
      if (img.complete) {
        drawImageCover(ctx, img, canvas.width, canvas.height);
      } else {
        img.onload = () => drawImageCover(ctx, img, canvas.width, canvas.height);
      }
      preloadAround(clamped);
    };

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      if (cache.has(currentFrame)) {
        const img = cache.get(currentFrame);
        if (img.complete) {
          drawImageCover(ctx, img, canvas.width, canvas.height);
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const start = window.innerHeight;
        const end = -rect.height;
        const total = start - end;
        if (total <= 0) {
          ticking = false;
          return;
        }
        const progress = clamp((start - rect.top) / total, 0, 1);
        const frameIndex = Math.round(progress * (frameCount - 1)) + 1;
        if (frameIndex !== currentFrame) {
          renderFrame(frameIndex);
        }
        ticking = false;
      });
    };

    updateCanvasSize();
    renderFrame(1);

    if (prefersReducedMotion) {
      return;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateCanvasSize);
  });
})();
