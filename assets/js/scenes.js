/* Stravio — scenes.js · Three.js story scenes · built 2026-07-13
   One metaphor, four beats:
     index    → the path ahead (winding brass path toward the destination light)
     services → the climb (the five-tier Stravio Stack)
     about    → the road traveled (waypoints along the path)
     contact  → arrival (the destination dot, up close)
   Two-Registers rule: 3D carries structure and story. Numbers stay in HTML. */

import * as THREE from 'three';

const BRAND = {
  canvas: 0x090d15,
  midnight: 0x11192A,
  steel: 0x344155,
  steelDeep: 0x232e40,
  brass: 0xC9853A,
  brassBright: 0xE0A257,
  pearl: 0xF2EFE7,
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- shared stage ---------- */

function createStage(canvas, { fov = 42, fog = 0.10 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  if (fog) scene.fog = new THREE.FogExp2(BRAND.canvas, fog);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(() => { resize(); render(); });
  ro.observe(canvas.parentElement || canvas);

  let onFrame = null;
  let raf = 0;
  let visible = true;
  let t = 0;

  function render() { renderer.render(scene, camera); }

  function loop() {
    t += 1;
    if (onFrame) onFrame(t);
    render();
    if (!reduceMotion && visible) raf = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduceMotion) { if (onFrame) onFrame(t); render(); return; }
    raf = requestAnimationFrame(loop);
  }

  // pause when offscreen or tab hidden
  const vio = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start(); else cancelAnimationFrame(raf);
  }, { threshold: 0.02 });
  vio.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (visible) start();
  });

  return {
    renderer, scene, camera, render, start,
    set frame(fn) { onFrame = fn; },
  };
}

/* soft radial glow sprite texture */
function glowTexture(inner, outer) {
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
  return tex;
}

function glowSprite(inner, outer, scale) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(inner, outer),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  return s;
}

/* drifting dust field */
function dustField(count, spread, size = 0.02, opacity = 0.35) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread[0];
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: BRAND.pearl, size, transparent: true, opacity,
    depthWrite: false, sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

/* mouse parallax: returns getter for smoothed -1..1 pointer */
function pointerParallax(el) {
  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  el.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });
  return () => {
    eased.x += (target.x - eased.x) * 0.04;
    eased.y += (target.y - eased.y) * 0.04;
    return eased;
  };
}

/* ============================================================
   1 · THE PATH AHEAD — index hero
   A brass path winds up and away toward a bright destination.
   The logo mark, made physical.
   ============================================================ */
export function initHeroPath(canvas) {
  const stage = createStage(canvas, { fov: 44, fog: 0.085 });
  const { scene, camera } = stage;

  // the climb: up and to the right, with pullbacks — mark A in 3D
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.2, -2.0, 2.6),
    new THREE.Vector3(-2.6, -1.5, 1.4),
    new THREE.Vector3(-3.1, -0.8, 0.3),
    new THREE.Vector3(-0.9, -0.5, -0.5),
    new THREE.Vector3(0.9, 0.1, -1.5),
    new THREE.Vector3(2.1, 1.0, -3.1),
    new THREE.Vector3(1.4, 1.6, -4.5),
    new THREE.Vector3(3.4, 2.7, -7.2),
  ]);

  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 240, 0.05, 10, false),
    new THREE.MeshStandardMaterial({
      color: BRAND.brass, metalness: 0.7, roughness: 0.35,
      emissive: 0x2e1c07, emissiveIntensity: 1,
    })
  );
  scene.add(tube);

  // bright guide line floating just above the tube
  const guidePts = curve.getPoints(240).map((p) => p.clone().add(new THREE.Vector3(0, 0.07, 0)));
  const guide = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(guidePts),
    new THREE.LineBasicMaterial({
      color: BRAND.brassBright, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  scene.add(guide);

  // destination: the dot
  const dest = curve.getPointAt(1);
  const destCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xF7E7C4 })
  );
  destCore.position.copy(dest);
  scene.add(destCore);
  const destGlow = glowSprite('rgba(247,231,196,0.9)', 'rgba(201,133,58,0.35)', 3.4);
  destGlow.position.copy(dest);
  scene.add(destGlow);
  const destLight = new THREE.PointLight(BRAND.brassBright, 26, 16, 2);
  destLight.position.copy(dest);
  scene.add(destLight);

  // traveling pulse
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 12),
    new THREE.MeshBasicMaterial({ color: BRAND.pearl })
  );
  scene.add(pulse);
  const pulseGlow = glowSprite('rgba(242,239,231,0.85)', 'rgba(242,239,231,0.12)', 0.9);
  scene.add(pulseGlow);

  // atmosphere
  const dust = dustField(240, [14, 8, 12]);
  scene.add(dust);
  scene.add(new THREE.AmbientLight(BRAND.steel, 1.1));
  const key = new THREE.DirectionalLight(0x8fa2c0, 1.4);
  key.position.set(-4, 5, 4);
  scene.add(key);

  camera.position.set(0, 0.4, 6.4);
  const look = new THREE.Vector3(0.5, 0.7, -1.5);
  const pointer = pointerParallax(canvas.parentElement || canvas);

  stage.frame = (t) => {
    const p = pointer();
    camera.position.x = p.x * 0.42 + Math.sin(t * 0.0035) * 0.16;
    camera.position.y = 0.4 - p.y * 0.24 + Math.cos(t * 0.0028) * 0.1;
    camera.lookAt(look);

    const glowPulse = 0.82 + Math.sin(t * 0.03) * 0.18;
    destGlow.scale.setScalar(3.4 * glowPulse);
    destLight.intensity = 26 * glowPulse;

    const tt = (t * 0.0016) % 1;
    const pp = curve.getPointAt(tt);
    pulse.position.copy(pp);
    pulseGlow.position.copy(pp);

    dust.rotation.y = t * 0.00022;
  };
  stage.start();
}

/* ============================================================
   2 · THE CLIMB — services · the Stravio Stack
   Five tiers, one operating model. Scroll moves through it.
   ============================================================ */
export function initStack(canvas, { onPick } = {}) {
  const stage = createStage(canvas, { fov: 36, fog: 0 });
  const { scene, camera, renderer } = stage;

  const TIERS = 5;               // index 0 = Architect (apex) … 4 = Orchestrator (base)
  const H = 0.42, GAP = 0.14;
  const group = new THREE.Group();
  scene.add(group);

  const tiers = [];
  for (let i = 0; i < TIERS; i++) {
    const half = 0.95 + i * 0.42;                       // apex narrow, base wide
    const y = (TIERS - 1 - i) * (H + GAP) + H / 2;      // apex on top
    const mat = new THREE.MeshStandardMaterial({
      color: BRAND.steelDeep, metalness: 0.4, roughness: 0.55,
      emissive: 0x000000, emissiveIntensity: 1,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(half * 2, H, half * 2), mat);
    mesh.position.y = y;
    mesh.userData.index = i;
    group.add(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: BRAND.pearl, transparent: true, opacity: 0.14 })
    );
    edges.position.y = y;
    group.add(edges);
    tiers.push({ mesh, edges, baseY: y, mat });
  }

  // spine: the path runs through the whole stack
  const topY = (TIERS - 1) * (H + GAP) + H;
  const spine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, topY + 0.9, 0),
    ]),
    new THREE.LineBasicMaterial({ color: BRAND.brassBright, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(spine);
  const apexDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xF7E7C4 })
  );
  apexDot.position.y = topY + 0.9;
  scene.add(apexDot);
  const apexGlow = glowSprite('rgba(247,231,196,0.85)', 'rgba(201,133,58,0.3)', 1.6);
  apexGlow.position.y = topY + 0.9;
  scene.add(apexGlow);

  scene.add(new THREE.AmbientLight(BRAND.steel, 1.5));
  const key = new THREE.DirectionalLight(0xbfd0e8, 2.2);
  key.position.set(5, 8, 6);
  scene.add(key);
  const warm = new THREE.PointLight(BRAND.brassBright, 10, 14, 2);
  warm.position.set(-3, topY + 1.5, 3);
  scene.add(warm);

  const mid = topY / 2;

  // framing: the whole stack, through its full sway, must stay inside the canvas —
  // never crop the base corners (the "window" effect). Distance is computed from the
  // live canvas aspect so every viewport fits, and recomputed on resize.
  const LOOK = new THREE.Vector3(0, mid, 0);
  const VIEW_DIR = new THREE.Vector3(6.3, 3.5, 9.2).normalize();
  const SWAY_AMP = 0.24, SWAY_OFF = -0.12;
  const FIT_MARGIN = 0.92;
  const viewBasis = new THREE.Matrix4().lookAt(VIEW_DIR, new THREE.Vector3(0, 0, 0), camera.up);
  const rHat = new THREE.Vector3().setFromMatrixColumn(viewBasis, 0);
  const uHat = new THREE.Vector3().setFromMatrixColumn(viewBasis, 1);
  const fHat = new THREE.Vector3().setFromMatrixColumn(viewBasis, 2).negate();

  function fitCamera() {
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * FIT_MARGIN;
    const th = tv * camera.aspect;
    const e = new THREE.Vector3();
    let d = 4;
    const consider = (x, y, z, pad) => {
      e.set(x, y - LOOK.y, z);
      const ex = Math.abs(e.dot(rHat)) + pad;
      const ey = Math.abs(e.dot(uHat)) + pad;
      const ez = e.dot(fHat);
      d = Math.max(d, ex / th - ez, ey / tv - ez);
    };
    for (let s = 0; s <= 12; s++) {
      const a = (SWAY_OFF - SWAY_AMP) + (s / 12) * SWAY_AMP * 2;
      const c = Math.cos(a), n = Math.sin(a);
      tiers.forEach((tier, i) => {
        const h = 0.95 + i * 0.42;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const x = sx * h * c - sz * h * n;
          const z = sx * h * n + sz * h * c;
          consider(x, tier.baseY - H / 2, z, 0);
          consider(x, tier.baseY + H / 2, z, 0);
        }
      });
    }
    consider(0, topY + 0.9, 0, 0.8); // apex dot + glow halo
    camera.position.copy(LOOK).addScaledVector(VIEW_DIR, d);
    camera.lookAt(LOOK);
  }
  fitCamera();

  let active = 0;
  const BRASS = new THREE.Color(BRAND.brass);
  const DONE = new THREE.Color(0x7a5527);
  const INACTIVE = new THREE.Color(BRAND.steelDeep);

  function paint() {
    tiers.forEach(({ mat, edges }, i) => {
      if (i === active) {
        mat.color.copy(BRASS); mat.emissive.setHex(0x5a3a12); mat.metalness = 0.6; mat.roughness = 0.38;
        edges.material.opacity = 0.35;
      } else if (i < active) {
        mat.color.copy(DONE); mat.emissive.setHex(0x1e1305);
        edges.material.opacity = 0.2;
      } else {
        mat.color.copy(INACTIVE); mat.emissive.setHex(0x000000);
        edges.material.opacity = 0.14;
      }
    });
  }
  paint();

  // click a tier to jump to its step
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(tiers.map((t) => t.mesh))[0];
    canvas.style.cursor = hit ? 'pointer' : 'default';
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(tiers.map((t) => t.mesh))[0];
    if (hit && onPick) onPick(hit.object.userData.index);
  });

  let lastAspect = camera.aspect;
  stage.frame = (t) => {
    if (camera.aspect !== lastAspect) { lastAspect = camera.aspect; fitCamera(); }
    group.rotation.y = Math.sin(t * 0.0032) * SWAY_AMP + SWAY_OFF;
    tiers.forEach((tier, i) => {
      const bob = i === active && !reduceMotion ? Math.sin(t * 0.045) * 0.045 : 0;
      tier.mesh.position.y = tier.baseY + bob;
      tier.edges.position.y = tier.baseY + bob;
      tier.edges.rotation.y = tier.mesh.rotation.y;
    });
    const pulse = 0.8 + Math.sin(t * 0.04) * 0.2;
    apexGlow.scale.setScalar(1.6 * pulse);
  };
  stage.start();

  return {
    setActive(i) {
      if (i === active) return;
      active = i;
      paint();
      if (reduceMotion) stage.render();
    },
  };
}

/* ============================================================
   3 · THE ROAD TRAVELED — about · waypoints along the path
   Scroll lights the road from the first stop to Stravio.
   ============================================================ */
export function initJourney(canvas, waypointTs = [0.06, 0.37, 0.66, 0.95]) {
  const stage = createStage(canvas, { fov: 42, fog: 0.06 });
  const { scene, camera } = stage;

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.0, -1.1, 1.8),
    new THREE.Vector3(-2.0, -0.75, 0.6),
    new THREE.Vector3(-2.5, -0.25, -0.5),
    new THREE.Vector3(0.1, 0.0, -0.2),
    new THREE.Vector3(1.3, 0.6, -1.6),
    new THREE.Vector3(3.2, 1.5, -3.6),
  ]);

  // the whole road, unlit steel
  const road = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 200, 0.035, 8, false),
    new THREE.MeshStandardMaterial({ color: BRAND.steel, metalness: 0.4, roughness: 0.6 })
  );
  scene.add(road);

  // the lit portion, revealed by scroll via drawRange
  const litGeo = new THREE.TubeGeometry(curve, 200, 0.045, 8, false);
  const litIndexCount = litGeo.index.count;
  litGeo.setDrawRange(0, 0);
  const lit = new THREE.Mesh(
    litGeo,
    new THREE.MeshStandardMaterial({
      color: BRAND.brass, metalness: 0.7, roughness: 0.35, emissive: 0x3a250b,
    })
  );
  scene.add(lit);

  // waypoints
  const wps = waypointTs.map((wt) => {
    const pos = curve.getPointAt(wt);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 16),
      new THREE.MeshStandardMaterial({ color: BRAND.steel, metalness: 0.5, roughness: 0.45, emissive: 0x000000 })
    );
    core.position.copy(pos);
    scene.add(core);
    const glow = glowSprite('rgba(247,231,196,0.8)', 'rgba(201,133,58,0.28)', 1.0);
    glow.position.copy(pos);
    glow.material.opacity = 0;
    scene.add(glow);
    return { t: wt, core, glow };
  });

  // traveler
  const traveler = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 12),
    new THREE.MeshBasicMaterial({ color: BRAND.pearl })
  );
  scene.add(traveler);
  const travelerGlow = glowSprite('rgba(242,239,231,0.9)', 'rgba(242,239,231,0.14)', 1.0);
  scene.add(travelerGlow);
  const travelerLight = new THREE.PointLight(BRAND.brassBright, 8, 6, 2);
  scene.add(travelerLight);

  scene.add(dustField(180, [12, 6, 10], 0.018, 0.3));
  scene.add(new THREE.AmbientLight(BRAND.steel, 1.2));
  const key = new THREE.DirectionalLight(0x8fa2c0, 1.5);
  key.position.set(-3, 6, 5);
  scene.add(key);

  camera.position.set(0, 1.5, 5.8);
  const look = new THREE.Vector3(0, 0.2, -0.8);
  const pointer = pointerParallax(canvas.parentElement || canvas);

  let progress = 0, eased = 0, activeWp = 0;

  stage.frame = (t) => {
    eased += (progress - eased) * (reduceMotion ? 1 : 0.07);
    lit.geometry.setDrawRange(0, Math.floor(litIndexCount * Math.min(1, eased * 1.02)));

    const pos = curve.getPointAt(Math.min(1, Math.max(0.001, eased)));
    traveler.position.copy(pos);
    travelerGlow.position.copy(pos);
    travelerLight.position.copy(pos);

    wps.forEach((w, i) => {
      const reached = eased >= w.t - 0.02;
      const isActive = i === activeWp;
      w.core.material.color.setHex(reached ? BRAND.brass : BRAND.steel);
      w.core.material.emissive.setHex(reached ? 0x5a3a12 : 0x000000);
      const targetGlow = isActive && reached ? 0.9 : reached ? 0.35 : 0;
      w.glow.material.opacity += (targetGlow - w.glow.material.opacity) * 0.08;
      const s = isActive && reached ? 1.25 + Math.sin(t * 0.05) * 0.1 : 1.0;
      w.glow.scale.setScalar(s);
    });

    const p = pointer();
    camera.position.x = p.x * 0.3;
    camera.position.y = 1.5 - p.y * 0.18;
    camera.lookAt(look);
  };
  stage.start();

  return {
    setProgress(p, seg) {
      progress = p;
      activeWp = seg;
      if (reduceMotion) stage.render();
    },
  };
}

/* ============================================================
   4 · ARRIVAL — contact · the last leg of the journey
   One fixed scene behind the whole page: the brass path sweeps
   in from deep space past the planets; scrolling travels the
   final stretch and lands at the dot, where the form waits.
   Composition rule (D19): beat 1 the path owns the center-right
   while copy pins left; beat 2 the dot lands left while the
   form owns the right. The road never sits behind copy.
   ============================================================ */
export function initArrival(canvas) {
  const stage = createStage(canvas, { fov: 46, fog: 0.045 });
  const { scene, camera } = stage;

  // arrival is one still frame: copy owns the left column, the form owns the
  // right, and the road weaves the center band — passing LEFT of the system,
  // never through a planet — down to the dot at lower center.
  const DOT = new THREE.Vector3(-0.5, -1.0, 0.8);

  // the last leg, weaving in from deep space — enters LEFT of the system
  const approach = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.4, 2.7, -15.5),
    new THREE.Vector3(-2.4, 1.9, -11),
    new THREE.Vector3(0.4, 1.2, -7),
    new THREE.Vector3(-1.6, 0.3, -3.5),
    new THREE.Vector3(-0.5, -0.5, -0.8),
    DOT.clone(),
  ]);

  // flat track, same build as the homepage road (deck + edge rails, D17 —
  // a ridable road, never a tube)
  const TRACK_W = 0.46;
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
  const track = buildTrack(approach, 320, TRACK_W);
  scene.add(new THREE.Mesh(
    track.geo,
    new THREE.MeshStandardMaterial({
      color: BRAND.brass, metalness: 0.6, roughness: 0.42,
      emissive: 0x2e1c07, emissiveIntensity: 1, side: THREE.DoubleSide,
    })
  ));
  const railMat = new THREE.MeshStandardMaterial({
    color: BRAND.brassBright, metalness: 0.75, roughness: 0.3,
    emissive: 0x4a2f0e, emissiveIntensity: 1,
  });
  const every8 = (pts) => pts.filter((_, i) => i % 8 === 0);
  for (const edge of [track.leftPts, track.rightPts]) {
    const railPts = every8(edge);
    scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 240, 0.02, 8, false),
      railMat
    ));
    // cap the tubes: open mouths read as dark see-through arches at the ends.
    // Caps stay flush with the rail radius and wear the DECK's brass, so the
    // tips sit in the same color register as the rest of the track.
    const capMat = new THREE.MeshStandardMaterial({
      color: BRAND.brass, metalness: 0.6, roughness: 0.42,
      emissive: 0x2e1c07, emissiveIntensity: 1,
    });
    for (const end of [railPts[0], railPts[railPts.length - 1]]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), capMat);
      cap.position.copy(end);
      scene.add(cap);
    }
  }
  // soft spill of light across the terminus — the deck edge and rail ends
  // melt into the glow instead of finishing on a hard rim
  const spill = glowSprite('rgba(250,236,210,0.6)', 'rgba(242,210,160,0.22)', 0.52);
  spill.position.copy(DOT).add(new THREE.Vector3(0, 0.02, 0.18));
  scene.add(spill);
  const guidePts = approach.getPoints(320).map((p) => p.clone().add(new THREE.Vector3(0, 0.03, 0)));
  const guide = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(guidePts),
    new THREE.LineBasicMaterial({
      color: BRAND.brassBright, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  scene.add(guide);

  // the destination — pure light, same treatment as the homepage (no solid ball, D20).
  // It sits just BELOW and beyond the track's end, never on top of it: centering it
  // on the end cap silhouettes the deck inside the glow and reads as a tunnel mouth.
  const GLOW = new THREE.Vector3(-0.51, -1.08, 0.92);
  const destHot = glowSprite('rgba(255,248,232,0.95)', 'rgba(247,231,196,0.5)', 1.6);
  destHot.position.copy(GLOW);
  scene.add(destHot);
  const halo = glowSprite('rgba(247,231,196,0.75)', 'rgba(201,133,58,0.3)', 3.9);
  halo.position.copy(GLOW);
  scene.add(halo);
  const light = new THREE.PointLight(BRAND.brassBright, 40, 40, 1.6);
  light.position.copy(GLOW).add(new THREE.Vector3(0.5, 0.7, 1.0));
  scene.add(light);

  // the system you navigate on the way in
  function planet(r, x, y, z, ringed) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, 36, 36),
      new THREE.MeshStandardMaterial({ color: BRAND.steelDeep, metalness: 0.35, roughness: 0.7, emissive: 0x0a1120, emissiveIntensity: 0.7 })
    ));
    if (ringed) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r * 1.45, r * 2.0, 64),
        new THREE.MeshBasicMaterial({ color: BRAND.brass, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 2.4;
      g.add(ring);
    }
    g.position.set(x, y, z);
    scene.add(g);
    return g;
  }
  const planets = [
    planet(1.15, 4.2, 1.9, -15.5, true),  // the ringed one — clear sky between ring and road
    planet(0.5, 1.9, -0.8, -6.2, false),
    planet(0.9, -4.8, 2.9, -13, false),   // upper left, above the copy column
  ];

  // slow orbit of pearl particles — everything gathers at the destination
  const ORBIT = 420;
  const opos = new Float32Array(ORBIT * 3);
  for (let i = 0; i < ORBIT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.2 + Math.random() * 2.6;
    opos[i * 3] = Math.cos(a) * r;
    opos[i * 3 + 1] = (Math.random() - 0.5) * 0.9 * (r / 3);
    opos[i * 3 + 2] = Math.sin(a) * r;
  }
  const orbitGeo = new THREE.BufferGeometry();
  orbitGeo.setAttribute('position', new THREE.BufferAttribute(opos, 3));
  const orbit = new THREE.Points(orbitGeo, new THREE.PointsMaterial({
    color: BRAND.pearl, size: 0.02, transparent: true, opacity: 0.45, depthWrite: false,
  }));
  orbit.rotation.x = 0.28;
  orbit.position.copy(GLOW);
  scene.add(orbit);

  // the ship, flying the last leg home — same craft as the homepage
  const ship = new THREE.Group();
  const shipBody = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.22, 12),
    new THREE.MeshStandardMaterial({
      color: BRAND.pearl, metalness: 0.35, roughness: 0.3,
      emissive: 0xd8d0c0, emissiveIntensity: 0.85,
    })
  );
  shipBody.geometry.rotateX(Math.PI / 2);
  ship.add(shipBody);
  ship.add(glowSprite('rgba(242,239,231,0.8)', 'rgba(242,239,231,0.12)', 0.7));
  ship.add(new THREE.PointLight(BRAND.pearl, 2.5, 3, 2));
  scene.add(ship);
  const HOVER = new THREE.Vector3(0, 0.09, 0);
  const shipAhead = new THREE.Vector3();

  // deep space
  scene.add(dustField(520, [34, 18, 30], 0.02, 0.4));
  scene.add(dustField(80, [28, 16, 24], 0.05, 0.75));
  scene.add(new THREE.AmbientLight(BRAND.steel, 1.05));
  const key = new THREE.DirectionalLight(0x8fa2c0, 1.1);
  key.position.set(-4, 6, 5);
  scene.add(key);

  // one still frame: gentle drift and pointer parallax only — no scroll travel
  const pointer = pointerParallax(canvas.parentElement || canvas);
  const BASE = new THREE.Vector3(0, 0.55, 6.2);
  const LOOK = new THREE.Vector3(0.15, 0.35, -3);

  stage.frame = (t) => {
    const p = pointer();
    camera.position.set(
      BASE.x + p.x * 0.28 + Math.sin(t * 0.0032) * 0.08,
      BASE.y - p.y * 0.2 + Math.cos(t * 0.0026) * 0.05,
      BASE.z
    );
    camera.lookAt(LOOK);

    const breathe = 0.85 + Math.sin(t * 0.022) * 0.15;
    halo.scale.setScalar(3.9 * breathe);
    destHot.scale.setScalar(1.6 * (0.92 + Math.sin(t * 0.028) * 0.08));
    light.intensity = 36 * breathe;
    orbit.rotation.y = t * 0.0011;
    planets[0].rotation.y = t * 0.0009;
    planets[1].rotation.y = -t * 0.0013;
    planets[2].rotation.y = t * 0.0007;

    const tt = (t * 0.0013) % 1;
    ship.position.copy(approach.getPointAt(tt)).add(HOVER);
    approach.getPointAt(Math.min(1, tt + 0.008), shipAhead).add(HOVER);
    ship.lookAt(shipAhead);
  };
  stage.start();
}
