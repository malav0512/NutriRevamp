// login.js
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const result = await response.json();
  if (result.success) {
    alert("Login successful!");
    // Optionally, redirect to a user dashboard or home page
    window.location.href = "/home.html";
  } else {
    alert("Login failed. Please check your credentials.");
  }
});
