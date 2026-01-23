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
    const targets = document.querySelectorAll("[data-next-date]");
    if (!targets.length) return;
    const nextDate = getNextSecondSunday(new Date());
    const formatted = formatDate(nextDate);
    targets.forEach((target) => {
      target.textContent = formatted;
    });
  }

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
    try {
      const response = await fetch("/status.json", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || data.cancelled !== true) return;

      const message = typeof data.message === "string" ? data.message.trim() : "";
      const banner = document.createElement("div");
      banner.className = "ui-banner";

      const inner = document.createElement("div");
      inner.className = "max-w-5xl mx-auto px-6 py-4 text-sm sm:text-base";

      const headline = document.createElement("strong");
      headline.textContent = "【重要】今回の活動は中止です";
      inner.appendChild(headline);

      if (message) {
        const spacer = document.createElement("span");
        spacer.textContent = " ";
        inner.appendChild(spacer);

        const detail = document.createElement("span");
        detail.textContent = message;
        inner.appendChild(detail);
      }

      const nextLine = document.createElement("div");
      nextLine.className = "ui-banner__next";

      const nextLabel = document.createElement("span");
      nextLabel.textContent = "次回: ";
      nextLine.appendChild(nextLabel);

      const nextDateSpan = document.createElement("span");
      nextDateSpan.setAttribute("data-next-date", "");
      nextLine.appendChild(nextDateSpan);

      const nextTime = document.createElement("span");
      nextTime.textContent = " 10:30～";
      nextLine.appendChild(nextTime);

      inner.appendChild(nextLine);

      const updatedAt = formatUpdatedAt(data.updated);
      if (updatedAt) {
        const updated = document.createElement("div");
        updated.className = "ui-banner__updated";
        updated.textContent = `更新: ${updatedAt}`;
        inner.appendChild(updated);
      }

      banner.appendChild(inner);
      document.body.prepend(banner);
      updateNextDate();
    } catch (error) {
      return;
    }
  }

  updateNextDate();
  loadStatusBanner();

  function setActiveNav() {
    const path = window.location.pathname || "/";
    let activePath = "/";
    if (path.includes("/about/")) {
      activePath = "/about/";
    } else if (path.includes("/join/")) {
      activePath = "/join/";
    } else if (path.includes("/report/")) {
      activePath = "/report/";
    } else if (path.includes("/contact/")) {
      activePath = "/contact/";
    }

    document.querySelectorAll("a.nav-link").forEach((link) => {
      let linkPath = "";
      try {
        linkPath = new URL(link.getAttribute("href"), window.location.href).pathname;
      } catch (error) {
        linkPath = link.getAttribute("href") || "";
      }
      if (linkPath === activePath) {
        link.classList.add("active");
      }
    });
  }

  setActiveNav();
})();
