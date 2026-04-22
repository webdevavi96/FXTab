document.addEventListener("DOMContentLoaded", () => {
  let removeMode = false;

  setInterval(() => {
    const time = new Date().toLocaleTimeString();
    document.title = `⚡ FXTab • ${time}`;
  }, 1000);

  let username;

  function loadUsername() {
    chrome.storage.local.get("username", (res) => {
      const name = res.username || "anonymous";
      document.querySelector(".username").innerText = name;
    });
  }
  
  const statusBtn = document.querySelector(".status");
  const saveBtn = document.querySelector(".save");
  const usernameText = document.querySelector(".username");
  const input = document.getElementById("username");

  statusBtn.addEventListener("click", () => {
    input.value = usernameText.innerText;

    usernameText.classList.add("hidden");
    input.classList.remove("hidden");
    saveBtn.classList.remove("hidden");
    statusBtn.classList.add("hidden");
  });

  saveBtn.addEventListener("click", () => {
    const newUsername = input.value.trim() || "anonymous";

    chrome.storage.local.set({ username: newUsername });

    usernameText.innerText = newUsername;

    usernameText.classList.remove("hidden");
    input.classList.add("hidden");
    saveBtn.classList.add("hidden");
    statusBtn.classList.remove("hidden");
  });

  function updateTime() {
    document.querySelector(".time").innerText = new Date().toLocaleTimeString();
  }

  function updateDate() {
    document.querySelector(".date").innerText = new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      },
    );
  }

  const form = document.querySelector("#link-form");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const title = formData.get("title");
      let url = formData.get("url");

      if (!url.startsWith("http")) {
        url = "https://" + url;
      }

      const newBookmark = { name: title, url };

      chrome.storage.local.get("links", ({ links = [] }) => {
        links.push(newBookmark);

        chrome.storage.local.set({ links }, () => {
          renderLinks();
        });
      });
    });
  }

  const defaultLinks = [
    {
      name: "YouTube",
      url: "https://m.youtube.com/",
    },
    {
      name: "Portfolio",
      url: "https://webdevavi96.netlify.app/",
    },
  ];

  function renderLinks() {
    const container = document.querySelector(".link-container");
    container.innerHTML = "";

    chrome.storage.local.get(
      ["links", "timeData"],
      ({ links = [], timeData = {} }) => {
        // 🔥 merge default + saved
        const allLinks = [...defaultLinks, ...links];

        allLinks.forEach((link) => {
          const li = document.createElement("li");
          li.className = "dock-item";

          let domain = "";
          try {
            domain = new URL(link.url).hostname;
          } catch {
            domain = "unknown";
          }

          const timeSpent = timeData[domain] || 0;

          const a = document.createElement("a");
          a.href = link.url;
          a.target = "_blank";
          a.className = "link";
          a.title = link.name;

          const img = document.createElement("img");
          img.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`;
          img.className = "logo";

          img.style.opacity = timeSpent > 0 ? "1" : "0.5";

          a.appendChild(img);
          li.appendChild(a);
          container.appendChild(li);
        });
      },
    );
  }

  chrome.storage.local.get(["timeData"], ({ timeData = {} }) => {
    const entries = Object.entries(timeData)
      .filter(([d]) => d !== "newtab")
      .sort((a, b) => b[1] - a[1]);

    const top = entries.slice(0, 5);

    const labels = top.map(([d]) => d);
    const values = top.map(([_, t]) => Math.floor(t / 1000));

    renderChart(labels, values);

    const total = entries.reduce((sum, [, t]) => sum + t, 0);
    document.getElementById("totalTime").innerText =
      Math.floor(total / 60000) + "m";

    document.getElementById("topSite").innerText = entries[0]?.[0] || "—";
  });

  function renderChart(labels, data) {
    const ctx = document.getElementById("timeChart").getContext("2d");

    if (window.myChart) {
      window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "#ff6384",
              "#36a2eb",
              "#ffce56",
              "#4bc0c0",
              "#9966ff",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#ccc",
              font: {
                size: 10,
              },
            },
          },
        },
      },
    });
  }

  function addNewLink() {
    chrome.action?.openPopup?.().catch(() => {});
  }

  document.getElementById("add").addEventListener("click", addNewLink);
  loadUsername();
  renderLinks();
  updateDate();
  setInterval(() => updateTime(), 1000);
});

function formatTime(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}
