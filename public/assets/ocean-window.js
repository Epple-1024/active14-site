/**
 * ACTIVE14 Ocean Window Script
 * Updated: 2026-01-25
 * 機能: 親ラッパー(.pinned-sequence-wrapper)のスクロール位置を検知し、
 * 画面固定中(sticky)に画像をコマ送り再生する。
 */

(function() {
  const container = document.querySelector('[data-ocean-window]');
  if (!container) return;

  const canvas = container.querySelector('.ocean-window-canvas');
  const context = canvas.getContext('2d');
  
  // 親ラッパーを探す（もし無ければ自分自身を使うフォールバック）
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
    // 基準にする要素（ラッパー）の位置を取得
    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // スクロール可能な総距離 = ラッパーの高さ - 画面の高さ
    // (CSSで height: 400vh としているので、たっぷりスクロールできる)
    const travelDistance = rect.height - viewportHeight;

    // 現在の進捗状況
    // ラッパーが画面上端に来た瞬間(top=0)から計算開始
    // rect.top はスクロールするとマイナスになるため、符号を反転させる
    const scrolled = -rect.top;

    let progress = scrolled / travelDistance;

    // 0.0 〜 1.0 に収める
    progress = Math.max(0, Math.min(1, progress));

    // 進捗率をフレーム番号に変換
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

  // 3. イベントリスナー
  window.addEventListener('scroll', () => requestAnimationFrame(updateFrame));
  window.addEventListener('resize', updateFrame);
  updateFrame();

})();