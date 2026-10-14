window.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = (window.RVSPLY_API_BASE || "http://127.0.0.1:5000").replace(/\/$/, "");
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
  const status = document.getElementById("checkinStatus");
  const details = document.getElementById("checkinDetails");
  const help = document.getElementById("checkinHelp");
  const login = document.getElementById("organizerLogin");
  const confirm = document.getElementById("confirmCheckin");
  let rsvp;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const post = async (path, body) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The check-in service could not complete the request.");
    return data;
  };
  const showCheckedIn = (time, already = false) => {
    const formatted = time ? new Date(time).toLocaleString() : "just now";
    status.textContent = already
      ? `This guest was already checked in at ${formatted}.`
      : `Check-in confirmed at ${formatted}.`;
    status.dataset.state = "success";
    help.textContent = "The RSVP is recorded as attended.";
    confirm.hidden = true;
    login.hidden = true;
  };

  if (!token) {
    status.textContent = "This QR code is missing its RSVP details. Ask the guest to open their latest RSVP QR.";
    status.dataset.state = "error";
    return;
  }

  try {
    rsvp = await post("/checkin/lookup", { token });
    details.innerHTML = `<dl>
      <div><dt>Event</dt><dd>${escapeHtml(rsvp.event_title)}</dd></div>
      <div><dt>Guest</dt><dd>${escapeHtml(rsvp.name)}</dd></div>
      <div><dt>RSVP</dt><dd>${escapeHtml(rsvp.status)}</dd></div>
      <div><dt>When</dt><dd>${escapeHtml(rsvp.event_date || "Date to be announced")}${rsvp.event_time ? ` · ${escapeHtml(rsvp.event_time.slice(0, 5))}` : ""}</dd></div>
      <div><dt>Where</dt><dd>${escapeHtml(rsvp.venue || "Location to be announced")}</dd></div>
    </dl>`;
    details.hidden = false;

    if (rsvp.status === "Not Going") {
      status.textContent = "This RSVP is marked Not Going, so it can’t be checked in.";
      status.dataset.state = "error";
      help.textContent = "The guest must submit a Going or Maybe RSVP to be checked in.";
      return;
    }

    if (rsvp.checked_in_at) {
      showCheckedIn(rsvp.checked_in_at, true);
      return;
    }

    const userId = localStorage.getItem("user_id");
    const loggedIn = localStorage.getItem("loggedIn") === "true" && userId;
    if (!loggedIn || String(userId) !== String(rsvp.created_by)) {
      status.textContent = "RSVP found. The event organizer must sign in to confirm this guest’s arrival.";
      help.textContent = "Show this page to the organizer, or sign in with the account that created the event.";
      login.href = `index.html#return_to=checkin&token=${encodeURIComponent(token)}`;
      login.hidden = false;
      return;
    }

    status.textContent = "RSVP found. Confirm the guest’s arrival to complete check-in.";
    help.textContent = "Only the event organizer can record attendance.";
    confirm.hidden = false;
  } catch (error) {
    status.textContent = error.message || "Could not load this RSVP.";
    status.dataset.state = "error";
  }

  confirm.addEventListener("click", async () => {
    confirm.disabled = true;
    confirm.textContent = "Confirming…";
    status.textContent = "Saving check-in…";
    try {
      const result = await post("/checkin/confirm", {
        token,
        user_id: localStorage.getItem("user_id"),
      });
      showCheckedIn(result.checked_in_at, result.already_checked_in);
    } catch (error) {
      status.textContent = error.message || "Could not confirm check-in.";
      status.dataset.state = "error";
      confirm.disabled = false;
      confirm.textContent = "Confirm check-in";
    }
  });
});
