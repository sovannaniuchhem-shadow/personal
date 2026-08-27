/* ============================================================
   Sovanna CHHEM — Portfolio Scripts
   Vanilla JavaScript, no libraries. All features below:
   1. Theme toggle (dark/light) with localStorage
   2. Scroll progress indicator
   3. Sticky header state
   4. Mobile navigation (hamburger)
   5. Active nav link highlighting
   6. Hero typing animation
   7. Scroll-reveal animations
   8. Skill bar animations
   9. Stat counters
   10. Project filtering
   11. Contact form validation + success message
   12. Back-to-top button
   13. Footer year
   ============================================================ */

"use strict";

/* Respect users who prefer reduced motion */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   1. THEME TOGGLE (dark / light) + localStorage
   ============================================================ */
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;
const THEME_KEY = "sc-portfolio-theme";

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    /* localStorage unavailable (private mode etc.) — theme just won't persist */
  }
  // Keep the toggle accessible: update its label to the action it performs
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
  );
}

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(next);
});

// Initial label
setTheme(root.getAttribute("data-theme") || "dark");

/* ============================================================
   2. SCROLL PROGRESS INDICATOR
   ============================================================ */
const scrollProgress = document.getElementById("scrollProgress");

function updateScrollProgress() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  scrollProgress.style.width = scrolled + "%";
}

/* ============================================================
   3. STICKY HEADER STATE + BACK-TO-TOP VISIBILITY
   ============================================================ */
const header = document.getElementById("header");
const backToTop = document.getElementById("backToTop");

function onScroll() {
  updateScrollProgress();
  header.classList.toggle("scrolled", window.scrollY > 10);
  backToTop.classList.toggle("visible", window.scrollY > 600);
}

window.addEventListener("scroll", onScroll, { passive: true });

/* ============================================================
   4. MOBILE NAVIGATION (hamburger)
   ============================================================ */
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

function closeMobileMenu() {
  navMenu.classList.remove("open");
  navToggle.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation menu");
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
});

// Close the menu when a link is chosen (mobile UX)
navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

// Close the menu when clicking outside of it
document.addEventListener("click", (e) => {
  if (
    navMenu.classList.contains("open") &&
    !navMenu.contains(e.target) &&
    !navToggle.contains(e.target)
  ) {
    closeMobileMenu();
  }
});

// Close the menu when resizing back to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeMobileMenu();
});

/* ============================================================
   5. ACTIVE NAV LINK (IntersectionObserver)
   ============================================================ */
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section[id]");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + id);
      });
    });
  },
  // Watch the middle band of the viewport so the "current" section is obvious
  { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
);

sections.forEach((section) => sectionObserver.observe(section));

/* ============================================================
   6. HERO TYPING ANIMATION
   ============================================================ */
const typedText = document.getElementById("typedText");

// EDIT: add or remove roles shown by the typing animation
const roles = [
  "Full-Stack Web Developer",
  "Frontend Developer",
  "Backend Developer",
  "JavaScript Developer",
];

if (prefersReducedMotion) {
  // Static text for reduced-motion users — no animation
  typedText.textContent = roles[0];
} else {
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;
  const TYPE_SPEED = 65;   // ms per keystroke while typing
  const DELETE_SPEED = 35; // ms per keystroke while deleting
  const HOLD_TIME = 2000;  // ms to display the full role

  function typeLoop() {
    const current = roles[roleIndex];

    if (!deleting) {
      // Typing
      charIndex++;
      typedText.textContent = current.slice(0, charIndex);

      if (charIndex === current.length) {
        deleting = true;
        setTimeout(typeLoop, HOLD_TIME);
        return;
      }
      setTimeout(typeLoop, TYPE_SPEED);
    } else {
      // Deleting
      charIndex--;
      typedText.textContent = current.slice(0, charIndex);

      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
      setTimeout(typeLoop, deleting ? DELETE_SPEED : TYPE_SPEED);
    }
  }

  setTimeout(typeLoop, 800);
}

/* ============================================================
   7. SCROLL-REVEAL ANIMATIONS
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target); // animate once
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ============================================================
   8. SKILL BAR ANIMATION
   ============================================================ */
// When #skills enters the viewport, CSS grows every .skill-fill to its --level
const skillsSection = document.getElementById("skills");
const skillsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        skillsSection.classList.add("in-view");
        skillsObserver.unobserve(skillsSection);
      }
    });
  },
  { threshold: 0.2 }
);
if (skillsSection) skillsObserver.observe(skillsSection);

/* ============================================================
   9. STAT COUNTERS
   ============================================================ */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  if (prefersReducedMotion || Number.isNaN(target)) {
    el.textContent = target;
    return;
  }

  const duration = 1400; // ms
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    // easeOutCubic for a smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".count").forEach(animateCounter);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

document.querySelectorAll(".stats-grid").forEach((grid) => counterObserver.observe(grid));

/* ============================================================
   10. PROJECT FILTERING
   ============================================================ */
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Toggle active state on the filter bar
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    projectCards.forEach((card) => {
      const matches = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("hidden", !matches);

      // Replay the pop-in animation for visible cards
      if (matches) {
        card.classList.remove("pop");
        // Force reflow so the animation can restart
        void card.offsetWidth;
        card.classList.add("pop");
      }
    });
  });
});

/* ============================================================
   11. CONTACT FORM VALIDATION + SUCCESS MESSAGE
   ============================================================ */
const contactForm = document.getElementById("contactForm");
const formSuccess = document.getElementById("formSuccess");
const successName = document.getElementById("successName");
const resetFormBtn = document.getElementById("resetFormBtn");

// Simple field validators — returns an error message or "" when valid
const validators = {
  name: (v) => {
    if (!v.trim()) return "Please enter your name.";
    if (v.trim().length < 2) return "Name must be at least 2 characters.";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "Please enter your email.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(v.trim())) return "Please enter a valid email address.";
    return "";
  },
  subject: (v) => {
    if (!v.trim()) return "Please enter a subject.";
    if (v.trim().length < 3) return "Subject must be at least 3 characters.";
    return "";
  },
  message: (v) => {
    if (!v.trim()) return "Please write a message.";
    if (v.trim().length < 10) return "Message must be at least 10 characters.";
    return "";
  },
};

// Show / hide an error message under a field
function setFieldError(field, message) {
  const errorEl = document.getElementById(field.id + "Error");
  field.classList.toggle("error", Boolean(message));
  errorEl.textContent = message;
  field.setAttribute("aria-invalid", message ? "true" : "false");
  return !message;
}

function validateField(field) {
  return setFieldError(field, validators[field.name](field.value));
}

// Validate live as the user types away from a field
["name", "email", "subject", "message"].forEach((id) => {
  const field = document.getElementById(id);
  field.addEventListener("blur", () => validateField(field));
});

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Validate every field and focus the first one that fails
  let firstInvalid = null;
  ["name", "email", "subject", "message"].forEach((id) => {
    const field = document.getElementById(id);
    if (!validateField(field) && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  /*
    FRONTEND-ONLY DEMO: nothing is sent anywhere.
    To connect a real backend later, replace the block below with e.g.:

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
      })
        .then((res) => { if (!res.ok) throw new Error(res.status); })
        .then(showSuccess)
        .catch(() => { /* show an error state here *\/ });

    For now we simply simulate a successful send:
  */
  const nameValue = document.getElementById("name").value.trim();
  const firstName = nameValue.split(/\s+/)[0];
  successName.textContent = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  contactForm.hidden = true;
  formSuccess.hidden = false;
  formSuccess.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
});

// "Send another message" resets the form and shows it again
resetFormBtn.addEventListener("click", () => {
  contactForm.reset();
  contactForm.hidden = false;
  formSuccess.hidden = true;
  ["name", "email", "subject", "message"].forEach((id) => {
    const field = document.getElementById(id);
    setFieldError(field, "");
  });
});

/* ============================================================
   12. BACK TO TOP
   ============================================================ */
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

/* ============================================================
   13. FOOTER YEAR
   ============================================================ */
document.getElementById("year").textContent = new Date().getFullYear();

/* ============================================================
   INIT
   ============================================================ */
onScroll(); // paint the correct initial state (progress bar, header, button)
