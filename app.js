const tutors = [
  {
    id: "a",
    name: "Tutor A",
    subjects: ["Math"],
    grades: "K–5",
    min: 0,
    max: 5,
    rate: 40,
    days: [1, 3, 5],
    times: [15, 16, 17],
    availability: "Mon, Wed & Fri",
    hours: "3–6 pm",
    bio: "Patient guidance that makes big ideas feel a little smaller.",
    approach:
      "Building a strong foundation with hands-on practice, plenty of encouragement, and a pace that feels right for your child.",
  },
  {
    id: "b",
    name: "Tutor B",
    subjects: ["Math", "Science"],
    grades: "6–12",
    min: 6,
    max: 12,
    rate: 55,
    days: [2, 4],
    times: [16, 17, 18],
    availability: "Tue & Thu",
    hours: "4–7 pm",
    bio: "Turning tricky questions into those “I get it!” moments.",
    approach:
      "Working through problems together, connecting concepts to everyday life, and helping students become independent thinkers.",
  },
  {
    id: "c",
    name: "Tutor C",
    subjects: ["English"],
    grades: "K–8",
    min: 0,
    max: 8,
    rate: 45,
    days: [1, 2, 4],
    times: [15, 16, 17],
    availability: "Mon, Tue & Thu",
    hours: "3–6 pm",
    bio: "Helping young readers and writers find their own voice.",
    approach:
      "A welcoming space to practice reading, explore stories, and build writing skills through thoughtful, encouraging feedback.",
  },
  {
    id: "d",
    name: "Tutor D",
    subjects: ["Science", "Math"],
    grades: "6–12",
    min: 6,
    max: 12,
    rate: 50,
    days: [3, 5, 6],
    times: [10, 11, 12],
    availability: "Wed, Fri & Sat",
    hours: "10 am–1 pm",
    bio: "A curious mind, a clear explanation, and room to ask why.",
    approach:
      "Making science and math approachable with visual explanations, practical examples, and time to explore each question.",
  },
  {
    id: "e",
    name: "Tutor E",
    subjects: ["English", "Math"],
    grades: "K–5",
    min: 0,
    max: 5,
    rate: 40,
    days: [1, 3, 6],
    times: [14, 15, 16],
    availability: "Mon, Wed & Sat",
    hours: "2–5 pm",
    bio: "Small steps and steady encouragement for growing learners.",
    approach:
      "Balancing playful learning with purposeful practice to help younger students feel comfortable, capable, and ready for school.",
  },
  {
    id: "f",
    name: "Tutor F",
    subjects: ["English"],
    grades: "6–12",
    min: 6,
    max: 12,
    rate: 50,
    days: [2, 4, 6],
    times: [15, 16, 17],
    availability: "Tue, Thu & Sat",
    hours: "3–6 pm",
    bio: "From a blank page to a new sense of confidence.",
    approach:
      "Helping students organize their ideas, read with understanding, and develop writing they feel proud to share.",
  },
];
const page = document.body.dataset.page;
const track = (event, properties = {}) => {
  try {
    window.ABCAnalytics?.track(event, properties);
  } catch {
    /* Optional analytics. */
  }
};
const tutorAnalytics = (tutor) => ({
  tutor_id: tutor.id,
  tutor_name: tutor.name,
});
const storageKey = "abc-tutoring-preview-bookings-v1";
const localZone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseDate = (key) => new Date(`${key}T12:00:00`);
const dateLabel = (key) =>
  parseDate(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const timeLabel = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
const sessionDate = (booking) =>
  new Date(`${booking.date}T${String(booking.hour).padStart(2, "0")}:00:00`);
const tutorFor = (id) => tutors.find((tutor) => tutor.id === id) || tutors[0];
const avatar = (tutor, extra = "") =>
  `<div class="portrait portrait-${tutors.indexOf(tutor)} avatar ${extra}" role="img" aria-label="Sample portrait for ${tutor.name}"></div>`;
const tags = (tutor) =>
  tutor.subjects
    .map(
      (subject) =>
        `<span class="tag ${subject === "English" ? "peach" : subject === "Science" ? "blue" : ""}">${subject}</span>`,
    )
    .join("");
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
function loadBookings() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value)
      ? value.filter(
          (b) =>
            b &&
            typeof b.id === "string" &&
            tutors.some((t) => t.id === b.tutor) &&
            /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
            Number.isInteger(b.hour) &&
            b.hour >= 0 &&
            b.hour < 24 &&
            ["parent", "email", "student", "grade", "subject"].every(
              (key) => typeof b[key] === "string",
            ),
        )
      : [];
  } catch {
    return [];
  }
}
function header() {
  return `<header class="site-header"><a class="brand" href="index.html" aria-label="ABC Tutoring home"><span class="brand-mark"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 5.5c3-1 6-.5 9 1.5 3-2 6-2.5 9-1.5v13c-3-1-6-.5-9 1.5-3-2-6-2.5-9-1.5v-13Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 7v13M6 9l3 1M15 10l3-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>ABC Tutoring${page === "admin" ? '<span class="admin-brand-label">Dana’s workspace</span>' : ""}</a><nav class="navigation" aria-label="Main navigation">${page === "admin" ? '<a class="nav-link" href="index.html">View website <span aria-hidden="true">↗</span></a><span class="pill">Staff page preview</span>' : `<a class="nav-link ${page === "home" ? "active" : ""}" ${page === "home" ? 'aria-current="page"' : ""} href="index.html">Home</a><a class="nav-link ${page === "tutors" ? "active" : ""}" ${page === "tutors" ? 'aria-current="page"' : ""} href="tutors.html">Our tutors</a><a class="button small" ${page === "booking" ? 'aria-current="page"' : ""} href="booking.html">Book a session <span aria-hidden="true">↗</span></a>`}</nav></header>`;
}
function footer() {
  return `<footer class="site-footer"><span>© ${new Date().getFullYear()} ABC Tutoring. Room to learn. Space to grow.</span><span class="footer-note"><span class="little-flower" aria-hidden="true">✳</span> A little support goes a long way.</span></footer>`;
}
function home() {
  return `<main id="main"><section class="home-hero"><div class="hero-copy"><div class="eyebrow">Small steps. Brighter futures.</div><h1>A little support.<br>A lot of<br><em>possibility.</em></h1><p class="hero-description">Learning feels better with someone in your corner. Friendly, one-to-one tutoring in math, English, and science, helping students in grades K–12 find their confidence.</p><div class="hero-actions"><a class="button" href="tutors.html">Meet our tutors ${arrow}</a><a class="button secondary" href="booking.html">Book a session <span class="arrow" aria-hidden="true">→</span></a></div><p class="hero-smallprint"><span><span class="check">✓</span> One student. One tutor.</span><span><span class="check">✓</span> No account needed</span></p></div><div class="hero-art" aria-label="A few of the friendly faces on our sample tutor team"><div class="art-backdrop"></div><div class="portrait portrait-0 hero-photo first" role="img" aria-label="Sample tutor portrait"></div><div class="portrait portrait-1 hero-photo second" role="img" aria-label="Sample tutor portrait"></div><div class="portrait portrait-2 hero-photo third" role="img" aria-label="Sample tutor portrait"></div><span class="sparkle" aria-hidden="true">✳</span><span class="scribble" aria-hidden="true">↝</span><div class="floating-note top"><span class="note-icon orange" aria-hidden="true">☀</span><div><strong>Confidence starts here.</strong><small>One little breakthrough at a time.</small></div></div><div class="floating-note bottom"><span class="note-icon" aria-hidden="true">✓</span><div><strong>Their pace. Their potential.</strong><small>Support that meets them where they are.</small></div></div></div></section><section class="home-bottom" aria-label="How we help"><div><h3>A helping hand, in every subject.</h3><div class="subject-tags"><span class="tag">Math</span><span class="tag peach">English</span><span class="tag blue">Science</span></div></div><div><h3>Made for your learner.</h3><p>Personal attention for grades K–12, with one-hour sessions built around your child.</p></div><div><h3>Simple from the very first step.</h3><p>Find a tutor, choose an available time, and book. We’ll take it from there.</p></div></section></main>`;
}
function tutorCard(tutor) {
  return `<article class="tutor-card"><div class="card-top">${avatar(tutor)}<div><h3>${tutor.name}</h3><p>Grades ${tutor.grades}</p></div></div><div class="card-content"><div class="subject-tags">${tags(tutor)}</div><p class="card-description">${tutor.bio}</p><div class="card-meta"><div class="rate">$${tutor.rate}<span> / hour</span></div><div class="availability"><strong>${tutor.availability}</strong>${tutor.hours}</div></div><div class="card-actions"><button class="button secondary" data-profile="${tutor.id}" aria-label="Meet ${tutor.name}">Meet ${tutor.name}</button><a class="button" href="booking.html?tutor=${tutor.id}" aria-label="Book a session with ${tutor.name}">Book a session <span aria-hidden="true">↗</span></a></div></div></article>`;
}
function tutorsPage() {
  return `<main id="main"><section class="page-heading heading-row"><div><div class="eyebrow">Good people. Great support.</div><h1>Find their kind of tutor.</h1><p>A little patience, a fresh perspective, and someone who’s rooting for them.<br>Meet the people who help learning click.</p></div><span class="pill">✳ &nbsp; One-to-one · One hour</span></section><div class="prototype-note"><span aria-hidden="true">ⓘ</span><span><strong>Meet our sample team.</strong> Names, subjects, grades, rates, and schedules are placeholders for this preview. Times shown in ${escapeHTML(localZone)}.</span></div><div class="filters"><div class="filter-buttons" role="group" aria-label="Filter by subject">${["All subjects", "Math", "English", "Science"].map((subject, index) => `<button class="filter-button ${!index ? "active" : ""}" data-subject="${index ? subject : ""}" aria-pressed="${!index}">${subject}</button>`).join("")}</div><label class="grade-filter">Grade level <select id="grade-filter"><option value="all">All grades</option><option value="elementary">Elementary · K–5</option><option value="middle">Middle · 6–8</option><option value="high">High school · 9–12</option></select></label></div><p id="tutor-count" class="field-hint" role="status" style="margin:0 0 14px">6 tutors to get to know</p><div class="tutor-grid" id="tutor-grid">${tutors.map(tutorCard).join("")}</div><div class="help-strip"><div><h3>A good match makes all the difference.</h3><p>Choose a tutor, take a look at their times, and find what works for your family.</p></div><a class="button secondary" href="booking.html">Find a time <span aria-hidden="true">→</span></a></div></main><dialog class="profile-dialog" id="profile-dialog" aria-labelledby="profile-name"></dialog>`;
}
function setupTutors() {
  let subject = "",
    grade = "all";
  const render = () => {
    const result = tutors.filter(
      (t) =>
        (!subject || t.subjects.includes(subject)) &&
        (grade === "all" ||
          (grade === "elementary" && t.min <= 5) ||
          (grade === "middle" && t.min <= 8 && t.max >= 6) ||
          (grade === "high" && t.max >= 9)),
    );
    document.querySelector("#tutor-grid").innerHTML = result.length
      ? result.map(tutorCard).join("")
      : '<div class="empty-state"><h3>No tutors match just yet.</h3><p>Try another subject or choose “All grades” to see more of our sample team.</p></div>';
    document.querySelector("#tutor-count").textContent =
      `${result.length} tutor${result.length !== 1 ? "s" : ""} to get to know`;
  };
  document.querySelectorAll("[data-subject]").forEach((button) =>
    button.addEventListener("click", () => {
      subject = button.dataset.subject;
      document.querySelectorAll("[data-subject]").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", b === button);
      });
      render();
      track("tutor_filters_changed", {
        subject_filter: subject || "all",
        grade_filter: grade,
      });
    }),
  );
  document
    .querySelector("#grade-filter")
    .addEventListener("change", (event) => {
      grade = event.target.value;
      render();
      track("tutor_filters_changed", {
        subject_filter: subject || "all",
        grade_filter: grade,
      });
    });
  document.querySelector("#tutor-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile]");
    if (!button) return;
    const tutor = tutorFor(button.dataset.profile);
    const dialog = document.querySelector("#profile-dialog");
    dialog.innerHTML = `<button class="icon-button dialog-close" aria-label="Close tutor profile">×</button>${avatar(tutor)}<div class="eyebrow">A little about your tutor</div><h2 id="profile-name">${tutor.name}</h2><div class="subject-tags">${tags(tutor)}</div><p>${tutor.approach}</p><dl><div><dt>Grade levels</dt><dd>${tutor.grades}</dd></div><div><dt>Hourly rate</dt><dd>$${tutor.rate} / hour</dd></div><div><dt>Sample availability</dt><dd>${tutor.availability}<br>${tutor.hours}</dd></div></dl><p class="field-hint">Sample profile · Times in ${escapeHTML(localZone)}</p><a class="button" href="booking.html?tutor=${tutor.id}">Book with ${tutor.name} ${arrow}</a>`;
    dialog
      .querySelector(".dialog-close")
      .addEventListener("click", () => dialog.close());
    dialog.showModal();
    track("tutor_profile_viewed", tutorAnalytics(tutor));
  });
}
function bookingPage() {
  return `<main id="main"><section class="page-heading"><div class="eyebrow">A good next step.</div><h1>Let’s make time for learning.</h1><p>Pick a tutor and a time that works. We’ll keep the rest simple.</p></section><div class="prototype-note"><span aria-hidden="true">ⓘ</span><span><strong>Try a practice booking.</strong> Use made-up details. This preview saves only in this browser; it doesn’t reserve a real session or send emails.</span></div><div class="booking-layout"><form id="booking-form" class="panel"><section class="booking-step"><div class="step-heading"><span class="step-number">1</span><h2>Choose your tutor</h2></div><label><span class="field-label">Tutor</span><select name="tutor" id="tutor-select">${tutors.map((t) => `<option value="${t.id}">${t.name} · ${t.subjects.join(" & ")} · $${t.rate}/hour</option>`).join("")}</select></label></section><section class="booking-step"><div class="step-heading"><span class="step-number">2</span><h2>Find a time that fits</h2></div><p class="field-hint" id="schedule-hint"></p><div class="calendar-time"><div><div class="calendar-title"><span id="calendar-month" aria-live="polite"></span><div class="calendar-nav"><button class="icon-button" type="button" id="previous-month" aria-label="Previous month">‹</button><button class="icon-button" type="button" id="next-month" aria-label="Next month">›</button></div></div><div class="calendar-grid" id="calendar" role="group" aria-label="Choose a session date"></div></div><div><p class="time-title" id="time-title"></p><p class="timezone">One-hour sessions · ${escapeHTML(localZone)}</p><div class="time-slots" id="time-slots" role="group" aria-label="Available session times"></div></div></div></section><section class="booking-step"><div class="step-heading"><span class="step-number">3</span><h2>A little about your family</h2></div><div class="form-grid"><label><span class="field-label">Parent’s name</span><input name="parent" required maxlength="100" autocomplete="name" placeholder="e.g. Alex Taylor"></label><label><span class="field-label">Parent’s email</span><input type="email" name="email" required maxlength="200" autocomplete="email" placeholder="alex@example.com"></label><label><span class="field-label">Student’s first name</span><input name="student" required maxlength="60" placeholder="e.g. Sam"></label><label><span class="field-label">Student’s grade</span><select name="grade" id="student-grade" required></select></label><label class="wide"><span class="field-label">Subject</span><select name="subject" id="booking-subject" required></select></label></div><div class="form-bottom"><button class="button" type="submit">Book session <span aria-hidden="true">→</span></button><p>No account needed. All fields are required.</p><div class="form-error" id="booking-error" role="alert"></div></div></section></form><aside class="panel summary" id="booking-summary" aria-label="Your session summary" aria-live="polite"></aside></div></main>`;
}
function availableHours(tutor, key) {
  const date = parseDate(key);
  if (!tutor.days.includes(date.getDay())) return [];
  const bookings = loadBookings();
  return tutor.times.filter(
    (hour) =>
      sessionDate({ date: key, hour }) > new Date() &&
      !bookings.some(
        (b) => b.tutor === tutor.id && b.date === key && b.hour === hour,
      ),
  );
}
function setupBooking() {
  let tutor = tutorFor(new URLSearchParams(location.search).get("tutor")),
    selectedDate = null,
    selectedHour = null;
  let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const form = document.querySelector("#booking-form");
  const tutorSelect = document.querySelector("#tutor-select");
  tutorSelect.value = tutor.id;
  const attemptId = crypto.randomUUID();
  let bookingStarted = false;
  const bookingProperties = () => ({
    ...tutorAnalytics(tutor),
    booking_attempt_id: attemptId,
  });
  function startBooking() {
    if (bookingStarted) return;
    bookingStarted = true;
    track("booking_started", bookingProperties());
  }
  form.addEventListener("input", (event) => {
    if (event.target !== tutorSelect) startBooking();
  });
  let nativeValidationReported = false;
  form.addEventListener(
    "invalid",
    () => {
      startBooking();
      if (nativeValidationReported) return;
      nativeValidationReported = true;
      track("booking_validation_failed", {
        ...bookingProperties(),
        reason: "invalid_required_details",
      });
      setTimeout(() => {
        nativeValidationReported = false;
      }, 0);
    },
    true,
  );
  function updateSummary() {
    document.querySelector("#booking-summary").innerHTML =
      `<h2>Your little step forward</h2><div class="summary-tutor">${avatar(tutor)}<div><h3>${tutor.name}</h3><p>${tutor.subjects.join(" & ")} · Grades ${tutor.grades}</p></div></div><dl><div><dt>Date</dt><dd>${selectedDate ? dateLabel(selectedDate) : "Choose a date"}</dd></div><div><dt>Time</dt><dd>${selectedHour !== null ? timeLabel(selectedHour) : "Choose a time"}</dd></div><div><dt>Duration</dt><dd>1 hour</dd></div><div class="total"><dt>Session rate</dt><dd>$${tutor.rate}</dd></div></dl><p class="field-hint">Sample rate · No payment collected</p><p class="summary-tip"><strong>Learning starts with feeling comfortable.</strong>A whole hour of individual attention, at a pace that works for your child.</p>`;
  }
  function renderTimes() {
    document.querySelector("#time-title").textContent = selectedDate
      ? parseDate(selectedDate).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "Choose a date to see times";
    const hours = selectedDate ? availableHours(tutor, selectedDate) : [];
    document.querySelector("#time-slots").innerHTML = hours.length
      ? hours
          .map(
            (hour) =>
              `<button type="button" class="time-slot ${hour === selectedHour ? "selected" : ""}" data-hour="${hour}" aria-pressed="${hour === selectedHour}">${timeLabel(hour)}</button>`,
          )
          .join("")
      : `<p class="no-slots">${selectedDate ? "No times left on this date. Try another available day." : "Available days are highlighted in the calendar. Pick one to get started."}</p>`;
    updateSummary();
  }
  function renderCalendar() {
    document.querySelector("#calendar-month").textContent =
      month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const now = new Date();
    document.querySelector("#previous-month").disabled =
      month <= new Date(now.getFullYear(), now.getMonth(), 1);
    const days = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    let content = ["S", "M", "T", "W", "T", "F", "S"]
      .map((day) => `<span class="weekday" aria-hidden="true">${day}</span>`)
      .join("");
    content += '<span aria-hidden="true"></span>'.repeat(month.getDay());
    for (let day = 1; day <= days; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day),
        key = dateKey(date),
        available = availableHours(tutor, key).length > 0;
      content += `<button type="button" class="calendar-day ${key === selectedDate ? "selected" : ""} ${key === dateKey(now) ? "today" : ""}" data-date="${key}" aria-label="${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${available ? "" : ", unavailable"}" aria-pressed="${key === selectedDate}" ${available ? "" : "disabled"}>${day}</button>`;
    }
    document.querySelector("#calendar").innerHTML = content;
    renderTimes();
  }
  function updateTutor() {
    selectedHour = null;
    selectedDate = null;
    const previousSubject = document.querySelector("#booking-subject").value,
      previousGrade = document.querySelector("#student-grade").value;
    document.querySelector("#booking-subject").innerHTML = tutor.subjects
      .map((subject) => `<option>${subject}</option>`)
      .join("");
    if (tutor.subjects.includes(previousSubject))
      document.querySelector("#booking-subject").value = previousSubject;
    document.querySelector("#student-grade").innerHTML =
      '<option value="">Choose a grade</option>' +
      Array.from({ length: tutor.max - tutor.min + 1 }, (_, i) => {
        const grade = tutor.min + i;
        return `<option value="${grade}">${grade === 0 ? "Kindergarten" : `Grade ${grade}`}</option>`;
      }).join("");
    if (
      previousGrade !== "" &&
      Number(previousGrade) >= tutor.min &&
      Number(previousGrade) <= tutor.max
    )
      document.querySelector("#student-grade").value = previousGrade;
    document.querySelector("#schedule-hint").textContent =
      `${tutor.name}’s sample schedule: ${tutor.availability}, ${tutor.hours}. Select any available future date.`;
    document.querySelector("#booking-error").textContent = "";
    renderCalendar();
  }
  tutorSelect.addEventListener("change", () => {
    tutor = tutorFor(tutorSelect.value);
    startBooking();
    updateTutor();
    track("booking_tutor_viewed", {
      ...tutorAnalytics(tutor),
      trigger: "tutor_change",
    });
  });
  document.querySelector("#calendar").addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button || button.disabled) return;
    startBooking();
    selectedDate = button.dataset.date;
    selectedHour = null;
    document.querySelector("#booking-error").textContent = "";
    renderCalendar();
    document.querySelector(`[data-date="${selectedDate}"]`).focus();
  });
  document.querySelector("#time-slots").addEventListener("click", (event) => {
    const button = event.target.closest("[data-hour]");
    if (!button) return;
    selectedHour = Number(button.dataset.hour);
    startBooking();
    track("booking_time_selected", {
      ...bookingProperties(),
      session_duration_minutes: 60,
    });
    document.querySelector("#booking-error").textContent = "";
    renderTimes();
    document.querySelector(`[data-hour="${selectedHour}"]`).focus();
  });
  document.querySelector("#previous-month").addEventListener("click", () => {
    month = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    selectedDate = null;
    selectedHour = null;
    renderCalendar();
  });
  document.querySelector("#next-month").addEventListener("click", () => {
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    selectedDate = null;
    selectedHour = null;
    renderCalendar();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    startBooking();
    track("booking_submitted", bookingProperties());
    const error = document.querySelector("#booking-error");
    if (!selectedDate || selectedHour === null) {
      error.textContent = "Choose an available date and time before booking.";
      track("booking_validation_failed", {
        ...bookingProperties(),
        reason: "missing_slot",
      });
      document
        .querySelector("#calendar")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!availableHours(tutor, selectedDate).includes(selectedHour)) {
      track("booking_validation_failed", {
        ...bookingProperties(),
        reason: "slot_unavailable",
      });
      error.textContent =
        "That time is no longer available. Please choose another time.";
      selectedHour = null;
      renderCalendar();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    for (const key of ["parent", "student", "email"]) {
      data[key] = data[key].trim();
      if (!data[key]) {
        track("booking_validation_failed", {
          ...bookingProperties(),
          reason: "missing_required_details",
        });
        error.textContent =
          "Please complete your name, email, and student’s first name.";
        form.elements[key].focus();
        return;
      }
    }
    const booking = {
      ...data,
      id: crypto.randomUUID(),
      date: selectedDate,
      hour: selectedHour,
    };
    try {
      const bookings = loadBookings();
      bookings.push(booking);
      localStorage.setItem(storageKey, JSON.stringify(bookings));
    } catch {
      error.textContent =
        "Your browser couldn’t save this practice booking. Enable local storage and try again.";
      track("booking_validation_failed", {
        ...bookingProperties(),
        reason: "browser_storage_unavailable",
      });
      return;
    }
    track("booking_completed", {
      ...bookingProperties(),
      subject: data.subject,
      session_duration_minutes: 60,
    });
    document.querySelector("#main").innerHTML =
      `<section class="panel success-panel"><div class="success-icon" aria-hidden="true">✓</div><div class="eyebrow" style="justify-content:center">A little step forward</div><h1 tabindex="-1">Your practice booking is saved.</h1><p>You’ve tried the booking flow from start to finish.<br>Here’s what the session would look like.</p><div class="success-details"><strong>${escapeHTML(data.student)} + ${tutor.name}</strong><p>${escapeHTML(data.subject)} · ${data.grade === "0" ? "Kindergarten" : `Grade ${escapeHTML(data.grade)}`}</p><p>${dateLabel(selectedDate)} · ${timeLabel(selectedHour)}–${timeLabel(selectedHour + 1)}</p><p>${escapeHTML(localZone)} · 1 hour · $${tutor.rate}</p><p>Parent: ${escapeHTML(data.parent)} · ${escapeHTML(data.email)}</p></div><div class="prototype-note">This is a preview, not a real reservation. No emails were sent. Your practice booking is available in Dana’s preview on this browser.</div><div class="hero-actions"><a class="button" href="tutors.html">Back to our tutors</a><a class="button secondary" href="booking.html">Try another booking</a></div></section>`;
    document.querySelector("h1").focus();
    window.scrollTo(0, 0);
  });
  updateTutor();
  track("booking_tutor_viewed", {
    ...tutorAnalytics(tutor),
    trigger: "page_load",
  });
}
function sampleBookings() {
  const people = [
    ["Jamie Morgan", "Riley", "a", "Math", "3"],
    ["Alex Parker", "Noah", "b", "Science", "9"],
    ["Jordan Reed", "Avery", "c", "English", "5"],
    ["Casey Chen", "Leo", "d", "Science", "10"],
    ["Morgan Davis", "Mia", "e", "Math", "2"],
    ["Taylor Ellis", "Oliver", "f", "English", "11"],
  ];
  return people.map(([parent, student, tutor, subject, grade], i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i < 4 ? i + 1 : -i));
    const t = tutorFor(tutor);
    while (!t.days.includes(date.getDay()))
      date.setDate(date.getDate() + (i < 4 ? 1 : -1));
    return {
      id: `sample-${i}`,
      parent,
      student,
      tutor,
      subject,
      grade,
      date: dateKey(date),
      hour: t.times[0],
      email: `${parent.toLowerCase().replace(" ", ".")}@example.com`,
      sample: true,
    };
  });
}
function adminPage() {
  return `<main id="main"><section class="page-heading heading-row"><div><div class="eyebrow">A little more organized.</div><h1>Your bookings, all together.</h1><p>A clear view of who’s learning, with whom, and when.</p></div><span class="pill">✳ &nbsp; Hello, Dana</span></section><div class="prototype-note"><span aria-hidden="true">ⓘ</span><span><strong>Staff page preview · Not private yet.</strong> This page shows six sample bookings and practice bookings saved in this browser. Use made-up information only.</span></div><div class="stats" id="booking-stats"></div><section class="panel admin-panel" aria-label="Search and view bookings"><form id="admin-search" class="admin-search"><label><span class="field-label">Search by</span><select id="search-field"><option value="all">All fields</option><option value="parent">Parent name</option><option value="student">Student name</option><option value="tutor">Tutor</option><option value="subject">Subject</option><option value="date">Date</option></select></label><label><span class="field-label">Search bookings</span><input id="search-term" type="search" placeholder="Try a name, subject, or date…"></label><button class="button" type="submit">Search <span aria-hidden="true">→</span></button><button class="button secondary" type="button" id="clear-search">Clear</button></form><div class="table-top"><h2>All bookings</h2><span id="booking-count" role="status"></span></div><div class="table-wrap"><table><caption class="field-hint" style="text-align:left;margin-bottom:10px">Session times in ${escapeHTML(localZone)} · Sample and practice data</caption><thead><tr><th scope="col">Student</th><th scope="col">Parent / email</th><th scope="col">Tutor</th><th scope="col">Subject</th><th scope="col">Date & time</th><th scope="col">Status</th></tr></thead><tbody id="booking-rows"></tbody></table></div><div class="admin-bottom">Bookings are shown by session date, newest first. <button class="text-button" id="reset-practice" type="button">Clear practice bookings</button><span id="admin-feedback" role="status"></span></div></section></main><dialog class="profile-dialog" id="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">Clear practice bookings?</h2><p>This removes practice bookings from this browser and frees their sample time slots. The six example rows will stay.</p><div class="hero-actions"><button class="button secondary" id="cancel-reset">Keep bookings</button><button class="button" id="confirm-reset">Clear practice bookings</button></div></dialog>`;
}
function setupAdmin() {
  let query = "",
    field = "all";
  function render() {
    const all = [...sampleBookings(), ...loadBookings()],
      now = new Date();
    document.querySelector("#booking-stats").innerHTML =
      `<div class="stat"><span>Total bookings</span><strong>${all.length}</strong><small>Sample + practice</small></div><div class="stat"><span>Upcoming sessions</span><strong>${all.filter((b) => sessionDate(b) > now).length}</strong><small>Time to look forward to</small></div><div class="stat"><span>Our tutor team</span><strong>6</strong><small>Helping learners grow</small></div>`;
    const rows = all
      .filter((b) => {
        const fields = {
          parent: b.parent,
          student: b.student,
          tutor: tutorFor(b.tutor).name,
          subject: b.subject,
          date: `${b.date} ${dateLabel(b.date)}`,
        };
        return (
          field === "all" ? Object.values(fields).join(" ") : fields[field]
        )
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => sessionDate(b) - sessionDate(a));
    document.querySelector("#booking-count").textContent =
      `${rows.length} of ${all.length} bookings`;
    document.querySelector("#booking-rows").innerHTML = rows.length
      ? rows
          .map(
            (b) =>
              `<tr><td><strong>${escapeHTML(b.student)}</strong><small>${b.grade === "0" ? "Kindergarten" : `Grade ${escapeHTML(b.grade)}`} · ${b.sample ? "Sample" : "Practice"}</small></td><td><strong>${escapeHTML(b.parent)}</strong><small>${escapeHTML(b.email)}</small></td><td>${tutorFor(b.tutor).name}</td><td>${escapeHTML(b.subject)}</td><td><strong>${dateLabel(b.date)}</strong><small>${timeLabel(b.hour)}–${timeLabel(b.hour + 1)}</small></td><td><span class="status ${sessionDate(b) < now ? "past" : ""}">${sessionDate(b) < now ? "Past" : "Upcoming"}</span></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="6"><div class="empty-state"><h3>No matching bookings</h3><p>Try another search term, or clear your search to see all bookings.</p></div></td></tr>';
  }
  document
    .querySelector("#admin-search")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      query = document.querySelector("#search-term").value.trim().toLowerCase();
      field = document.querySelector("#search-field").value;
      render();
    });
  document.querySelector("#clear-search").addEventListener("click", () => {
    document.querySelector("#admin-search").reset();
    query = "";
    field = "all";
    render();
  });
  document
    .querySelector("#search-field")
    .addEventListener("change", (event) => {
      document.querySelector("#search-term").placeholder =
        event.target.value === "date"
          ? "e.g. 2026-09-10 or Sep 10"
          : "Try a name, subject, or date…";
    });
  const dialog = document.querySelector("#reset-dialog");
  document
    .querySelector("#reset-practice")
    .addEventListener("click", () => dialog.showModal());
  document
    .querySelector("#cancel-reset")
    .addEventListener("click", () => dialog.close());
  document.querySelector("#confirm-reset").addEventListener("click", () => {
    try {
      localStorage.removeItem(storageKey);
      document.querySelector("#admin-feedback").textContent =
        " Practice bookings cleared.";
    } catch {
      document.querySelector("#admin-feedback").textContent =
        " Could not clear browser storage.";
    }
    dialog.close();
    render();
  });
  window.addEventListener("storage", render);
  render();
}
document.querySelector("#app").innerHTML =
  `<div class="container">${header()}${({ home, tutors: tutorsPage, booking: bookingPage, admin: adminPage }[page] || home)()}${footer()}</div>`;
if (page === "tutors") setupTutors();
if (page === "booking") setupBooking();
if (page === "admin") setupAdmin();
