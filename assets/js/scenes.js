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
  camera.position.set(4.6, mid + 2.6, 6.2);
  camera.lookAt(0, mid, 0);

  let active = 0;
  const BRASS = new THREE.Color(BRAND.brass);
  const DONE = new THREE.Color(0x7a5527);
  const TODO = new THREE.Color(BRAND.steelDeep);

  function paint() {
    tiers.forEach(({ mat, edges }, i) => {
      if (i === active) {
        mat.color.copy(BRASS); mat.emissive.setHex(0x5a3a12); mat.metalness = 0.6; mat.roughness = 0.38;
        edges.material.opacity = 0.35;
      } else if (i < active) {
        mat.color.copy(DONE); mat.emissive.setHex(0x1e1305);
        edges.material.opacity = 0.2;
      } else {
        mat.color.copy(TODO); mat.emissive.setHex(0x000000);
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

  stage.frame = (t) => {
    group.rotation.y = Math.sin(t * 0.0032) * 0.3 - 0.15;
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
   4 · ARRIVAL — contact · the destination dot, up close
   The journey across the site ends at the dot in the mark.
   ============================================================ */
export function initArrival(canvas) {
  const stage = createStage(canvas, { fov: 42, fog: 0.05 });
  const { scene, camera } = stage;

  // where the journey ends: low center, out of the copy's way
  const DOT = new THREE.Vector3(0.15, -1.05, 0);

  // the last stretch of road, arriving from the lower left
  const approach = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.5, -3.4, 2.0),
    new THREE.Vector3(-3.6, -2.4, 0.8),
    new THREE.Vector3(-4.0, -1.7, -0.2),
    new THREE.Vector3(-1.7, -1.35, 0.1),
    DOT.clone(),
  ]);
  const road = new THREE.Mesh(
    new THREE.TubeGeometry(approach, 160, 0.035, 8, false),
    new THREE.MeshStandardMaterial({ color: BRAND.brass, metalness: 0.7, roughness: 0.35, emissive: 0x3a250b })
  );
  scene.add(road);

  // the dot
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 40, 40),
    new THREE.MeshStandardMaterial({ color: BRAND.brass, metalness: 0.5, roughness: 0.35, emissive: 0x5a3a12, emissiveIntensity: 1 })
  );
  dot.position.copy(DOT);
  scene.add(dot);
  const halo = glowSprite('rgba(247,231,196,0.75)', 'rgba(201,133,58,0.22)', 2.1);
  halo.position.copy(DOT);
  scene.add(halo);
  const light = new THREE.PointLight(BRAND.brassBright, 24, 18, 2);
  light.position.copy(DOT).add(new THREE.Vector3(0.9, 0.9, 1.4));
  scene.add(light);

  // slow orbit of pearl particles — everything gathers here
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
  orbit.position.copy(DOT);
  scene.add(orbit);

  // last pulse traveling in along the approach road
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 10, 10),
    new THREE.MeshBasicMaterial({ color: BRAND.pearl })
  );
  scene.add(pulse);

  scene.add(new THREE.AmbientLight(BRAND.steel, 1.0));

  camera.position.set(0.3, 0.2, 6.0);
  const pointer = pointerParallax(canvas.parentElement || canvas);

  stage.frame = (t) => {
    const breathe = 0.85 + Math.sin(t * 0.022) * 0.15;
    halo.scale.setScalar(2.1 * breathe);
    light.intensity = 24 * breathe;
    dot.rotation.y = t * 0.002;
    orbit.rotation.y = t * 0.0011;

    const tt = (t * 0.0022) % 1;
    pulse.position.copy(approach.getPointAt(tt));

    const p = pointer();
    camera.position.x = 0.3 + p.x * 0.3;
    camera.position.y = 0.2 - p.y * 0.2;
    camera.lookAt(0.15, -0.35, 0);
  };
  stage.start();
}
