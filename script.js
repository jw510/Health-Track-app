
function showTab(tabId) {
  document.querySelectorAll(".tabContent").forEach(div => div.style.display = "none");
  document.getElementById(tabId).style.display = "block";
  if (tabId === "chartTab") renderChart();
}

const defaultSettings = {
  uric: { Male: [200, 430], Female: [140, 360] },
  glucose: {
    Before: { normal: [3.9, 5.6], pre: [5.6, 7], dia: [7, 99] },
    After: { normal: [0, 7.8], pre: [7.8, 11], dia: [11, 99] }
  }
};

function loadSettings() {
  const s = JSON.parse(localStorage.getItem("healthSettings")) || defaultSettings;
  document.getElementById("uricMale").value = s.uric.Male.join("-");
  document.getElementById("uricFemale").value = s.uric.Female.join("-");
  document.getElementById("bgBeforeNormal").value = s.glucose.Before.normal.join("-");
  document.getElementById("bgBeforePre").value = s.glucose.Before.pre.join("-");
  document.getElementById("bgBeforeDia").value = s.glucose.Before.dia.join("-");
  document.getElementById("bgAfterNormal").value = s.glucose.After.normal.join("-");
  document.getElementById("bgAfterPre").value = s.glucose.After.pre.join("-");
  document.getElementById("bgAfterDia").value = s.glucose.After.dia.join("-");
}

function saveSettings(e) {
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
}

function getAllData() {
  return JSON.parse(localStorage.getItem("healthData") || "[]");
}

function saveAllData(data) {
  localStorage.setItem("healthData", JSON.stringify(data));
}

function populateUserOptions() {
  const all = getAllData();
  const users = [...new Set(all.map(e => e.user))];
  const userSel = document.getElementById("userNameSelect");
  userSel.innerHTML = "<option value=''>Select existing</option>";
  users.forEach(u => userSel.innerHTML += `<option value="${u}">${u}</option>`);
  const filterUser = document.getElementById("filterUser");
  filterUser.innerHTML = "<option value=''>Select</option>";
  users.forEach(u => filterUser.innerHTML += `<option value="${u}">${u}</option>`);
}

function saveEntry(e) {
  e.preventDefault();
  const user = document.getElementById("userNameInput").value || document.getElementById("userNameSelect").value;
  const gender = document.getElementById("gender").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const uric = document.getElementById("uric").value;
  const glucose = document.getElementById("glucose").value;
  const meal = document.getElementById("meal").value;

  if (!user || !gender || !date || !time || (!uric && !glucose)) {
    alert("Please fill required fields and at least one measurement.");
    return;
  }

  const data = getAllData();
  data.push({ user, gender, date, time, uric: uric ? parseFloat(uric) : null, glucose: glucose ? parseFloat(glucose) : null, meal });
  saveAllData(data);
  document.getElementById("entryForm").reset();
  populateUserOptions();
  alert("Entry saved.");
}

function renderTable() {
  const user = document.getElementById("filterUser").value;
  const metric = document.getElementById("filterMetric").value;
  const table = document.getElementById("dataTable");
  const settings = JSON.parse(localStorage.getItem("healthSettings")) || defaultSettings;

  let data = getAllData();
  if (user) data = data.filter(e => e.user === user);
  data.reverse();

  table.innerHTML = "<tr><th>Date</th><th>Time</th><th>Value</th><th>Meal</th><th>Status</th><th>Actions</th></tr>";
  data.forEach((d, idx) => {
    let value = d[metric];
    let status = "-";
    let color = "";

    if (value !== null) {
      if (metric === "uric") {
        const [min, max] = settings.uric[d.gender];
        status = (value < min || value > max) ? "Out of Range" : "Normal";
        color = (status === "Normal") ? "green" : "red";
      } else {
        const ref = settings.glucose[d.meal];
        if (value <= ref.normal[1]) status = "Normal";
        else if (value <= ref.pre[1]) status = "Prediabetes";
        else status = "Diabetes";
        color = (status === "Normal") ? "green" : "red";
      }
    }

    table.innerHTML += `<tr>
      <td>${d.date}</td>
      <td>${d.time}</td>
      <td class="${color}">${value ?? "-"}</td>
      <td>${d.meal}</td>
      <td class="${color}">${status}</td>
      <td>
        <button onclick="editEntry(${data.length - 1 - idx})">Delete</button>
      </td>
    </tr>`;
  });
}

function deleteEntry(index) {
  const data = getAllData();
  if (confirm("Delete this entry?")) {
    data.splice(index, 1);
    saveAllData(data);
    renderTable(); populateUserOptions();
    populateUserOptions();
  }
}

function exportCSV() {
  const data = getAllData();
  const rows = [
    ["User", "Gender", "Date", "Time", "Uric Acid", "Blood Glucose", "Meal Timing"]
  ];
  data.forEach(d => {
    rows.push([d.user, d.gender, d.date, d.time, d.uric ?? "", d.glucose ?? "", d.meal]);
  });
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "health_data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function renderChart() {
  const ctx = document.getElementById("healthChart").getContext("2d");
  const data = getAllData().filter(d => d.glucose !== null || d.uric !== null);
  const labels = data.map(d => d.date + " " + d.time);
  const glucose = data.map(d => d.glucose ?? null);
  const uric = data.map(d => d.uric ?? null);

  if (window.healthChartInstance) window.healthChartInstance.destroy();

  window.healthChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Blood Glucose",
          data: glucose,
          borderColor: "lightgreen",
          fill: false,
          spanGaps: true
        },
        {
          label: "Uric Acid",
          data: uric,
          borderColor: "lightblue",
          fill: false,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#eee" } }
      },
      scales: {
        x: { ticks: { color: "#eee" } },
        y: { ticks: { color: "#eee" } }
      }
    }
  });
}

document.getElementById("settingsForm").addEventListener("submit", saveSettings);
document.getElementById("entryForm").addEventListener("submit", saveEntry);

window.onload = () => {
  loadSettings();
  populateUserOptions();
  renderTable(); populateUserOptions();
};


let editIndex = null;

function editEntry(index) {
  const data = getAllData();
  const entry = data[index];
  document.getElementById("userNameInput").value = entry.user;
  document.getElementById("gender").value = entry.gender;
  document.getElementById("date").value = entry.date;
  document.getElementById("time").value = entry.time;
  document.getElementById("uric").value = entry.uric ?? "";
  document.getElementById("glucose").value = entry.glucose ?? "";
  document.getElementById("meal").value = entry.meal;
  editIndex = index;
  showTab('inputTab');
}

function saveEntry(e) {
  e.preventDefault();
  const user = document.getElementById("userNameInput").value || document.getElementById("userNameSelect").value;
  const gender = document.getElementById("gender").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const uric = document.getElementById("uric").value;
  const glucose = document.getElementById("glucose").value;
  const meal = document.getElementById("meal").value;

  if (!user || !gender || !date || !time || (!uric && !glucose)) {
    alert("Please fill required fields and at least one measurement.");
    return;
  }

  const newEntry = {
    user,
    gender,
    date,
    time,
    uric: uric ? parseFloat(uric) : null,
    glucose: glucose ? parseFloat(glucose) : null,
    meal
  };

  const data = getAllData();
  if (editIndex !== null) {
    data[editIndex] = newEntry;
    editIndex = null;
  } else {
    data.push(newEntry);
  }

  saveAllData(data);
  document.getElementById("entryForm").reset();
  populateUserOptions();
  alert("Entry saved.");
  renderTable();
}
