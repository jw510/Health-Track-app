function showTab(tabId) {
  document.querySelectorAll(".tabContent").forEach(div => div.style.display = "none");
  document.getElementById(tabId).style.display = "block";
}

const settingsDefaults = {
  uric: { Male: [200, 430], Female: [140, 360] },
  glucose: {
    Before: { normal: [3.9, 5.6], pre: [5.6, 7], dia: [7, 99] },
    After: { normal: [0, 7.8], pre: [7.8, 11], dia: [11, 99] }
  }
};

function loadSettings() {
  const s = JSON.parse(localStorage.getItem("healthSettings")) || settingsDefaults;
  document.getElementById("uricMale").value = s.uric.Male.join("-");
  document.getElementById("uricFemale").value = s.uric.Female.join("-");
  document.getElementById("bgBeforeNormal").value = s.glucose.Before.normal.join("-");
  document.getElementById("bgBeforePre").value = s.glucose.Before.pre.join("-");
  document.getElementById("bgBeforeDia").value = s.glucose.Before.dia.join("-");
  document.getElementById("bgAfterNormal").value = s.glucose.After.normal.join("-");
  document.getElementById("bgAfterPre").value = s.glucose.After.pre.join("-");
  document.getElementById("bgAfterDia").value = s.glucose.After.dia.join("-");
}

document.getElementById("settingsForm").addEventListener("submit", e => {
  e.preventDefault();
  const get = id => document.getElementById(id).value.split("-").map(Number);
  const settings = {
    uric: {
      Male: get("uricMale"),
      Female: get("uricFemale")
    },
    glucose: {
      Before: {
        normal: get("bgBeforeNormal"),
        pre: get("bgBeforePre"),
        dia: get("bgBeforeDia")
      },
      After: {
        normal: get("bgAfterNormal"),
        pre: get("bgAfterPre"),
        dia: get("bgAfterDia")
      }
    }
  };
  localStorage.setItem("healthSettings", JSON.stringify(settings));
  alert("Settings saved!");
});

document.getElementById("entryForm").addEventListener("submit", e => {
  e.preventDefault();
  const user = document.getElementById("userName").value;
  const entry = {
    gender: document.getElementById("gender").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    uric: Number(document.getElementById("uric").value),
    glucose: Number(document.getElementById("glucose").value),
    meal: document.getElementById("meal").value
  };
  const all = JSON.parse(localStorage.getItem("healthData") || "{}");
  if (!all[user]) all[user] = [];
  all[user].push(entry);
  localStorage.setItem("healthData", JSON.stringify(all));
  renderUserOptions();
  alert("Data saved!");
  e.target.reset();
});

function renderUserOptions() {
  const all = JSON.parse(localStorage.getItem("healthData") || "{}");
  const userSel = document.getElementById("filterUser");
  userSel.innerHTML = "<option value=''>Select</option>";
  Object.keys(all).forEach(u => {
    userSel.innerHTML += `<option>${u}</option>`;
  });
}

function renderTable() {
  const user = document.getElementById("filterUser").value;
  const metric = document.getElementById("filterMetric").value;
  const table = document.getElementById("dataTable");
  table.innerHTML = "<tr><th>Date</th><th>Time</th><th>Value</th><th>Meal</th><th>Status</th></tr>";
  const data = JSON.parse(localStorage.getItem("healthData") || "{}")[user] || [];
  const settings = JSON.parse(localStorage.getItem("healthSettings")) || settingsDefaults;

  const rows = data.slice().reverse().map(d => {
    let value = d[metric];
    let status = "Normal";
    let color = "green";

    if (metric === "uric") {
      const [min, max] = settings.uric[d.gender];
      if (value < min || value > max) {
        status = "Out of range";
        color = "red";
      }
    } else if (metric === "glucose") {
      const ref = settings.glucose[d.meal];
      if (value < ref.normal[0] || value > ref.dia[1]) {
        status = "Invalid";
        color = "red";
      } else if (value <= ref.normal[1]) {
        status = "Normal";
        color = "green";
      } else if (value <= ref.pre[1]) {
        status = "Prediabetes";
        color = "red";
      } else {
        status = "Diabetes";
        color = "red";
      }
    }

    return `<tr>
      <td>${d.date}</td>
      <td>${d.time}</td>
      <td class="${color}">${value}</td>
      <td>${d.meal}</td>
      <td class="${color}">${status}</td>
    </tr>`;
  });

  table.innerHTML += rows.join("");
}

window.onload = () => {
  loadSettings();
  renderUserOptions();
};
