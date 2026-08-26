/* ============================================================================
   main.js — Public website behavior
   Applies settings, renders content from LocalStorage, handles nav, theme,
   animations, the contact form and the blog reader modal.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------- Social icon library ------------------------- */

  // Data keys are `github | linkedin | twitter | email`; map to icon names.
  const SOCIAL_KEYS = ['github', 'linkedin', 'twitter', 'email'];
  const SOCIAL_ICON_NAMES = { github: 'github', linkedin: 'linkedin', twitter: 'twitter', email: 'mail' };
  const SOCIAL_LABELS = { github: 'GitHub', linkedin: 'LinkedIn', twitter: 'Twitter / X', email: 'Email' };

  function socialLinksHTML(socials) {
    const s = socials || {};
    let html = '';
    SOCIAL_KEYS.forEach((k) => {
      const url = s[k];
      if (!url) return;
      const href = k === 'email' ? 'mailto:' + url : url;
      html += '<a href="' + escapeHTML(href) + '" target="_blank" rel="noopener" title="' + SOCIAL_LABELS[k] + '" aria-label="' + SOCIAL_LABELS[k] + '">' + icon(SOCIAL_ICON_NAMES[k]) + '</a>';
    });
    return html;
  }

  /* ------------------------- Apply global settings ----------------------- */

  function applySettings() {
    const settings = getData(DB.SETTINGS, {});
    const profile = getData(DB.PROFILE, {});
    applyTheme();

    document.title = settings.siteName ? settings.siteName + ' — ' + (profile.title || 'Portfolio') : 'Portfolio';

    // Per-page meta descriptions are written statically per page for SEO and
    // must NOT be overwritten by the generic site description here.

    document.querySelectorAll('#brand-name').forEach((el) => { el.textContent = settings.siteName || 'Portfolio'; });
    // Brand logo: uploaded image if set, otherwise the default dot
    const brandLogo = document.getElementById('brand-logo');
    const brandDot = document.getElementById('brand-dot');
    if (brandLogo && brandDot) {
      if (settings.logo) {
        brandLogo.src = settings.logo;
        brandLogo.classList.remove('hidden');
        brandDot.classList.add('hidden');
      } else {
        brandLogo.classList.add('hidden');
        brandLogo.removeAttribute('src');
        brandDot.classList.remove('hidden');
      }
    }
    document.querySelectorAll('#footer-name, #footer-copy-name').forEach((el) => { el.textContent = settings.siteName || ''; });
    const fd = document.getElementById('footer-desc');
    if (fd) fd.textContent = settings.siteDescription || '';

    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    document.querySelectorAll('#footer-socials').forEach((el) => { el.innerHTML = socialLinksHTML(settings.socials); });
  }

  /* ------------------------------ Nav logic ------------------------------ */

  function initNav() {
    const page = document.body.dataset.page || '';
    document.querySelectorAll('[data-nav]').forEach((a) => {
      if (a.dataset.nav === page) a.classList.add('active');
    });

    const menu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger');

    if (hamburger) {
      hamburger.addEventListener('click', () => { menu.classList.add('open'); });
      menu.querySelectorAll('[data-close-menu]').forEach((el) => {
        el.addEventListener('click', () => menu.classList.remove('open'));
      });
    }

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  }

  /* ------------------------- Reveal on scroll ---------------------------- */

  let revealIO = null;
  const observedReveals = new Set();

  function initReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
    }
    // Observe any reveal elements that were rendered after the last pass
    // (e.g. skills cards injected dynamically from LocalStorage).
    els.forEach((el) => {
      if (!observedReveals.has(el)) {
        observedReveals.add(el);
        revealIO.observe(el);
      }
    });
  }

  /* --------------------------- Scroll to top ----------------------------- */

  function initScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ------------------------------ Renderers ------------------------------ */

  function emptyState(iconName, title, sub) {
    return '<div class="empty-state"><div class="empty-icon">' + icon(iconName) + '</div><h3>' + escapeHTML(title) + '</h3><p>' + escapeHTML(sub) + '</p></div>';
  }

  /* --- Hero (home) --- */
  function renderHero() {
    const profile = getData(DB.PROFILE, {});
    const settings = getData(DB.SETTINGS, {});
    const skills = getData(DB.SKILLS, []);
    const img = document.getElementById('hero-img');
    if (img) img.src = profile.image || 'images/profile.svg';
    const name = document.getElementById('hero-name');
    if (name) name.textContent = profile.name || '';
    const intro = document.getElementById('hero-intro');
    if (intro) intro.textContent = profile.intro || '';
    const socials = document.getElementById('hero-socials');
    if (socials) socials.innerHTML = socialLinksHTML(settings.socials);

    // Tech stack strip under the hero (from skills)
    const stack = document.getElementById('hero-stack');
    if (stack) {
      const names = skills.map((s) => s.name).slice(0, 6);
      stack.innerHTML = names.length
        ? 'Tech Stack — <span>' + escapeHTML(names.join('  •  ')) + '</span>'
        : '';
    }

    // Typewriter for the professional title
    const typedEl = document.getElementById('typed-role');
    if (typedEl) {
      const words = [profile.title, 'Frontend Developer', 'Full-Stack Developer', 'UI/UX Designer']
        .map((w) => (w || '').trim()).filter((w, i, a) => w && a.indexOf(w) === i);
      if (words.length) startTypewriter(typedEl, words);
    }
  }

  /* --- Typewriter effect --- */
  function startTypewriter(el, words) {
    let wi = 0, ci = 0, deleting = false;
    function tick() {
      const word = words[wi] || '';
      el.textContent = word.slice(0, ci);
      if (!deleting) {
        ci += 1;
        if (ci > word.length) { deleting = true; return setTimeout(tick, 1700); }
        return setTimeout(tick, 65 + Math.random() * 55);
      }
      ci -= 1;
      if (ci < 0) { deleting = false; wi = (wi + 1) % words.length; return setTimeout(tick, 350); }
      return setTimeout(tick, 32);
    }
    tick();
  }

  /* --- Skills (home) --- */
  function renderSkills(targetId) {
    const target = document.getElementById(targetId || 'skills-grid');
    if (!target) return;
    const skills = getData(DB.SKILLS, []);
    if (!skills.length) {
      target.innerHTML = emptyState('code', 'No skills yet.', 'Skills will appear here once the admin adds them.');
      return;
    }
    target.innerHTML = skills.map((s, i) => {
      const level = Math.max(0, Math.min(100, Number(s.level) || 0));
      return (
        '<div class="skill-card" data-reveal style="--delay:' + (i % 6) * 0.06 + 's">' +
          '<div class="skill-top">' +
            '<div class="skill-icon">' + icon(s.icon) + '</div>' +
            '<div style="flex:1">' +
              '<h3>' + escapeHTML(s.name) + '</h3>' +
              '<span class="skill-level-label">' + level + '%</span>' +
            '</div>' +
          '</div>' +
          '<div class="skill-bar"><div class="fill" data-level="' + level + '"></div></div>' +
        '</div>'
      );
    }).join('');
    // Observe the freshly rendered cards so their reveal animation runs
    initReveal();
    // Animate the bars once visible
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const fill = e.target.querySelector('.fill');
          if (fill) fill.style.width = fill.dataset.level + '%';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    target.querySelectorAll('.skill-card').forEach((card) => io.observe(card));
  }

  /* --- Project card --- */
  function projectCard(p) {
    const techs = (p.technologies || []).map((t) => '<span class="tech-chip">' + escapeHTML(t) + '</span>').join('');
    return (
      '<article class="project-card">' +
        '<div class="thumb"><img src="' + escapeHTML(p.image || 'images/projects/project1.svg') + '" alt="' + escapeHTML(p.title) + '" loading="lazy"></div>' +
        '<div class="body">' +
          '<h3>' + escapeHTML(p.title) + '</h3>' +
          '<p>' + escapeHTML(p.description || '') + '</p>' +
          '<div class="tech-chips">' + techs + '</div>' +
          '<div class="project-actions">' +
            '<a class="btn btn-ghost btn-sm" href="' + escapeHTML(p.github || '#') + '" target="_blank" rel="noopener">GitHub</a>' +
            '<a class="btn btn-primary btn-sm" href="' + escapeHTML(p.demo || '#') + '" target="_blank" rel="noopener">Live Demo</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderProjects(targetId, list) {
    const target = document.getElementById(targetId || 'projects-grid');
    if (!target) return;
    const projects = list || getData(DB.PROJECTS, []);
    if (!projects.length) {
      target.innerHTML = emptyState('package', 'No projects found.', targetId === 'featured-projects' ? 'Projects will appear here once published.' : 'Try a different search, or check back later.');
      return;
    }
    target.innerHTML = projects.map((p) => projectCard(p)).join('');
  }

  /* --- Post card --- */
  function postCard(p) {
    const excerpt = (p.content || '').length > 120 ? p.content.slice(0, 120).trim() + '…' : (p.content || '');
    return (
      '<article class="post-card">' +
        '<div class="thumb"><img src="' + escapeHTML(p.image || 'images/blog/blog1.svg') + '" alt="' + escapeHTML(p.title) + '" loading="lazy"></div>' +
        '<div class="body">' +
          '<div class="post-meta"><span class="post-cat">' + escapeHTML(p.category || 'General') + '</span><span>' + formatDate(p.date) + '</span></div>' +
          '<h3>' + escapeHTML(p.title) + '</h3>' +
          '<p>' + escapeHTML(excerpt) + '</p>' +
          '<button class="read-more" data-post-id="' + p.id + '">Read More ' + icon('arrow-right') + '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function renderPosts(targetId, list) {
    const target = document.getElementById(targetId || 'posts-grid');
    if (!target) return;
    const posts = list || getData(DB.POSTS, []).filter((p) => p.published);
    if (!posts.length) {
      target.innerHTML = emptyState('file-text', 'No posts published yet.', 'Check back soon — or log in to the admin to write the first one.');
      return;
    }
    target.innerHTML = posts.map((p) => postCard(p)).join('');
    target.querySelectorAll('.read-more').forEach((btn) => {
      btn.addEventListener('click', () => openPostModal(btn.dataset.postId));
    });
  }

  /* --- Blog reader modal --- */
  function openPostModal(postId) {
    const post = getData(DB.POSTS, []).find((p) => p.id === postId);
    if (!post) return;
    const modal = document.getElementById('post-modal');
    const body = document.getElementById('post-modal-body');
    body.innerHTML =
      '<img class="post-hero" src="' + escapeHTML(post.image || 'images/blog/blog1.svg') + '" alt="' + escapeHTML(post.title) + '">' +
      '<div class="post-meta"><span class="post-cat">' + escapeHTML(post.category || 'General') + '</span><span>' + formatDate(post.date) + '</span></div>' +
      '<h2>' + escapeHTML(post.title) + '</h2>' +
      '<div class="content">' + nl2br(post.content || '') + '</div>';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePostModal() {
    const modal = document.getElementById('post-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function initPostModal() {
    const modal = document.getElementById('post-modal');
    if (!modal) return;
    document.getElementById('post-modal-close').addEventListener('click', closePostModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closePostModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePostModal(); });
  }

  /* --- About page --- */
  function renderAbout() {
    const profile = getData(DB.PROFILE, {});
    const settings = getData(DB.SETTINGS, {});
    const img = document.getElementById('about-img');
    if (img) img.src = profile.image || 'images/profile.svg';
    const name = document.getElementById('about-name');
    if (name) name.textContent = profile.name || '';
    const role = document.getElementById('about-role');
    if (role) role.textContent = profile.title || '';
    const bio = document.getElementById('about-bio');
    if (bio) bio.innerHTML = nl2br(profile.about || '');
    const email = document.getElementById('contact-email');
    if (email) email.textContent = settings.socials && settings.socials.email ? settings.socials.email : '';

    const edu = document.getElementById('about-education');
    if (edu) {
      const items = profile.education || [];
      edu.innerHTML = items.length
        ? items.map((e) =>
            '<div class="edu-item"><div class="edu-dot"></div><div><h4>' + escapeHTML(e.degree || '') + '</h4><p>' +
            escapeHTML(e.school || '') + (e.year ? ' · ' + escapeHTML(e.year) : '') + '</p></div></div>'
          ).join('')
        : '<p class="muted">No education entries yet.</p>';
    }

    const goals = document.getElementById('about-goals');
    if (goals) {
      const items = profile.goals || [];
      goals.innerHTML = items.length
        ? items.map((g) => '<li>' + escapeHTML(g) + '</li>').join('')
        : '<li class="muted">No goals listed yet.</li>';
    }

    const interests = document.getElementById('about-interests');
    if (interests) {
      const items = profile.interests || [];
      interests.innerHTML = items.length
        ? items.map((i) => '<span class="tag">' + escapeHTML(i) + '</span>').join('')
        : '<p class="muted">No interests listed yet.</p>';
    }

    const socials = document.getElementById('contact-socials');
    if (socials) socials.innerHTML = socialLinksHTML(settings.socials);
  }

  /* --- Projects page with search + tech filter --- */
  function initProjectsPage() {
    const search = document.getElementById('project-search');
    const chipsWrap = document.getElementById('project-tech-chips');
    if (!search) return;
    let activeTech = null;

    function render() {
      const projects = getData(DB.PROJECTS, []);
      const q = search.value.trim().toLowerCase();
      let list = projects.filter((p) => {
        const hay = (p.title + ' ' + (p.description || '') + ' ' + (p.technologies || []).join(' ')).toLowerCase();
        return !q || hay.includes(q);
      });
      if (activeTech) list = list.filter((p) => (p.technologies || []).some((t) => t.toLowerCase() === activeTech));
      renderProjects('projects-grid', list);
    }

    // Build tech chips from data
    function buildChips() {
      const techs = [...new Set(getData(DB.PROJECTS, []).flatMap((p) => p.technologies || []))].sort();
      chipsWrap.innerHTML = '<button class="chip' + (activeTech === null ? ' active' : '') + '" data-tech="">All</button>' +
        techs.map((t) => '<button class="chip' + (activeTech === t ? ' active' : '') + '" data-tech="' + escapeHTML(t.toLowerCase()) + '">' + escapeHTML(t) + '</button>').join('');
      chipsWrap.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          activeTech = chip.dataset.tech || null;
          buildChips();
          render();
        });
      });
    }

    search.addEventListener('input', render);
    buildChips();
    render();
  }

  /* --- Blog page with search + category filter --- */
  function initBlogPage() {
    const search = document.getElementById('post-search');
    const chipsWrap = document.getElementById('post-category-chips');
    if (!search) return;
    let activeCat = null;

    function render() {
      const posts = getData(DB.POSTS, []).filter((p) => p.published);
      const q = search.value.trim().toLowerCase();
      let list = posts.filter((p) => {
        const hay = (p.title + ' ' + (p.category || '') + ' ' + (p.content || '')).toLowerCase();
        return !q || hay.includes(q);
      });
      if (activeCat) list = list.filter((p) => (p.category || '').toLowerCase() === activeCat);
      renderPosts('posts-grid', list);
    }

    function buildChips() {
      const cats = [...new Set(getData(DB.POSTS, []).filter((p) => p.published).map((p) => p.category).filter(Boolean))].sort();
      chipsWrap.innerHTML = '<button class="chip' + (activeCat === null ? ' active' : '') + '" data-cat="">All</button>' +
        cats.map((c) => '<button class="chip' + (activeCat === c ? ' active' : '') + '" data-cat="' + escapeHTML(c.toLowerCase()) + '">' + escapeHTML(c) + '</button>').join('');
      chipsWrap.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          activeCat = chip.dataset.cat || null;
          buildChips();
          render();
        });
      });
    }

    search.addEventListener('input', render);
    buildChips();
    render();
  }

  /* --- Contact form --- */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const fields = {
      name: document.getElementById('cf-name'),
      email: document.getElementById('cf-email'),
      subject: document.getElementById('cf-subject'),
      message: document.getElementById('cf-message')
    };

    function setInvalid(input, invalid) {
      const group = input.closest('.form-group');
      if (group) group.classList.toggle('invalid', invalid);
    }

    function validate() {
      let ok = true;
      if (!fields.name.value.trim()) { setInvalid(fields.name, true); ok = false; } else setInvalid(fields.name, false);
      if (!isValidEmail(fields.email.value.trim())) { setInvalid(fields.email, true); ok = false; } else setInvalid(fields.email, false);
      if (!fields.subject.value.trim()) { setInvalid(fields.subject, true); ok = false; } else setInvalid(fields.subject, false);
      if (fields.message.value.trim().length < 10) { setInvalid(fields.message, true); ok = false; } else setInvalid(fields.message, false);
      return ok;
    }

    // Live re-validate
    Object.values(fields).forEach((input) => {
      input.addEventListener('input', () => setInvalid(input, false));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
      }
      const messages = getData(DB.MESSAGES, []);
      messages.unshift({
        id: uid(),
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        subject: fields.subject.value.trim(),
        message: fields.message.value.trim(),
        date: new Date().toISOString(),
        read: false
      });
      saveData(DB.MESSAGES, messages);
      form.reset();
      showToast('Message sent successfully! I\'ll get back to you soon.', 'success');
    });
  }

  /* ------------------------------ SEO ------------------------------------ */

  /**
   * Injects (or replaces) a JSON-LD structured-data block. Google's crawler
   * executes JavaScript, so schemas built from the live LocalStorage content
   * (projects / posts) are picked up for richer search results.
   */
  function injectJSONLD(id, data) {
    const old = document.getElementById(id);
    if (old) old.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /** ItemList schema from the current projects (projects page). */
  function injectProjectsSchema() {
    const projects = getData(DB.PROJECTS, []);
    if (!projects.length) return;
    injectJSONLD('seo-projects', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Projects by Sovanna CHHEM',
      itemListElement: projects.slice(0, 10).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        description: (p.description || '').slice(0, 200),
        url: p.demo && p.demo !== '#' ? p.demo : undefined
      }))
    });
  }

  /** Blog schema from the published posts (blog page). */
  function injectBlogSchema() {
    const posts = getData(DB.POSTS, []).filter((p) => p.published);
    if (!posts.length) return;
    injectJSONLD('seo-blog', {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog by Sovanna CHHEM',
      blogPost: posts.slice(0, 10).map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        datePublished: p.date,
        articleSection: p.category,
        description: (p.content || '').slice(0, 200)
      }))
    });
  }

  /* -------------------------------- Boot --------------------------------- */

  applySettings();
  initNav();
  initReveal();
  initScrollTop();
  initPostModal();

  const page = document.body.dataset.page || '';
  switch (page) {
    case 'home':
      renderHero();
      renderSkills();
      renderProjects('featured-projects', getData(DB.PROJECTS, []).slice(0, 3));
      renderPosts('latest-posts', getData(DB.POSTS, []).filter((p) => p.published).slice(0, 3));
      break;
    case 'about':
      renderAbout();
      break;
    case 'projects':
      initProjectsPage();
      injectProjectsSchema();
      break;
    case 'blog':
      initBlogPage();
      injectBlogSchema();
      break;
    case 'contact':
      initContactForm();
      renderAbout(); // fills contact email + socials
      break;
  }
});
