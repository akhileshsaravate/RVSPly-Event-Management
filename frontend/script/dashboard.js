window.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:5000";

  const username = localStorage.getItem("username") || "Guest";
  const user_id = localStorage.getItem("user_id");
  const email = localStorage.getItem("email") || "";
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  const eventList = document.getElementById("eventList");
  const addEventBtn = document.getElementById("addEventBtn");
  const guestListBtn = document.getElementById("guestListBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("eventModal");
  const modalContent = document.getElementById("modalContent");
  const modalTitle = document.getElementById("modalTitle");
  const closeModal = document.getElementById("closeModal");
  const logo = document.getElementById("dashLogo");

  if (!loggedIn) {
    alert("Please login to continue.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("welcomeUser").innerText = `Welcome, ${username}`;

  const hideModal = () => (modal.style.display = "none");
  const showModal = () => (modal.style.display = "flex");

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });

  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  const isMIT =
    email.endsWith("@mitwpu.edu.in") || email.endsWith("@mitwpu.ac.in");

  // ==========================================================
  // INSERT THEME TOGGLE BUTTON BESIDE LOGOUT
  // ==========================================================
  const userBar = document.querySelector(".dashboard-user");
  userBar.insertAdjacentHTML(
    "beforeend",
    `
    <div class="theme-toggle" id="themeToggle">
        <div class="toggle-circle" id="toggleCircle">
            <svg id="themeIcon" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 01111.21 3 7 7 0 1019 14.79 9.05 9.05 0 0121 12.79z"/>
            </svg>
        </div>
    </div>
  `
  );

  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") {
    document.documentElement.classList.add("light-mode");
  }

  document.getElementById("themeToggle").addEventListener("click", () => {
    const html = document.documentElement;

    if (html.classList.contains("light-mode")) {
      html.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    }
  });

  // ==========================================================
  // VISIBILITY PILL BUTTONS
  // ==========================================================
  function visibilityPills(currentValue = "public", allowMIT = false, prefix = "") {
    let mitBtn = allowMIT
      ? `<button class="btn pill-btn" id="${prefix}mit" data-value="mit">MIT-only</button>`
      : "";

    return `
      <div class="pill-group">
        <button class="btn pill-btn" id="${prefix}public" data-value="public">Public</button>
        ${mitBtn}
        <input type="hidden" id="${prefix}visibility" value="${currentValue}">
      </div>
    `;
  }

  function activatePills(prefix = "", allowMIT = false) {
    const publicBtn = document.getElementById(`${prefix}public`);
    const mitBtn = document.getElementById(`${prefix}mit`);
    const hidden = document.getElementById(`${prefix}visibility`);

    function setActive(btn, value) {
      if (!btn) return;
      publicBtn.classList.remove("active");
      if (mitBtn) mitBtn.classList.remove("active");
      btn.classList.add("active");
      hidden.value = value;
    }

    publicBtn.addEventListener("click", () => setActive(publicBtn, "public"));

    if (mitBtn && allowMIT) {
      mitBtn.addEventListener("click", () => setActive(mitBtn, "mit"));
    }

    if (hidden.value === "mit" && mitBtn && allowMIT) {
      mitBtn.classList.add("active");
    } else {
      publicBtn.classList.add("active");
    }
  }

  // ==========================================================
  // GENERATE EVENT CARD HTML
  // ==========================================================
  function renderEventCard(ev) {
    const isOwner = String(ev.created_by) === String(user_id);

    const ownerControls = `
      <button class="btn small exportBtn" data-id="${ev.id}">📄</button>
      <button class="btn ghost small editBtn" data-id="${ev.id}">✏️</button>
      <button class="btn small deleteBtn" data-id="${ev.id}">🗑️</button>
    `;

    const centeredExport = `
      <div style="display:flex; justify-content:center; width:100%;">
        <button class="btn small exportBtn" data-id="${ev.id}">📄</button>
      </div>
    `;

    return `
      <div class="event-card">
        <img src="${ev.image_url || "../images/carousel1.jpg"}">
        <h3>${ev.title}</h3>
        <p class="meta">${ev.date} @ ${ev.time} • ${ev.venue}</p>
        <p>${ev.description}</p>

        <div class="actions">
          <div class="row">
            <button class="btn small viewBtn" data-id="${ev.id}">View</button>
            <button class="btn small rsvpBtn" data-id="${ev.id}">RSVP</button>
            <button class="btn small guestBtn" data-id="${ev.id}">Guests</button>
          </div>

          <div class="row center" style="margin-top:10px;">
            ${isOwner ? ownerControls : centeredExport}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================
  // ATTACH BUTTON EVENTS
  // ==========================================================
  function attachButtonListeners() {
    document.querySelectorAll(".viewBtn").forEach((btn) =>
      btn.addEventListener("click", (e) => showEvent(e.currentTarget.dataset.id))
    );

    document.querySelectorAll(".rsvpBtn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        openRSVP(e.currentTarget.dataset.id)
      )
    );

    document.querySelectorAll(".guestBtn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        viewGuests(e.currentTarget.dataset.id)
      )
    );

    document.querySelectorAll(".deleteBtn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        deleteEvent(e.currentTarget.dataset.id)
      )
    );

    document.querySelectorAll(".editBtn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        editEvent(e.currentTarget.dataset.id)
      )
    );

    document.querySelectorAll(".exportBtn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        window.open(
          `${API_BASE}/export/${e.currentTarget.dataset.id}`,
          "_blank"
        )
      )
    );
  }

  // ==========================================================
  // LOAD EVENTS
  // ==========================================================
  async function loadEvents() {
    eventList.innerHTML = "<p class='placeholder'>Loading events...</p>";

    try {
      const url = `${API_BASE}/events?email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      const events = await res.json();

      eventList.innerHTML = "";

      if (!events || events.length === 0) {
        eventList.innerHTML = "<p class='placeholder'>No events yet.</p>";
        return;
      }

      const mitOnly = events.filter((e) => e.visibility === "mit");
      const pubOnly = events.filter((e) => e.visibility === "public");

      if (isMIT) {
        eventList.innerHTML += `
          <h2 class="section-title">MIT Events</h2>
          <hr class="section-line">
        `;
        mitOnly.forEach((ev) => (eventList.innerHTML += renderEventCard(ev)));
      }

      eventList.innerHTML += `
        <h2 class="section-title">Public Events</h2>
        <hr class="section-line">
      `;
      pubOnly.forEach((ev) => (eventList.innerHTML += renderEventCard(ev)));

      attachButtonListeners();
    } catch (err) {
      console.error(err);
      eventList.innerHTML = "<p class='placeholder'>Failed to load events.</p>";
    }
  }

  // ==========================================================
  // CREATE EVENT (WITH PILLS)
  // ==========================================================
  addEventBtn.addEventListener("click", () => {
    const allowMIT = isMIT;

    modalTitle.innerText = "Create New Event";
    modalContent.innerHTML = `
      <input type="text" id="eventTitle" placeholder="Event Title">
      <input type="date" id="eventDate">
      <input type="time" id="eventTime">
      <input type="text" id="eventVenue" placeholder="Venue">
      <textarea id="eventDescription" placeholder="Description"></textarea>
      <input type="text" id="eventImage" placeholder="Image URL (optional)">

      <label>Visibility</label>
      ${visibilityPills("public", allowMIT, "create_")}

      <button id="saveEvent" class="btn small" style="margin-top:10px;">Save Event</button>
    `;
    showModal();

    activatePills("create_", allowMIT);

    document.getElementById("saveEvent").onclick = async () => {
      let visibility = document.getElementById("create_visibility").value;
      if (!isMIT) visibility = "public";

      const data = {
        title: document.getElementById("eventTitle").value.trim(),
        date: document.getElementById("eventDate").value,
        time: document.getElementById("eventTime").value,
        venue: document.getElementById("eventVenue").value.trim(),
        description: document.getElementById("eventDescription").value.trim(),
        image_url: document.getElementById("eventImage").value.trim(),
        visibility,
        created_by: user_id,
        email,
      };

      if (!data.title || !data.date || !data.time) {
        alert("Fill all required fields!");
        return;
      }

      await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      hideModal();
      loadEvents();
    };
  });

  // ==========================================================
  // EDIT EVENT (WITH PILLS)
  // ==========================================================
  async function editEvent(id) {
    const res = await fetch(
      `${API_BASE}/events?email=${encodeURIComponent(email)}`
    );
    const events = await res.json();
    const ev = events.find((x) => String(x.id) === String(id));

    modalTitle.innerText = "Edit Event";

    const allowMIT = isMIT;

    modalContent.innerHTML = `
      <input type="text" id="editTitle" value="${ev.title}">
      <input type="date" id="editDate" value="${ev.date}">
      <input type="time" id="editTime" value="${ev.time}">
      <input type="text" id="editVenue" value="${ev.venue}">
      <textarea id="editDescription">${ev.description}</textarea>
      <input type="text" id="editImage" value="${ev.image_url}">

      <label>Visibility</label>
      ${visibilityPills(ev.visibility, allowMIT, "edit_")}

      <button id="updateEvent" class="btn small" style="margin-top:10px;">Save Changes</button>
    `;
    showModal();

    activatePills("edit_", allowMIT);

    document.getElementById("updateEvent").onclick = async () => {
      let visibility = document.getElementById("edit_visibility").value;
      if (!isMIT) visibility = "public";

      const updated = {
        title: document.getElementById("editTitle").value.trim(),
        date: document.getElementById("editDate").value,
        time: document.getElementById("editTime").value,
        venue: document.getElementById("editVenue").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        image_url: document.getElementById("editImage").value.trim(),
        visibility,
        user_id,
        email,
      };

      await fetch(`${API_BASE}/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      hideModal();
      loadEvents();
    };
  }

  // ==========================================================
  // SHOW EVENT DETAILS
  // ==========================================================
  async function showEvent(id) {
    const res = await fetch(
      `${API_BASE}/events?email=${encodeURIComponent(email)}`
    );
    const events = await res.json();
    const ev = events.find((x) => String(x.id) === String(id));

    const guestRes = await fetch(`${API_BASE}/guests`);
    const allGuests = await guestRes.json();
    const list = allGuests.filter((g) => String(g.event_id) === String(id));

    const going = list.filter((g) => g.status === "Going").length;
    const maybe = list.filter((g) => g.status === "Maybe").length;
    const notGoing = list.filter((g) => g.status === "Not Going").length;

    modalTitle.innerText = ev.title;
    modalContent.innerHTML = `
      <p><strong>Date:</strong> ${ev.date} ${ev.time}</p>
      <p><strong>Venue:</strong> ${ev.venue}</p>
      <p>${ev.description}</p>

      <div class="stats-box">
        <p><strong>Going:</strong> ${going}</p>
        <p><strong>Maybe:</strong> ${maybe}</p>
        <p><strong>Not Going:</strong> ${notGoing}</p>
        <p><strong>Visibility:</strong> ${ev.visibility}</p>
      </div>

      <img src="${ev.image_url}" style="width:100%;border-radius:8px;margin-top:15px;">
    `;
    showModal();
  }

  // ==========================================================
  // RSVP
  // ==========================================================
  async function openRSVP(eventId) {
    modalTitle.innerText = "RSVP Confirmation";
    modalContent.innerHTML = `
      <input id="guestName" placeholder="Your name" style="width:100%;margin-bottom:12px">
      <div class="rsvp-buttons">
        <button class="rsvp-btn" id="btnGoing">Going</button>
        <button class="rsvp-btn" id="btnMaybe">Maybe</button>
        <button class="rsvp-btn" id="btnNotGoing">Not Going</button>
      </div>
      <button id="confirmRSVP" class="btn small">Confirm & Generate QR</button>
      <div id="qrArea" style="text-align:center;margin-top:10px"></div>
    `;
    showModal();

    let selectedStatus = "Going";

    function setActive(s) {
      selectedStatus = s;
      document
        .querySelectorAll(".rsvp-btn")
        .forEach((b) => b.classList.remove("active"));
      document.getElementById(`btn${s.replace(" ", "")}`).classList.add("active");
    }

    document.getElementById("btnGoing").onclick = () => setActive("Going");
    document.getElementById("btnMaybe").onclick = () => setActive("Maybe");
    document.getElementById("btnNotGoing").onclick = () => setActive("Not Going");

    setActive("Going");

    document.getElementById("confirmRSVP").onclick = async () => {
      const name = document.getElementById("guestName").value.trim();
      if (!name) return alert("Enter your name!");

      const res = await fetch(`${API_BASE}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          name,
          status: selectedStatus,
        }),
      });

      const data = await res.json();

      document.getElementById("qrArea").innerHTML = `
        <p><strong>Scan this QR at entry:</strong></p>
        <img src="${data.qr_image}" class="qr-image">
      `;
    };
  }

  // ==========================================================
  // VIEW GUESTS
  // ==========================================================
  async function viewGuests(eventId) {
    const res = await fetch(`${API_BASE}/guests`);
    const guests = await res.json();
    const list = guests.filter((g) => String(g.event_id) === String(eventId));

    modalTitle.innerText = "Guest List";
    if (!list.length) {
      modalContent.innerHTML = `<p>No RSVPs yet.</p>`;
      showModal();
      return;
    }

    modalContent.innerHTML = `
      <div class="guest-list">
        ${list
          .map(
            (g) => `
          <div class="guest-item">
            <strong>${g.name}</strong>
            <span style="color:${
              g.status === "Going"
                ? "#48ff7b"
                : g.status === "Maybe"
                ? "#fcd34d"
                : "#f87171"
            };">• ${g.status}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    showModal();
  }

  // ==========================================================
  // DELETE EVENT
  // ==========================================================
  async function deleteEvent(id) {
    if (!confirm("Delete this event?")) return;

    await fetch(`${API_BASE}/events/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });

    loadEvents();
  }

  // ==========================================================
  // ALL EVENTS (SIDEBAR)
  // ==========================================================
  guestListBtn.addEventListener("click", async () => {
    const res = await fetch(
      `${API_BASE}/events?email=${encodeURIComponent(email)}`
    );
    const events = await res.json();

    modalTitle.innerText = "All Events";
    modalContent.innerHTML = events
      .map(
        (e) => `
      <div class="event-item" data-id="${e.id}">
        <img src="${e.image_url}">
        <div class="event-info">
          <h4>${e.title}</h4>
          <p>${e.description}</p>
        </div>
      </div>
    `
      )
      .join("");

    showModal();

    document.querySelectorAll(".event-item").forEach((item) =>
      item.addEventListener("click", () => viewGuests(item.dataset.id))
    );
  });

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================
  closeModal.onclick = hideModal;
  window.onclick = (e) => {
    if (e.target === modal) hideModal();
  };

  loadEvents();
});
