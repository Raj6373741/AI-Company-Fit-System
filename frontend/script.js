document.getElementById("candidateForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        skills: document.getElementById("skills").value.split(","),
        experience: Number(document.getElementById("experience").value),
        personalityScore: 70,
        fitScore: Math.floor(Math.random() * 100)
    };

    await fetch("http://localhost:5000/api/candidates/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    alert("Candidate Added Successfully");
});