window.addEventListener("DOMContentLoaded", () => {
  const DEMO_MODE = window.RVSPLY_DEMO_MODE !== false;
  const API_BASE = (window.RVSPLY_API_BASE || "http://127.0.0.1:5000").replace(/\/$/, "");
  const loginModal = document.getElementById("loginModal");
  const registerModal = document.getElementById("registerModal");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const updateNavState = () => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    loginBtn.style.display = loggedIn ? "none" : "inline-block";
    registerBtn.style.display = loggedIn ? "none" : "inline-block";
    logoutBtn.style.display = loggedIn ? "inline-block" : "none";
  };
  updateNavState();

  document.querySelector('a[href="dashboard.html"]')?.addEventListener("click", (event) => {
    if (localStorage.getItem("loggedIn") === "true") return;
    event.preventDefault();
    loginModal.style.display = "flex";
  });
  loginBtn.addEventListener("click", () => loginModal.style.display = "flex");
  registerBtn.addEventListener("click", () => registerModal.style.display = "flex");

  document.getElementById("confirmLogin").addEventListener("click", async () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!username || !password) return alert("Enter your username and password.");
    if (DEMO_MODE) {
      const accounts = JSON.parse(localStorage.getItem("rvsply_demo_accounts") || "[]");
      const account = accounts.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password);
      if (!account) return alert("Demo sign-in failed. Create an account first using Register.");
      localStorage.setItem("username", account.username);
      localStorage.setItem("email", account.email);
      localStorage.setItem("user_id", account.id);
      localStorage.setItem("loggedIn", "true");
      window.location.href = "dashboard.html";
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Sign-in failed.");
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("username", data.username);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("email", (data.email || "").toLowerCase());
      window.location.href = "dashboard.html";
    } catch {
      alert(`Could not reach the API at ${API_BASE}.`);
    }
  });

  document.getElementById("confirmRegister").addEventListener("click", async () => {
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;
    if (!username || !email || !password) return alert("Complete all fields.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Enter a valid email address.");
    if (DEMO_MODE) {
      const accounts = JSON.parse(localStorage.getItem("rvsply_demo_accounts") || "[]");
      if (accounts.some((item) => item.email === email || item.username.toLowerCase() === username.toLowerCase())) return alert("That username or email is already registered in this browser.");
      accounts.push({ id: `demo-${Date.now()}`, username, email, password });
      localStorage.setItem("rvsply_demo_accounts", JSON.stringify(accounts));
      alert("Demo account created in this browser. You can now sign in.");
      registerModal.style.display = "none";
      loginModal.style.display = "flex";
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, email, password }) });
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Registration failed.");
      alert("Account created. You can now sign in.");
      registerModal.style.display = "none";
      loginModal.style.display = "flex";
    } catch {
      alert(`Could not reach the API at ${API_BASE}.`);
    }
  });

  document.getElementById("cancelLogin").addEventListener("click", () => loginModal.style.display = "none");
  document.getElementById("cancelRegister").addEventListener("click", () => registerModal.style.display = "none");
  document.getElementById("openRegisterLink").addEventListener("click", (event) => { event.preventDefault(); loginModal.style.display = "none"; registerModal.style.display = "flex"; });
  document.getElementById("openLoginLink").addEventListener("click", (event) => { event.preventDefault(); registerModal.style.display = "none"; loginModal.style.display = "flex"; });
  window.addEventListener("click", (event) => { if (event.target === loginModal) loginModal.style.display = "none"; if (event.target === registerModal) registerModal.style.display = "none"; });
  logoutBtn.addEventListener("click", () => { localStorage.removeItem("loggedIn"); localStorage.removeItem("username"); localStorage.removeItem("user_id"); localStorage.removeItem("email"); updateNavState(); });

  const slides = [...document.querySelectorAll(".slide")];
  const slideTrack = document.querySelector(".slides");
  const carousel = document.querySelector(".carousel");
  if (slides.length && slideTrack && carousel) {
    let current = 0;
    const show = (index) => { current = (index + slides.length) % slides.length; slideTrack.style.transform = `translateX(-${current * 100}%)`; slides.forEach((slide, i) => slide.classList.toggle("active", i === current)); };
    let timer = setInterval(() => show(current + 1), 4500);
    carousel.addEventListener("mouseenter", () => clearInterval(timer));
    carousel.addEventListener("mouseleave", () => { clearInterval(timer); timer = setInterval(() => show(current + 1), 4500); });
    let startX = 0;
    carousel.addEventListener("touchstart", (event) => { startX = event.touches[0].clientX; }, { passive: true });
    carousel.addEventListener("touchend", (event) => { const delta = event.changedTouches[0].clientX - startX; if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1)); });
  }
});