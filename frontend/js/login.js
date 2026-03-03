function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {

    console.log("LOGIN RESPONSE:", data);   // 🔥 DEBUG

    if (data.token) {

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      console.log("Saved Role:", data.role);

      if (data.role === "hr") {
        window.location.href = "hr-dashboard.html";
      } 
      else if (data.role === "candidate") {
        window.location.href = "candidate-dashboard.html";
      }

    } else {
      alert("Login failed");
    }
  })
  .catch(err => console.error(err));
}