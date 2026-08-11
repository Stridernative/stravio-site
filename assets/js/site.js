/* Stravio — site.js · shared page behaviors · built 2026-07-13 */

// reduced motion flag
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) document.body.classList.add('reduce');

// scroll reveals
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.14 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

// footer year
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/**
 * Bind a sticky scroll-story section: as the tall section scrolls,
 * report progress 0..1 and a discrete segment index 0..n-1.
 * Returns { goTo(i) } to scroll to a segment programmatically.
 */
export function bindStory(sectionEl, segments, onUpdate) {
  let lastSeg = -1;
  function update() {
    const rect = sectionEl.getBoundingClientRect();
    const denom = sectionEl.offsetHeight - window.innerHeight;
    if (denom <= 0) return;
    const p = Math.min(1, Math.max(0, -rect.top / denom));
    const seg = Math.min(segments - 1, Math.floor(p * segments * 0.999));
    onUpdate(p, seg, seg !== lastSeg);
    lastSeg = seg;
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
  return {
    goTo(i) {
      const denom = sectionEl.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: sectionEl.offsetTop + ((i + 0.5) / segments) * denom,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    },
  };
}

// contact form: relay through Web3Forms straight to the Stravio inbox —
// no mail app, nothing stored on this site. Mailto is only the failure fallback.
const WEB3FORMS_KEY = 'f3a88514-18d5-417f-9c09-a1eb65e447f5'; // from web3forms.com, tied to gabe@stravioai.com
export function bindLeadForm(form) {
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;
  const note = form.querySelector('.form-note');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = (id) => (form.querySelector(id) ? form.querySelector(id).value.trim() : '');
    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: 'Stravio site inquiry from ' + v('#f-name') + (v('#f-co') ? ' at ' + v('#f-co') : ''),
      from_name: 'stravioai.com contact form',
      name: v('#f-name'),
      email: v('#f-email'),
      company: v('#f-co'),
      message: v('#f-msg'),
    };
    const hp = form.querySelector('#f-check');
    if (hp && hp.checked) return; // honeypot tripped: drop silently
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.innerHTML = '<span class="mark"></span>Sending&hellip;';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'send failed');
      form.innerHTML =
        '<div class="form-sent"><p class="sent-title">Message sent</p>' +
        '<p class="sent-body">We will come back to you within one business day.</p></div>';
    } catch (err) {
      console.error('Contact form send failed:', err);
      btn.disabled = false;
      btn.innerHTML = label;
      if (note) {
        note.classList.add('form-err');
        note.innerHTML = 'Something interrupted the send. Try again, or email ' +
          '<a href="mailto:gabe@stravioai.com">gabe@stravioai.com</a> directly.';
      }
    }
  });
}
