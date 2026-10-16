/* ---- Mobile menu ---- */
const nav = document.getElementById('nav');
document.getElementById('menu-btn').onclick = () => nav.classList.toggle('open');
nav.querySelectorAll('a').forEach(a => a.onclick = () => nav.classList.remove('open'));

/* ---- Header background on scroll ---- */
const header = document.querySelector('header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 40));

/* ---- Highlight active nav link for the section in view ---- */
const links = [...nav.querySelectorAll('a')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach(s => spy.observe(s));

/* ---- Scroll reveal: plays every time an element enters the screen ---- */
const reveal = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const fill = e.target.querySelector('.bar i');
    if (e.intersectionRatio >= 0.15) {                 // coming into view: play the animation
      e.target.classList.add('show');
      if (fill) fill.style.width = fill.dataset.w + '%';
    } else if (e.intersectionRatio === 0) {            // fully out of view: reset so it can play again
      e.target.classList.remove('show');
      if (fill) fill.style.width = '0';
    }
  });
}, { threshold: [0, 0.15] });
document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

/* ---- Contact form: opens the visitor's email app (swap for Formspree/EmailJS later) ---- */
document.getElementById('contact-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = `Name: ${f.get('name')}\nEmail: ${f.get('email')}\nPhone: ${f.get('phone')}\n\n${f.get('message')}`;
  location.href = `mailto:you@example.com?subject=${encodeURIComponent(f.get('subject'))}&body=${encodeURIComponent(body)}`;
  document.getElementById('form-msg').textContent = 'Opening your email app...';
});

document.getElementById('year').textContent = new Date().getFullYear();

/* ---- Tech stack strip: auto-slides, and you can drag it ---- */
const track = document.getElementById('marquee-track');
const marquee = track.parentElement;

// duplicate the icons once so the loop never has a gap
[...track.children].forEach(el => {
  const copy = el.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  track.appendChild(copy);
});

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const AUTO = -60;   // normal speed in px/second (negative = moves left, positive = moves right)
  let x = 0, speed = AUTO, half = 0, dragging = false, lastX = 0, lastT = 0, visible = true, prev = performance.now();

  const measure = () => { half = track.scrollWidth / 2; };
  measure();
  addEventListener('load', measure);
  addEventListener('resize', measure);
  if (document.fonts) document.fonts.ready.then(measure);

  // only animate while the strip is on screen
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(marquee);

  marquee.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; lastX = e.clientX; lastT = e.timeStamp; speed = 0;
    marquee.setPointerCapture(e.pointerId);
    marquee.classList.add('grabbing');
  });

  marquee.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dt = e.timeStamp - lastT;
    x += dx;
    if (dt > 0) speed = Math.max(-2500, Math.min(2500, dx / dt * 1000));
    lastX = e.clientX; lastT = e.timeStamp;
  });

  const release = e => {
    if (e.timeStamp - lastT > 80) speed = 0;   // held still before letting go: no flick
    dragging = false;
    marquee.classList.remove('grabbing');
  };
  marquee.addEventListener('pointerup', release);
  marquee.addEventListener('pointercancel', release);

  (function loop(now) {
    const dt = Math.min(now - prev, 50); prev = now;
    if (visible && half > 0) {
      if (!dragging) {
        x += speed * dt / 1000;
        speed += (AUTO - speed) * (1 - Math.exp(-dt / 500));   // a flick fades back to normal speed
      }
      x = ((x % half) - half) % half;                           // wrap around seamlessly
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(loop);
  })(performance.now());
}

/* ---- Smooth, eased scrolling between sections ---- */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let scrollFrame;

function smoothScrollTo(y) {
  cancelAnimationFrame(scrollFrame);
  const start = scrollY, dist = y - start;
  if (reduceMotion || Math.abs(dist) < 2) { scrollTo(0, y); return; }
  const duration = Math.min(1200, Math.max(600, Math.abs(dist) * 0.6));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let t0;
  function step(now) {
    t0 = t0 || now;
    const p = Math.min((now - t0) / duration, 1);
    scrollTo(0, start + dist * ease(p));
    if (p < 1) scrollFrame = requestAnimationFrame(step);
  }
  scrollFrame = requestAnimationFrame(step);
}

// stop the animation if the visitor scrolls or presses a key themselves
['wheel', 'touchstart', 'keydown'].forEach(ev =>
  addEventListener(ev, () => cancelAnimationFrame(scrollFrame), { passive: true }));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id.length > 1 ? document.querySelector(id) : null;
    if (!target) return;
    e.preventDefault();
    const y = id === '#home' ? 0 : target.getBoundingClientRect().top + scrollY - 70;
    smoothScrollTo(y);
    history.pushState(null, '', id);
  });
});

/* ---- Changing role: cursor sweeps over the text, goes back, then switches to the next role ---- */
const roles = ['Full-Stack Developer', 'Data Analyst', 'Machine Learning Enthusiast'];   // edit these

function runRole(textId, fillId, list) {
  const roleText = document.getElementById(textId);
  const roleFill = document.getElementById(fillId);
  if (!roleText || !roleFill) return;

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const sweep = async (from, to, ms) => {
    await roleFill.animate({ width: [from + 'px', to + 'px'] }, { duration: ms, easing: 'linear' }).finished;
    roleFill.style.width = to + 'px';
  };

  (async function cycle() {
    if (document.fonts) await document.fonts.ready;
    let i = 0;
    while (true) {
      const word = list[i++ % list.length];
      roleText.textContent = word;
      roleFill.textContent = word;
      roleFill.style.width = '0px';
      const w = roleText.offsetWidth;
      await wait(600);
      await sweep(0, w, word.length * 90 + 300);
      await wait(1400);
      await sweep(w, 0, word.length * 60 + 250);
      await wait(300);
    }
  })();
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  runRole('role-text', 'role-fill', roles);                  // hero
  runRole('about-role-text', 'about-role-fill', roles);      // about section
}