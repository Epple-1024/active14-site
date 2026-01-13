(() => {
  function findSecondSunday(year, month) {
    let count = 0;
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month, day);
      if (date.getMonth() !== month) break;
      if (date.getDay() === 0) {
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
    const secondSunday = new Date(year, month, secondSundayDay, 10, 30, 0, 0);

    if (currentDate < secondSunday) {
      return secondSunday;
    }

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
    const target = document.getElementById("nextDate");
    if (!target) return;
    const nextDate = getNextSecondSunday(new Date());
    target.textContent = formatDate(nextDate);
  }

  async function loadStatusBanner() {
    try {
      const response = await fetch("/status.json", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || data.cancelled !== true) return;

      const message = typeof data.message === "string" ? data.message.trim() : "";
      const banner = document.createElement("div");
      banner.className = "bg-amber-50 border-b border-amber-200 text-amber-900";

      const inner = document.createElement("div");
      inner.className = "max-w-5xl mx-auto px-6 py-3 text-sm sm:text-base";

      const strong = document.createElement("strong");
      strong.textContent = "本日の活動は中止です。";
      inner.appendChild(strong);

      if (message) {
        const spacer = document.createElement("span");
        spacer.textContent = " ";
        inner.appendChild(spacer);

        const detail = document.createElement("span");
        detail.textContent = message;
        inner.appendChild(detail);
      }

      banner.appendChild(inner);
      document.body.prepend(banner);
    } catch (error) {
      return;
    }
  }

  updateNextDate();
  loadStatusBanner();
})();
