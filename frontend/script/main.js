window.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:5000";

  const loginModal = document.getElementById("loginModal");
  const registerModal = document.getElementById("registerModal");

  const confirmLogin = document.getElementById("confirmLogin");
  const cancelLogin = document.getElementById("cancelLogin");
  const confirmRegister = document.getElementById("confirmRegister");
  const cancelRegister = document.getElementById("cancelRegister");

  const eventsLink = document.querySelector('a[href="dashboard.html"]');
  const loginBtn = document.querySelector("#loginBtn");
  const registerBtn = document.querySelector("#registerBtn");
  const logoutBtn = document.querySelector("#logoutBtn");
  const openRegisterLink = document.querySelector("#openRegisterLink");
  const openLoginLink = document.querySelector("#openLoginLink");

  // ---------------------------------------------------------
  // Update navbar buttons
  // ---------------------------------------------------------
  const updateNavState = () => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (loggedIn) {
      loginBtn.style.display = "none";
      registerBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      loginBtn.style.display = "inline-block";
      registerBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  };
  updateNavState();

  // ---------------------------------------------------------
  // "Events" link → require login
  // ---------------------------------------------------------
  eventsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (localStorage.getItem("loggedIn") === "true") {
      window.location.href = "dashboard.html";
    } else {
      loginModal.style.display = "flex";
    }
  });

  // ---------------------------------------------------------
  // Login Modal open
  // ---------------------------------------------------------
  loginBtn?.addEventListener("click", () => {
    loginModal.style.display = "flex";
  });

  // ---------------------------------------------------------
  // Register Modal open
  // ---------------------------------------------------------
  registerBtn?.addEventListener("click", () => {
    registerModal.style.display = "flex";
  });

  // ---------------------------------------------------------
  // LOGIN (🔥 now stores email correctly)
  // ---------------------------------------------------------
  confirmLogin?.addEventListener("click", async () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) return alert("Please fill in both fields.");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("username", data.username);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("email", (data.email || "").toLowerCase()); // 🔥 Store MIT email

        loginModal.style.display = "none";
        updateNavState();
        window.location.href = "dashboard.html";
      } else {
        alert(data.error || "Login failed.");
      }
    } catch (err) {
      alert("Server error, try again later.");
    }
  });

  // ---------------------------------------------------------
  // REGISTER (🔥 NOW SUPPORTS EMAIL)
  // ---------------------------------------------------------
  confirmRegister?.addEventListener("click", async () => {
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value.trim();

    if (!username || !email || !password)
      return alert("Please fill all fields.");

    // Simple email check
    if (!email.includes("@") || !email.includes(".")) {
      return alert("Enter a valid email.");
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful! You can now log in.");
        registerModal.style.display = "none";
        loginModal.style.display = "flex";
      } else {
        alert(data.error || "Registration failed.");
      }
    } catch (err) {
      alert("Server error, try again later.");
    }
  });

  // ---------------------------------------------------------
  // Cancel buttons
  // ---------------------------------------------------------
  cancelLogin?.addEventListener("click", () => (loginModal.style.display = "none"));
  cancelRegister?.addEventListener("click", () => (registerModal.style.display = "none"));

  // ---------------------------------------------------------
  // Click outside to close modals
  // ---------------------------------------------------------
  window.addEventListener("click", (e) => {
    if (e.target === loginModal) loginModal.style.display = "none";
    if (e.target === registerModal) registerModal.style.display = "none";
  });

  // ---------------------------------------------------------
  // Switch login/register from links
  // ---------------------------------------------------------
  openRegisterLink?.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "none";
    registerModal.style.display = "flex";
  });

  openLoginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    registerModal.style.display = "none";
    loginModal.style.display = "flex";
  });

  // ---------------------------------------------------------
  // Logout
  // ---------------------------------------------------------
  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    updateNavState();
    alert("You have been logged out.");
  });
});
