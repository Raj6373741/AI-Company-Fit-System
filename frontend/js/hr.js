const jobId = "69a589f6687dc4347e680f9e";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// ------------------- FETCH STATS -------------------
fetch(`http://localhost:5000/api/jobs/stats/${jobId}`, {
  headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {

  if (!data.totalApplications) return;

  document.getElementById("total").innerText = data.totalApplications;
  document.getElementById("avg").innerText = data.averageFitScore;
  document.getElementById("high").innerText = data.highestFitScore;

  document.getElementById("topCandidate").innerText =
    "Skills: " + (data.topCandidate?.skills?.join(", ") || "-");

  // 🔥 Skill Chart
  const skillCtx = document.getElementById("skillChart");

  new Chart(skillCtx, {
    type: "bar",
    data: {
      labels: Object.keys(data.skillFrequency || {}),
      datasets: [{
        label: "Skill Frequency",
        data: Object.values(data.skillFrequency || {}),
      }]
    }
  });

});


// ------------------- FETCH RANKING -------------------
function loadRanking() {

  const minScore = document.getElementById("minScore")?.value || 0;

  fetch(`http://localhost:5000/api/jobs/rank/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {

    const table = document.getElementById("rankingTable");
    table.innerHTML = "";

    const scores = [];

    data
      .filter(item => item.fitScore >= minScore)
      .forEach((item, index) => {

        scores.push(item.fitScore);

        let status = "Low";
        let badgeColor = "red";

        if (item.fitScore > 80) {
          status = "Excellent";
          badgeColor = "green";
        } else if (item.fitScore > 60) {
          status = "Good";
          badgeColor = "orange";
        }

        const row = document.createElement("tr");

        if (index === 0) {
          row.style.backgroundColor = "#e8f5e9";
        }

        row.innerHTML = `
          <td>${item.fitScore}</td>
          <td>${item.confidenceIndex || "-"}</td>
          <td>${item.candidate?.skills?.join(", ") || "-"}</td>
          <td style="color:${badgeColor}; font-weight:bold;">
            ${status}
          </td>
          <td>
            <a href="${item.resumeLink}" target="_blank">View</a>
          </td>
        `;

        table.appendChild(row);
      });

    // 🔥 Fit Score Chart
    const scoreCtx = document.getElementById("scoreChart");

    new Chart(scoreCtx, {
      type: "line",
      data: {
        labels: scores.map((_, i) => "Candidate " + (i + 1)),
        datasets: [{
          label: "Fit Scores",
          data: scores,
        }]
      }
    });

  });
}

// Load automatically
loadRanking();