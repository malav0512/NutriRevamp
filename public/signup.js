// signup.js
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const result = await response.json();
  if (result.message === "Signup successful!") {
    alert("Signup successful!");
    // Optionally, redirect to login page
    window.location.href = "/login.html";
  } else {
    alert(result.message);  // e.g., "User already exists!"
  }
});
