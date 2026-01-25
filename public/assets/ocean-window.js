/**
 * ACTIVE14 Ocean Window Script (SPA Support)
 * Updated: 2026-01-25
 * 機能: astro:page-load イベントに対応し、ページ遷移後も正しく初期化する。
 */

// グローバルスコープでスクロールハンドラを保持しておく（削除できるように）
let scrollHandler = null;

// Astroのページロードイベントを監視 (初期ロード + 遷移後)
document.addEventListener('astro:page-load', () => {
  
  const container = document.querySelector('[data-ocean-window]');
  
  // 海の窓がないページ（Aboutなど）なら何もしない
  if (!container) return;

  const canvas = container.querySelector('.ocean-window-canvas');
  const context = canvas.getContext('2d');
  
  // 親ラッパーを探す
  const wrapper = container.closest('.pinned-sequence-wrapper') || container;

  const frameCount = parseInt(container.dataset.frameCount, 10) || 90;
  const framePath = container.dataset.framePath;
  const frameExt = container.dataset.frameExt || "avif";
  const frameDigits = parseInt(container.dataset.frameDigits, 10) || 4;

  const images = [];
  let imagesLoaded = 0;

  // 1. 画像プリロード
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    const numStr = String(i).padStart(frameDigits, '0');
    img.src = `${framePath}${numStr}.${frameExt}`;
    
    img.onload = () => {
      imagesLoaded++;
      if (imagesLoaded === 1) requestAnimationFrame(updateFrame);
      if (imagesLoaded === frameCount) container.dataset.ready = "true";
    };
    images.push(img);
  }

  // 2. フレーム更新ロジック
  function updateFrame() {
    // ページ遷移で要素がなくなっていたら停止
    if (!document.contains(wrapper)) return;

    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const travelDistance = rect.height - viewportHeight;
    const scrolled = -rect.top;

    let progress = scrolled / travelDistance;
    progress = Math.max(0, Math.min(1, progress));

    const frameIndex = Math.min(
      frameCount - 1,
      Math.floor(progress * (frameCount - 1))
    );

    drawImage(frameIndex);
  }

  function drawImage(index) {
    const img = images[index];
    if (img && img.complete) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }

  // 3. イベントリスナー登録（とクリーンアップ準備）
  
  // 前回のハンドラがあれば削除（二重登録防止）
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    window.removeEventListener('resize', scrollHandler);
  }

  // 新しいハンドラを作成
  scrollHandler = () => requestAnimationFrame(updateFrame);
  
  window.addEventListener('scroll', scrollHandler);
  window.addEventListener('resize', scrollHandler);
  
  // 初期描画
  updateFrame();
});

// ページ遷移直前(before-swap)にイベントを削除してメモリリークを防ぐ
document.addEventListener('astro:before-swap', () => {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    window.removeEventListener('resize', scrollHandler);
    scrollHandler = null;
  }
});