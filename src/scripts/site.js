// src/scripts/site.js
// オリジナルのロジックをAstroのSPA環境向けに調整して移植

document.addEventListener('astro:page-load', () => {
  
  // ---------------------------------------------------------
  // 1. 次回活動日（第2日曜日）の算出ロジック
  // ---------------------------------------------------------
  function findSecondSunday(year, month) {
    let count = 0;
    // 1日から31日まで回して第2日曜日を探す
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month, day);
      if (date.getMonth() !== month) break;
      if (date.getDay() === 0) { // 0 = Sunday
        count++;
        if (count === 2) return day;
      }
    }
    return null;
  }

  function getNextSecondSunday(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const secondSundayDay = findSecondSunday(year, month);
    // 活動時間は10:30
    const secondSunday = new Date(year, month, secondSundayDay, 10, 30, 0, 0);

    // 今日がまだ活動日前なら、その日が次回
    if (currentDate < secondSunday) {
      return secondSunday;
    }

    // 過ぎていれば翌月の第2日曜日
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    const nextSecondSundayDay = findSecondSunday(nextYear, nextMonth);
    return new Date(nextYear, nextMonth, nextSecondSundayDay, 10, 30, 0, 0);
  }

  function formatDate(date) {
    const months = ["1","2","3","4","5","6","7","8","9","10","11","12"];
    const days = ["日","月","火","水","木","金","土"];
    return `${months[date.getMonth()]}月${date.getDate()}日（${days[date.getDay()]}）`;
  }

  function updateNextDate() {
    const targets = document.querySelectorAll("[data-next-date]");
    if (!targets.length) return;
    
    const nextDate = getNextSecondSunday(new Date());
    const formatted = formatDate(nextDate);
    
    targets.forEach((target) => {
      target.textContent = formatted;
    });
  }

  // ---------------------------------------------------------
  // 2. ステータス管理（中止バナー表示）ロジック
  // ---------------------------------------------------------
  function formatUpdatedAt(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${d} ${hh}:${mm}`;
  }

  async function loadStatusBanner() {
    // 既存のバナーがあれば削除（ページ遷移時の重複防止）
    const existingBanner = document.querySelector('.ui-banner');
    if (existingBanner) existingBanner.remove();

    try {
      // キャッシュ無効で最新のステータスを取得
      const response = await fetch("/status.json", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      
      // キャンセルでなければ何もしない
      if (!data || data.cancelled !== true) return;

      const message = typeof data.message === "string" ? data.message.trim() : "";
      
      // バナー要素の生成
      const banner = document.createElement("div");
      banner.className = "ui-banner"; // CSSでスタイル定義が必要

      const inner = document.createElement("div");
      inner.className = "max-w-5xl mx-auto px-6 py-4 text-sm sm:text-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2";

      const content = document.createElement("div");

      const headline = document.createElement("strong");
      headline.className = "text-white font-bold text-lg mr-2";
      headline.textContent = "【重要】今回の活動は中止です";
      content.appendChild(headline);

      if (message) {
        const detail = document.createElement("span");
        detail.className = "text-white opacity-90";
        detail.textContent = message;
        content.appendChild(detail);
      }
      inner.appendChild(content);

      // 次回予定の表示エリア
      const nextLine = document.createElement("div");
      nextLine.className = "text-white bg-white/20 px-3 py-1 rounded-lg text-sm whitespace-nowrap mt-2 sm:mt-0";

      const nextLabel = document.createElement("span");
      nextLabel.textContent = "次回: ";
      nextLine.appendChild(nextLabel);

      const nextDateSpan = document.createElement("span");
      nextDateSpan.setAttribute("data-next-date", ""); // ここもupdateNextDateで更新される
      nextLine.appendChild(nextDateSpan);

      const nextTime = document.createElement("span");
      nextTime.textContent = " 10:30～";
      nextLine.appendChild(nextTime);

      inner.appendChild(nextLine);

      // 更新日時
      const updatedAt = formatUpdatedAt(data.updated);
      /* デザインをシンプルにするため、更新日時はコンソールログまたは非表示でも良いが、
         元の機能維持のためデータとしては保持
      */

      banner.appendChild(inner);
      
      // bodyの先頭（ヘッダーの上）に挿入
      document.body.prepend(banner);
      
      // バナー内の日付も更新
      updateNextDate();
      
    } catch (error) {
      console.error("Status check failed:", error);
    }
  }

  // 実行
  updateNextDate();
  loadStatusBanner();
});