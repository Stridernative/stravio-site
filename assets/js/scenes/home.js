/* Stravio — scenes/home.js · the homepage cinematic journey · 2026-07-14
   One persistent full-viewport scene behind the whole page.
   Scroll does not move past the 3D — scroll IS the camera: page scroll
   progress scrubs the camera along a winding brass path through a
   starfield, and each content section is a stop on that journey.

   Layout contract with index.html (decision D12): the camera is offset
   to the OPPOSITE side of each stop's text column, so the path renders
   away from the copy and never crosses it.

   Two-Registers rule: the 3D carries structure and story only.
   Every number and every word lives in flat HTML above this canvas. */

import * as THREE from 'three';

const BRAND = {
  canvas: 0x090d15,
  steel: 0x344155,
  brass: 0xC9853A,
  brassBright: 0xE0A257,
  pearl: 0xF2EFE7,
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* soft radial glow sprite (shared look with the other scenes) */
function glowSprite(inner, outer, scale) {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  s.scale.setScalar(scale);
  return s;
}

/* star layer: `count` points in a box `spread` around `center` */
function starField(count, spread, center, size, opacity) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center.x + (Math.random() - 0.5) * spread[0];
    pos[i * 3 + 1] = center.y + (Math.random() - 0.5) * spread[1];
    pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * spread[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: BRAND.pearl, size, transparent: true, opacity,
    depthWrite: false, sizeAttenuation: true,
  }));
}

export function initHomeJourney(canvas) {
  /* ---------- stage ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BRAND.canvas, 0.045);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- the path: one continuous journey, hero to CTA ----------
     Six control points, one per stop, evenly spaced so scroll stops land
     on them. The x swing alternates OPPOSITE the copy side per stop
     (copy goes L,R,L,R,L,R — decision D18 rev.2), so the road is at its
     far-side extreme exactly when a section's text is on screen and only
     crosses the center in the empty travel stretches between stops. */
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.9, -0.9, 2.0),     // hero
    new THREE.Vector3(-0.9, -0.3, -5.2),   // problem
    new THREE.Vector3(0.9, 0.3, -12.4),    // what
    new THREE.Vector3(-0.9, 0.9, -19.6),   // stack
    new THREE.Vector3(0.9, 1.5, -26.8),    // why
    new THREE.Vector3(-0.6, 2.1, -34.0),   // cta
  ]);
  /* the road weaves gently near the center line; the CAMERA does the big
     side-to-side alternation. That keeps the whole visible road (approach
     included) on the far side of every stop's copy column. */

  /* flat track (decision D17): a ridable deck with edge rails,
     always lying flat like a road — never a tube */
  const TRACK_W = 0.5;
  const UP = new THREE.Vector3(0, 1, 0);
  function buildTrack(curve, segments, width) {
    const pos = [], norm = [], uvs = [], idx = [];
    const leftPts = [], rightPts = [];
    const side = new THREE.Vector3();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = curve.getPointAt(t);
      side.crossVectors(UP, curve.getTangentAt(t)).normalize();
      const l = p.clone().addScaledVector(side, width / 2);
      const r = p.clone().addScaledVector(side, -width / 2);
      leftPts.push(l); rightPts.push(r);
      pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
      norm.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, t, 1, t);
    }
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    return { geo, leftPts, rightPts };
  }

  const track = buildTrack(path, 400, TRACK_W);
  scene.add(new THREE.Mesh(
    track.geo,
    new THREE.MeshStandardMaterial({
      color: BRAND.brass, metalness: 0.6, roughness: 0.42,
      emissive: 0x2e1c07, emissiveIntensity: 1, side: THREE.DoubleSide,
    })
  ));

  // edge rails, slightly brighter than the deck
  const railMat = new THREE.MeshStandardMaterial({
    color: BRAND.brassBright, metalness: 0.75, roughness: 0.3,
    emissive: 0x4a2f0e, emissiveIntensity: 1,
  });
  const every8 = (pts) => pts.filter((_, i) => i % 8 === 0);
  for (const edge of [track.leftPts, track.rightPts]) {
    scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(every8(edge)), 300, 0.022, 8, false),
      railMat
    ));
  }

  // center guide glow floating just above the deck
  const guidePts = path.getPoints(400).map((p) => p.clone().add(new THREE.Vector3(0, 0.03, 0)));
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(guidePts),
    new THREE.LineBasicMaterial({
      color: BRAND.brassBright, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  ));

  /* ---------- destination: pure light at the end of the road ----------
     no solid sphere (decision: the "ball" read wrong) — the promised land
     is a radiance, not an object. Full creative treatment parked in O4. */
  const dest = path.getPointAt(1);
  const destHot = glowSprite('rgba(255,248,232,0.95)', 'rgba(247,231,196,0.5)', 1.6);
  destHot.position.copy(dest);
  scene.add(destHot);
  const destGlow = glowSprite('rgba(247,231,196,0.75)', 'rgba(201,133,58,0.3)', 5.4);
  destGlow.position.copy(dest);
  scene.add(destGlow);
  const destLight = new THREE.PointLight(BRAND.brassBright, 30, 20, 2);
  destLight.position.copy(dest);
  scene.add(destLight);

  /* ---------- the ship: a small craft flying the track to the light ---------- */
  const ship = new THREE.Group();
  const shipBody = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.22, 12),
    new THREE.MeshStandardMaterial({
      color: BRAND.pearl, metalness: 0.35, roughness: 0.3,
      emissive: 0xd8d0c0, emissiveIntensity: 0.85,
    })
  );
  shipBody.geometry.rotateX(Math.PI / 2);   // nose points +z so lookAt() steers it
  ship.add(shipBody);
  const shipGlow = glowSprite('rgba(242,239,231,0.8)', 'rgba(242,239,231,0.12)', 0.7);
  ship.add(shipGlow);
  const shipLight = new THREE.PointLight(BRAND.pearl, 2.5, 3, 2);
  ship.add(shipLight);
  scene.add(ship);
  const HOVER = new THREE.Vector3(0, 0.09, 0);
  const shipAhead = new THREE.Vector3();

  /* ---------- stars: simple, sparse, everywhere ---------- */
  const mid = path.getPointAt(0.5);
  scene.add(starField(1300, [90, 55, 110], mid, 0.06, 0.55));  // far, faint
  scene.add(starField(260, [50, 30, 70], mid, 0.1, 0.85));     // near, bright

  /* ---------- light ---------- */
  scene.add(new THREE.AmbientLight(BRAND.steel, 1.1));
  const key = new THREE.DirectionalLight(0x8fa2c0, 1.3);
  key.position.set(-4, 6, 4);
  scene.add(key);

  /* ---------- camera rig ----------
     Stops are evenly spaced in scroll progress. Per stop we offset the
     camera sideways so the path renders opposite that stop's text:
       x offset negative → path appears screen-right (text sits left)
       x offset positive → path appears screen-left  (text sits right) */
  /* alternation per decision D18 rev.2: copy left, right, left, right,
     left, right — camera frames the track on the opposite side each time
     (negative x offset → track renders screen-right, positive → left) */
  const STOP_OFFSETS = [
    new THREE.Vector3(-2.6, 0.95, 3.6),  // hero      · copy left,  track right
    new THREE.Vector3(2.6, 0.95, 3.4),   // problem   · copy right, track left
    new THREE.Vector3(-2.8, 1.15, 3.4),  // what      · copy left,  track right
    new THREE.Vector3(3.2, 1.35, 3.4),   // stack     · copy right, track left
    new THREE.Vector3(-2.8, 1.2, 3.4),   // why       · copy left,  track right
    new THREE.Vector3(1.7, 0.95, 4.4),   // cta       · copy right, light arrives left
  ];
  const camPts = STOP_OFFSETS.map((off, i) =>
    path.getPointAt(i / (STOP_OFFSETS.length - 1)).clone().add(off)
  );
  const camCurve = new THREE.CatmullRomCurve3(camPts);

  /* projection shift per stop: pushes the whole scene toward the non-copy
     side as a FRACTION of viewport width, so the road clears the copy
     column on any monitor size (positive fraction → scene moves left) */
  const STOP_SHIFT = [-0.16, 0.16, -0.16, 0.16, -0.16, 0.13]; // − → road right
  function applyShift(e) {
    const n = STOP_SHIFT.length - 1;
    const s = Math.min(n, Math.max(0, e * n));
    const i = Math.min(n - 1, Math.floor(s));
    const frac = s - i;
    const shift = STOP_SHIFT[i] + (STOP_SHIFT[i + 1] - STOP_SHIFT[i]) * frac;
    const w = window.innerWidth, h = window.innerHeight;
    camera.setViewOffset(w, h, shift * w, 0, w, h);
  }

  /* ---------- scroll scrub ---------- */
  let progress = 0;   // raw page scroll 0..1
  let eased = 0;      // smoothed camera position on that range
  function readScroll() {
    const denom = document.documentElement.scrollHeight - window.innerHeight;
    progress = denom > 0 ? Math.min(1, Math.max(0, window.scrollY / denom)) : 0;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  /* pointer micro-parallax, eased */
  const target = { x: 0, y: 0 };
  const drift = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  const lookAt = new THREE.Vector3();
  function placeCamera(e, t) {
    applyShift(e);
    camCurve.getPointAt(e, camera.position);
    drift.x += (target.x - drift.x) * 0.04;
    drift.y += (target.y - drift.y) * 0.04;
    camera.position.x += drift.x * 0.3 + Math.sin(t * 0.0032) * 0.08;
    camera.position.y += -drift.y * 0.18 + Math.cos(t * 0.0026) * 0.05;
    // near the end, settle the gaze on the destination dot itself;
    // otherwise aim slightly above the road ahead so the path rides the
    // lower half of the frame, clear of the copy (decision D12)
    if (e > 0.9) {
      lookAt.copy(dest);
    } else {
      path.getPointAt(Math.min(1, e + 0.07), lookAt);
      lookAt.y += 0.55;
    }
    camera.lookAt(lookAt);
  }

  /* ---------- frame loop ---------- */
  let t = 0;
  function frame() {
    t += 1;
    eased += (progress - eased) * 0.06;
    placeCamera(Math.min(1, Math.max(0, eased)), t);

    const glowPulse = 0.82 + Math.sin(t * 0.028) * 0.18;
    destGlow.scale.setScalar(4.4 * glowPulse);
    destLight.intensity = 30 * glowPulse;

    const tt = (t * 0.0011) % 1;
    ship.position.copy(path.getPointAt(tt)).add(HOVER);
    path.getPointAt(Math.min(1, tt + 0.006), shipAhead).add(HOVER);
    ship.lookAt(shipAhead);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    // no scrub, no drift: hold the hero framing as a still backdrop
    placeCamera(0, 0);
    renderer.render(scene, camera);
    window.addEventListener('resize', () => { placeCamera(0, 0); renderer.render(scene, camera); });
    return;
  }
  requestAnimationFrame(frame);
}
