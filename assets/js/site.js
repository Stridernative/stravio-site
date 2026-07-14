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

// contact form: no backend yet — compose a mail draft to gabe@stravioai.com
export function bindLeadForm(form) {
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (id) => (form.querySelector(id) ? form.querySelector(id).value.trim() : '');
    const subject = encodeURIComponent('Stravio inquiry — ' + (v('#f-co') || v('#f-name')));
    const body = encodeURIComponent(
      'Name: ' + v('#f-name') + '\nCompany: ' + v('#f-co') + '\nEmail: ' + v('#f-email') +
      '\n\nWhat we are working on:\n' + v('#f-msg')
    );
    window.location.href = 'mailto:gabe@stravioai.com?subject=' + subject + '&body=' + body;
  });
}
