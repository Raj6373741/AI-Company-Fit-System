const jobId = "69a589f6687dc4347e680f9e"; // replace if needed
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// 🔥 Upload Resume
function uploadResume() {
  const fileInput = document.getElementById("resumeFile");
  const formData = new FormData();
  formData.append("resume", fileInput.files[0]);

  fetch("http://localhost:5000/api/candidates/upload-resume", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.extractedSkills) {
      document.getElementById("skills").innerText =
        data.extractedSkills.join(", ");
    }
  });
}

// 🔥 Apply Job
function applyJob() {

  fetch(`http://localhost:5000/api/jobs/apply/${jobId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {

    const result = data.scoreBreakdown;

    const resultBox = document.getElementById("resultBox");

    let color = "red";

    if (result.finalScore > 80) color = "green";
    else if (result.finalScore > 60) color = "orange";

    resultBox.innerHTML = `
      <div style="padding:20px; border-radius:8px; background:#f5f5f5;">
        <h3 style="color:${color};">Final Fit Score: ${result.finalScore}</h3>
        <p><strong>Skill Match:</strong> ${result.skillMatchPercent}%</p>
        <p><strong>Experience Score:</strong> ${result.experienceScore}</p>
        <p><strong>Personality Score:</strong> ${result.personalityScore}</p>
        <p><strong>Confidence Index:</strong> ${result.confidenceIndex}%</p>
        <p><strong>AI Insight:</strong> ${result.explanation}</p>
      </div>
    `;
  });
}