window.addEventListener("DOMContentLoaded", () => {
  const DEMO_MODE = window.RVSPLY_DEMO_MODE !== false;
  const API_BASE = (window.RVSPLY_API_BASE || "http://127.0.0.1:5000").replace(/\/$/, "");
  const username = localStorage.getItem("username") || "Guest";
  const userId = localStorage.getItem("user_id");
  const email = localStorage.getItem("email") || "";
  const eventList = document.getElementById("eventList");
  const addEventBtn = document.getElementById("addEventBtn");
  const guestListBtn = document.getElementById("guestListBtn");
  const modal = document.getElementById("eventModal");
  const modalContent = document.getElementById("modalContent");
  const modalTitle = document.getElementById("modalTitle");
  const isMIT = email.endsWith("@mitwpu.edu.in") || email.endsWith("@mitwpu.ac.in");
  if (localStorage.getItem("loggedIn") !== "true") { window.location.href = "index.html"; return; }
  document.getElementById("welcomeUser").textContent = `Welcome, ${username}`;
  const closeModal = () => modal.style.display = "none";
  const showModal = () => modal.style.display = "flex";
  const loadDemoEvents = () => JSON.parse(localStorage.getItem("rvsply_demo_events") || "[]");
  const saveDemoEvents = (events) => localStorage.setItem("rvsply_demo_events", JSON.stringify(events));
  const loadDemoGuests = () => JSON.parse(localStorage.getItem("rvsply_demo_guests") || "[]");
  if (DEMO_MODE && !localStorage.getItem("rvsply_demo_seeded")) {
    saveDemoEvents([
      { id: "demo-event-1", title: "Campus Welcome Night", date: "2026-10-12", time: "18:00", venue: "Open Air Theatre", description: "An evening of music, food and new connections to kick off the semester.", image_url: "../images/carousel1.jpg", created_by: userId, visibility: "public" },
      { id: "demo-event-2", title: "Design & Innovation Meetup", date: "2026-10-18", time: "15:30", venue: "Innovation Lab", description: "Meet student makers, share ideas and explore creative technology.", image_url: "../images/carousel2.jpg", created_by: "sample-organizer", visibility: "public" },
      { id: "demo-event-3", title: "Autumn Social Mixer", date: "2026-10-24", time: "17:00", venue: "University Garden", description: "Good conversations, live acoustic music and seasonal refreshments.", image_url: "../images/carousel3.jpg", created_by: userId, visibility: "public" }
    ]);
    localStorage.setItem("rvsply_demo_seeded", "true");
  }

  document.getElementById("logoutBtn").addEventListener("click", () => { ["loggedIn", "username", "user_id", "email"].forEach((key) => localStorage.removeItem(key)); window.location.href = "index.html"; });
  document.getElementById("dashLogo").addEventListener("click", () => window.location.href = "index.html");
  const userBar = document.querySelector(".dashboard-user");
  userBar.insertAdjacentHTML("beforeend", '<button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle color theme"><span class="toggle-circle"></span></button>');
  if (localStorage.getItem("theme") === "light") document.documentElement.classList.add("light-mode");
  document.getElementById("themeToggle").addEventListener("click", () => { document.documentElement.classList.toggle("light-mode"); localStorage.setItem("theme", document.documentElement.classList.contains("light-mode") ? "light" : "dark"); });

  function renderCard(event) {
    const owner = String(event.created_by) === String(userId);
    return `<article class="event-card"><img src="${event.image_url || "../images/carousel1.jpg"}" alt="${event.title}"><div class="event-card-content"><span class="event-tag">${event.visibility === "mit" ? "Campus" : "Open event"}</span><h3>${event.title}</h3><p class="meta">${event.date} · ${event.time} · ${event.venue}</p><p>${event.description}</p><div class="actions"><div class="row"><button class="btn ghost small viewBtn" data-id="${event.id}">Details</button><button class="btn small rsvpBtn" data-id="${event.id}">RSVP</button><button class="btn ghost small guestBtn" data-id="${event.id}">Guests</button></div>${owner ? `<div class="row owner-row"><button class="btn ghost small editBtn" data-id="${event.id}">Edit</button><button class="btn ghost small deleteBtn" data-id="${event.id}">Delete</button></div>` : ""}</div></div></article>`;
  }
  function attachListeners() {
    document.querySelectorAll(".viewBtn").forEach((button) => button.addEventListener("click", () => showEvent(button.dataset.id)));
    document.querySelectorAll(".rsvpBtn").forEach((button) => button.addEventListener("click", () => openRSVP(button.dataset.id)));
    document.querySelectorAll(".guestBtn").forEach((button) => button.addEventListener("click", () => viewGuests(button.dataset.id)));
    document.querySelectorAll(".deleteBtn").forEach((button) => button.addEventListener("click", () => deleteEvent(button.dataset.id)));
    document.querySelectorAll(".editBtn").forEach((button) => button.addEventListener("click", () => editEvent(button.dataset.id)));
  }
  async function loadEvents() {
    if (DEMO_MODE) {
      const events = loadDemoEvents().filter((event) => event.visibility !== "mit" || isMIT);
      eventList.innerHTML = events.length ? events.map(renderCard).join("") : '<p class="placeholder">No events yet. Create the first one.</p>';
      attachListeners();
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/events?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error("Request failed");
      const events = await response.json();
      eventList.innerHTML = events.length ? events.filter((event) => event.visibility !== "mit" || isMIT).map(renderCard).join("") : '<p class="placeholder">No events yet. Create the first one.</p>';
      attachListeners();
    } catch { eventList.innerHTML = `<p class="placeholder">Could not load events from ${API_BASE}. Check the API and database.</p>`; }
  }
  addEventBtn.addEventListener("click", () => {
    modalTitle.textContent = "Create an event";
    modalContent.innerHTML = `<label for="eventTitle">Event name</label><input id="eventTitle" placeholder="e.g. Student showcase" required><div class="form-grid"><div><label for="eventDate">Date</label><input id="eventDate" type="date" required></div><div><label for="eventTime">Time</label><input id="eventTime" type="time" required></div></div><label for="eventVenue">Location</label><input id="eventVenue" placeholder="Building or venue"><label for="eventDescription">Description</label><textarea id="eventDescription" placeholder="What should guests know?"></textarea><label for="eventImage">Image URL (optional)</label><input id="eventImage" placeholder="https://..."><button id="saveEvent" class="btn modal-submit">Create event</button>`;
    showModal();
    document.getElementById("saveEvent").addEventListener("click", async () => {
      const event = { id: `demo-event-${Date.now()}`, title: document.getElementById("eventTitle").value.trim(), date: document.getElementById("eventDate").value, time: document.getElementById("eventTime").value, venue: document.getElementById("eventVenue").value.trim() || "Location to be announced", description: document.getElementById("eventDescription").value.trim(), image_url: document.getElementById("eventImage").value.trim() || "../images/carousel1.jpg", created_by: userId, visibility: "public" };
      if (!event.title || !event.date || !event.time) return alert("Add an event name, date and time.");
      if (DEMO_MODE) { const events = loadDemoEvents(); events.unshift(event); saveDemoEvents(events); closeModal(); loadEvents(); return; }
      try { const response = await fetch(`${API_BASE}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...event, created_by: userId, email }) }); if (!response.ok) throw new Error(); closeModal(); loadEvents(); } catch { alert("The API could not save this event."); }
    });
  });
  async function editEvent(id) {
    const event = DEMO_MODE ? loadDemoEvents().find((item) => String(item.id) === String(id)) : (await (await fetch(`${API_BASE}/events?email=${encodeURIComponent(email)}`)).json()).find((item) => String(item.id) === String(id));
    if (!event) return;
    modalTitle.textContent = "Edit event";
    modalContent.innerHTML = `<label for="editTitle">Event name</label><input id="editTitle" value="${event.title}"><div class="form-grid"><div><label for="editDate">Date</label><input id="editDate" type="date" value="${event.date}"></div><div><label for="editTime">Time</label><input id="editTime" type="time" value="${event.time}"></div></div><label for="editVenue">Location</label><input id="editVenue" value="${event.venue}"><label for="editDescription">Description</label><textarea id="editDescription">${event.description}</textarea><button id="updateEvent" class="btn modal-submit">Save changes</button>`;
    showModal();
    document.getElementById("updateEvent").addEventListener("click", async () => {
      const updated = { ...event, title: document.getElementById("editTitle").value.trim(), date: document.getElementById("editDate").value, time: document.getElementById("editTime").value, venue: document.getElementById("editVenue").value.trim(), description: document.getElementById("editDescription").value.trim() };
      if (!updated.title || !updated.date || !updated.time) return alert("Event name, date and time are required.");
      if (DEMO_MODE) { saveDemoEvents(loadDemoEvents().map((item) => String(item.id) === String(id) ? updated : item)); closeModal(); loadEvents(); return; }
      try { await fetch(`${API_BASE}/events/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...updated, user_id: userId, email }) }); closeModal(); loadEvents(); } catch { alert("Could not update the event."); }
    });
  }
  async function showEvent(id) {
    const events = DEMO_MODE ? loadDemoEvents() : await (await fetch(`${API_BASE}/events?email=${encodeURIComponent(email)}`)).json();
    const event = events.find((item) => String(item.id) === String(id));
    const guests = DEMO_MODE ? loadDemoGuests() : await (await fetch(`${API_BASE}/guests`)).json();
    const related = guests.filter((guest) => String(guest.event_id) === String(id));
    modalTitle.textContent = event.title;
    modalContent.innerHTML = `<p class="detail-meta">${event.date} · ${event.time} · ${event.venue}</p><p>${event.description}</p><div class="stats-box"><span><strong>${related.filter((guest) => guest.status === "Going").length}</strong> going</span><span><strong>${related.filter((guest) => guest.status === "Maybe").length}</strong> maybe</span><span><strong>${related.length}</strong> responses</span></div>`;
    showModal();
  }
  function openRSVP(id) {
    modalTitle.textContent = "Your RSVP";
    modalContent.innerHTML = `<label for="guestName">Your name</label><input id="guestName" placeholder="Name for the guest list"><div class="rsvp-buttons"><button class="rsvp-btn active" data-status="Going">Going</button><button class="rsvp-btn" data-status="Maybe">Maybe</button><button class="rsvp-btn" data-status="Not Going">Can't go</button></div><button id="confirmRSVP" class="btn modal-submit">Confirm RSVP</button><div id="qrArea"></div>`;
    showModal();
    let status = "Going";
    document.querySelectorAll(".rsvp-btn").forEach((button) => button.addEventListener("click", () => { status = button.dataset.status; document.querySelectorAll(".rsvp-btn").forEach((item) => item.classList.toggle("active", item === button)); }));
    document.getElementById("confirmRSVP").addEventListener("click", async () => {
      const name = document.getElementById("guestName").value.trim();
      if (!name) return alert("Enter your name to RSVP.");
      if (DEMO_MODE) {
        const guests = loadDemoGuests();
        guests.push({ id: `demo-guest-${Date.now()}`, event_id: id, name, status, event_title: loadDemoEvents().find((event) => String(event.id) === String(id))?.title || "Event" });
        localStorage.setItem("rvsply_demo_guests", JSON.stringify(guests));
        document.getElementById("qrArea").innerHTML = '<p class="demo-note">Demo RSVP saved in this browser. QR check-in will be connected during backend development.</p>';
        return;
      }
      try { const response = await fetch(`${API_BASE}/rsvp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: id, name, status }) }); const result = await response.json(); document.getElementById("qrArea").innerHTML = `<p>Scan this QR at entry:</p><img src="${result.qr_image}" class="qr-image" alt="RSVP check-in QR code">`; } catch { alert("Could not submit RSVP."); }
    });
  }
  async function viewGuests(id) {
    const guests = DEMO_MODE ? loadDemoGuests() : await (await fetch(`${API_BASE}/guests`)).json();
    const list = guests.filter((guest) => String(guest.event_id) === String(id));
    modalTitle.textContent = "Guest list";
    modalContent.innerHTML = list.length ? `<div class="guest-list">${list.map((guest) => `<div class="guest-item"><strong>${guest.name}</strong><span>${guest.status}</span></div>`).join("")}</div>` : '<p class="demo-note">No RSVPs yet. Be the first to respond.</p>';
    showModal();
  }
  async function deleteEvent(id) {
    if (!confirm("Delete this event?")) return;
    if (DEMO_MODE) saveDemoEvents(loadDemoEvents().filter((event) => String(event.id) !== String(id)));
    else await fetch(`${API_BASE}/events/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId }) });
    loadEvents();
  }
  guestListBtn.addEventListener("click", async () => {
    const guests = DEMO_MODE ? loadDemoGuests() : await (await fetch(`${API_BASE}/guests`)).json();
    modalTitle.textContent = "Guest list";
    modalContent.innerHTML = guests.length ? `<div class="guest-list">${guests.map((guest) => `<div class="guest-item"><div><strong>${guest.name}</strong><p>${guest.event_title || "Event"}</p></div><span>${guest.status}</span></div>`).join("")}</div>` : '<p class="demo-note">Guest RSVPs will appear here.</p>';
    showModal();
  });
  document.getElementById("closeModal").addEventListener("click", closeModal);
  window.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  loadEvents();
});