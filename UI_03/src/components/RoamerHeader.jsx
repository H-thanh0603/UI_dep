import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tent, ArrowUpRight, Compass, Menu, X } from 'lucide-react'

const VIDEO_SRC =
  'https://cdn.jiro.build/Jahid/Test/Panda%20with%20nature.mp4'
const CARD_ONE =
  'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80'
const CARD_TWO =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'

const EASE = [0.16, 1, 0.3, 1]
const NAV_LINKS = ['Destinations', 'Experiences', 'Stories']

const css = [
  ".roamer-root { position: relative; width: 100%; height: 100vh; min-height: 100vh; overflow: hidden; background: #030712; font-family: 'Parkinsans', sans-serif; color: #FEFFFF; }",
  '.roamer-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none; }',
  '.roamer-canvas-wrap { position: absolute; inset: 0; z-index: 1; pointer-events: none; }',
  '.roamer-canvas-wrap canvas { display: block; width: 100%; height: 100%; }',
  '.roamer-overlay { position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding: 28px 48px 24px 48px; box-sizing: border-box; }',

  '.roamer-nav { display: flex; align-items: center; justify-content: space-between; gap: 24px; }',
  '.roamer-brand { font-weight: 500; font-size: 26px; letter-spacing: 0.32em; text-transform: uppercase; color: #FEFFFF; text-decoration: none; transition: opacity 0.25s ease; }',
  '.roamer-brand:hover { opacity: 0.85; }',
  '.roamer-nav-center { display: flex; align-items: center; gap: 20px; }',
  '.roamer-nav-link { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; font-weight: 400; font-size: 15px; color: rgba(254,255,255,0.85); transition: color 0.25s ease; }',
  '.roamer-nav-link:hover { color: #FEFFFF; }',
  '.roamer-nav-divider { display: inline-block; width: 36px; height: 1px; background: rgba(254,255,255,0.35); }',

  '.roamer-roll-box { display: inline-flex; position: relative; overflow: hidden; height: 1.3em; line-height: 1.3em; }',
  '.roamer-roll-item { display: inline-block; white-space: nowrap; transition: transform 0.42s cubic-bezier(0.22,1,0.36,1); }',
  '.roamer-roll-top { position: absolute; top: 0; left: 0; right: 0; transform: translateY(-100%); }',
  '.roamer-roll-box:hover .roamer-roll-main { transform: translateY(100%); }',
  '.roamer-roll-box:hover .roamer-roll-top { transform: translateY(0); }',

  '.roamer-cta { display: inline-flex; align-items: center; gap: 12px; background: #FEFFFF; color: #0A0D14; border: none; border-radius: 8px; padding: 6px 6px 6px 18px; font-family: inherit; font-weight: 500; font-size: 14px; cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,0.25); transition: transform 0.3s ease, background 0.3s ease; }',
  '.roamer-cta:hover { transform: translateY(-2px); background: #E2E8F0; }',
  '.roamer-cta-icon { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 5px; background: #0A0D14; color: #FEFFFF; }',
  '.roamer-menu-btn { display: none; align-items: center; justify-content: center; width: 42px; height: 42px; background: rgba(9,17,32,0.7); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #FEFFFF; cursor: pointer; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }',

  '.roamer-glass-card { position: relative; max-width: 486px; margin-top: clamp(28px, 7vh, 96px); border-radius: 14px; padding: 16px; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); background: rgba(255,255,255,0.01); }',
  '.roamer-glass-card::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; background: linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.08) 75%, rgba(255,255,255,0.28) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: exclude; }',
  '.roamer-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }',
  '.roamer-subcard { display: flex; flex-direction: column; gap: 8px; }',
  '.roamer-thumb { height: 116px; border-radius: 8px; overflow: hidden; }',
  '.roamer-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); }',
  '.roamer-subcard:hover .roamer-thumb img { transform: scale(1.05); }',
  '.roamer-card-label { background: rgba(26,40,66,0.88); color: #FEFFFF; border: none; border-radius: 6px; padding: 9px 10px; font-family: inherit; font-weight: 400; font-size: 13px; cursor: pointer; text-align: left; }',
  '.roamer-card-desc { margin: 14px 2px 0 2px; font-weight: 300; font-size: 16px; line-height: 1.55; color: rgba(254,255,255,0.9); }',

  '.roamer-bottom-section { margin-top: auto; padding-top: 28px; }',
  '.roamer-bottom-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }',
  '.roamer-main-headline { margin: 0; font-weight: 400; font-size: 68px; line-height: 1.08; letter-spacing: -0.02em; text-shadow: 0 4px 28px rgba(0,0,0,0.6); }',
  '.roamer-headline-line { display: block; }',
  '.roamer-bottom-desc { max-width: 580px; font-weight: 300; font-size: 20px; line-height: 1.55; color: rgba(254,255,255,0.92); }',
  '.roamer-bottom-desc p { margin: 0; }',
  '.roamer-bottom-sub { margin-top: 10px !important; color: rgba(254,255,255,0.78); }',

  '.roamer-footer-bar { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; margin-top: 26px; border-top: 1px solid rgba(255,255,255,0.18); }',
  '.roamer-metric { display: inline-flex; align-items: center; gap: 8px; font-weight: 300; font-size: 16px; letter-spacing: 0.02em; color: rgba(254,255,255,0.88); }',

  '@media (max-width: 1024px) {',
  '  .roamer-glass-card, .roamer-cta, .roamer-nav-center { display: none; }',
  '  .roamer-menu-btn { display: inline-flex; }',
  '  .roamer-overlay { padding: 22px 24px 18px 24px; }',
  '  .roamer-bottom-section { display: flex; flex-direction: column; justify-content: space-between; flex: 1; }',
  '  .roamer-bottom-sub { display: none; }',
  '}',

  '@media (min-width: 641px) and (max-width: 1024px) {',
  '  .roamer-bottom-row { flex-direction: column; align-items: flex-start; max-width: 500px; gap: 18px; }',
  '  .roamer-main-headline { font-size: 48px; }',
  '  .roamer-bottom-desc { font-size: 16px; max-width: 440px; }',
  '}',

  '@media (max-width: 640px) {',
  '  .roamer-overlay { padding: 18px 16px 14px 16px; }',
  '  .roamer-brand { font-size: 20px; letter-spacing: 0.22em; }',
  '  .roamer-main-headline { font-size: 36px; }',
  '  .roamer-bottom-row { flex-direction: column; align-items: flex-start; gap: 14px; }',
  '  .roamer-bottom-desc { font-size: 16px; max-width: 100%; }',
  '  .roamer-footer-bar { flex-direction: column; align-items: flex-start; gap: 8px; }',
  '}',
].join('\n')

function AnimatedText({ text, baseDelay = 0, stagger = 0.02, className = '' }) {
  let index = -1
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span
          key={wi}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            marginRight: wi === words.length - 1 ? 0 : '0.28em',
          }}
        >
          {word.split('').map((char, ci) => {
            index += 1
            return (
              <motion.span
                key={ci}
                style={{ display: 'inline-block' }}
                initial={{ opacity: 0, filter: 'blur(10px)', x: -14 }}
                animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                transition={{
                  duration: 0.65,
                  ease: EASE,
                  delay: baseDelay + index * stagger,
                }}
              >
                {char}
              </motion.span>
            )
          })}
        </span>
      ))}
    </span>
  )
}

function RollingLabel({ label }) {
  return (
    <span className="roamer-roll-box">
      <span className="roamer-roll-item roamer-roll-main">{label}</span>
      <span className="roamer-roll-item roamer-roll-top" aria-hidden="true">
        {label}
      </span>
    </span>
  )
}

const VERT = [
  'attribute vec2 aPos;',
  'varying vec2 vUv;',
  'void main() {',
  '  vUv = aPos * 0.5 + 0.5;',
  '  gl_Position = vec4(aPos, 0.0, 1.0);',
  '}',
].join('\n')

const NOISE = [
  'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'float noise(vec2 p) {',
  '  vec2 i = floor(p); vec2 f = fract(p);',
  '  f = f * f * (3.0 - 2.0 * f);',
  '  float a = hash(i); float b = hash(i + vec2(1.0, 0.0));',
  '  float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));',
  '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
  '}',
  'float fbm(vec2 p) {',
  '  float v = 0.0; float a = 0.5;',
  '  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }',
  '  return v;',
  '}',
].join('\n')

const VEL_FRAG = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uPrev;',
  'uniform vec2 uTexel;',
  'uniform vec2 uMouse;',
  'uniform vec2 uMouseVel;',
  'uniform float uActive;',
  'vec2 dec(vec2 e) { return e * 2.0 - 1.0; }',
  'vec2 enc(vec2 v) { return v * 0.5 + 0.5; }',
  'void main() {',
  '  vec2 v = dec(texture2D(uPrev, vUv).xy);',
  '  vec2 adv = dec(texture2D(uPrev, vUv - v * 0.02).xy);',
  '  v = mix(v, adv, 0.6);',
  '  vec2 l = dec(texture2D(uPrev, vUv + vec2(-uTexel.x, 0.0)).xy);',
  '  vec2 r = dec(texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).xy);',
  '  vec2 u = dec(texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).xy);',
  '  vec2 d = dec(texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).xy);',
  '  v = v * 0.86 + (l + r + u + d) * 0.035;',
  '  v *= 0.94;',
  '  if (length(v) < 0.02) v = vec2(0.0);',
  '  float dist = length(vUv - uMouse);',
  '  float fall = smoothstep(0.09, 0.0, dist);',
  '  v += uMouseVel * fall * uActive * 1.6;',
  '  v = clamp(v, -1.0, 1.0);',
  '  gl_FragColor = vec4(enc(v), 0.0, 1.0);',
  '}',
].join('\n')

const DYE_FRAG = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uPrevDye;',
  'uniform sampler2D uVel;',
  'uniform vec2 uMouse;',
  'uniform float uActive;',
  'uniform float uTime;',
  NOISE,
  'vec2 dec(vec2 e) { return e * 2.0 - 1.0; }',
  'void main() {',
  '  vec2 v = dec(texture2D(uVel, vUv).xy);',
  '  vec3 prev = texture2D(uPrevDye, vUv - v * 0.02).rgb * 0.966;',
  '  float phase = mod(uTime * 0.22, 3.0);',
  '  vec3 lime = vec3(0.42, 0.86, 0.52);',
  '  vec3 gold = vec3(0.94, 0.78, 0.35);',
  '  vec3 cyan = vec3(0.38, 0.82, 0.88);',
  '  vec3 col = phase < 1.0 ? mix(lime, gold, phase)',
  '    : (phase < 2.0 ? mix(gold, cyan, phase - 1.0) : mix(cyan, lime, phase - 2.0));',
  '  vec2 swirl = vec2(sin(uTime * 3.0 + vUv.y * 8.0), cos(uTime * 2.7 + vUv.x * 8.0)) * 0.02;',
  '  vec2 noiseShift = vec2(fbm(vUv * 4.0 + uTime * 0.1), fbm(vUv * 4.0 + 7.3 - uTime * 0.1));',
  '  float dist = length(vUv - (uMouse + (noiseShift - 0.5) * 0.09));',
  '  float fall = pow(max(0.0, 1.0 - dist / 0.14), 2.0) * uActive;',
  '  float n = fbm(vUv * 5.0 + swirl + uTime * 0.15);',
  '  prev += col * fall * (0.25 + n * 0.8) * 0.4;',
  '  gl_FragColor = vec4(clamp(prev, 0.0, 1.0), 1.0);',
  '}',
].join('\n')

const RENDER_FRAG = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uVideo;',
  'uniform sampler2D uDye;',
  'uniform sampler2D uVel;',
  'uniform vec2 uRes;',
  'uniform vec2 uMouse;',
  'uniform float uHasVideo;',
  'uniform float uVideoAspect;',
  'uniform float uTime;',
  'uniform float uActive;',
  NOISE,
  'vec2 dec(vec2 e) { return e * 2.0 - 1.0; }',
  'vec2 coverUV(vec2 uv) {',
  '  float ca = uRes.x / max(uRes.y, 1.0);',
  '  float va = max(uVideoAspect, 0.0001);',
  '  vec2 s = uv;',
  '  if (ca > va) { s.y = (uv.y - 0.5) * (va / ca) + 0.5; }',
  '  else { s.x = (uv.x - 0.5) * (ca / va) + 0.5; }',
  '  return clamp(s, 0.0, 1.0);',
  '}',
  'vec3 videoAt(vec2 uv) {',
  '  if (uHasVideo > 0.5) {',
  '    return texture2D(uVideo, vec2(coverUV(uv).x, 1.0 - coverUV(uv).y)).rgb;',
  '  }',
  '  return mix(vec3(0.02, 0.05, 0.09), vec3(0.05, 0.12, 0.15), uv.y)',
  '    + vec3(0.03, 0.02, 0.01) * sin(uv.x * 6.0 + uTime);',
  '}',
  'void main() {',
  '  vec2 v = dec(texture2D(uVel, vUv).xy);',
  '  float dist = length(vUv - uMouse);',
  '  float ripple = sin(dist * 40.0 - uTime * 6.0) * 0.002;',
  '  ripple *= smoothstep(0.2, 0.0, dist) * uActive;',
  '  vec2 dir = vUv - uMouse + vec2(0.0001);',
  '  vec2 warp = v * 0.055 + normalize(dir) * ripple;',
  '  vec2 uv = vUv + warp;',
  '  vec2 ab = v * 0.015 + normalize(dir) * ripple * 2.0;',
  '  vec3 vid;',
  '  vid.r = videoAt(uv + ab * 1.4).r;',
  '  vid.g = videoAt(uv).g;',
  '  vid.b = videoAt(uv - ab * 1.4).b;',
  '  vec3 dye = texture2D(uDye, vUv).rgb;',
  '  float wisp = fbm(vUv * 4.0 + uTime * 0.08);',
  '  float luma = dot(vid, vec3(0.299, 0.587, 0.114));',
  '  vec3 col = vid + dye * (0.5 + wisp * 0.45) * (1.0 - 0.65 * luma);',
  '  float fold = smoothstep(0.25, 0.9, length(v));',
  '  fold *= 0.5 + 0.5 * sin(uTime * 2.0 + vUv.y * 14.0);',
  '  col += vec3(0.9, 0.95, 0.8) * fold * 0.06;',
  '  col *= 1.0 - 0.15 * smoothstep(0.4, 1.0, length(vUv - 0.5));',
  '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
  '}',
].join('\n')

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[Roamer] shader compile failed:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function program(gl, vertSrc, fragSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vs || !fs) return null
  const p = gl.createProgram()
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn('[Roamer] program link failed:', gl.getProgramInfoLog(p))
    gl.deleteProgram(p)
    return null
  }
  return p
}

function startFluid(canvas, video, root) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  })
  if (!gl) {
    console.warn('[Roamer] WebGL unavailable — showing video without the fluid effect.')
    return function noop() {}
  }

  const SIM = 256
  const velProg = program(gl, VERT, VEL_FRAG)
  const dyeProg = program(gl, VERT, DYE_FRAG)
  const renderProg = program(gl, VERT, RENDER_FRAG)
  if (!velProg || !dyeProg || !renderProg) return function noop() {}

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

  function bindQuad(prog) {
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  }

  function makeTarget() {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM, SIM, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const fbo = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    return { texture, fbo }
  }

  const velA = makeTarget()
  const velB = makeTarget()
  const dyeA = makeTarget()
  const dyeB = makeTarget()
  // encoded zero velocity is 0.5, not the black a fresh texture starts at
  gl.clearColor(0.5, 0.5, 0, 1)
  ;[velA, velB].forEach((t) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo)
    gl.clear(gl.COLOR_BUFFER_BIT)
  })
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  const videoTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, videoTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([4, 8, 12, 255]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  let videoReady = false
  let videoBroken = false

  const caches = new Map()
  function location(prog, name) {
    if (!caches.has(prog)) caches.set(prog, new Map())
    const cache = caches.get(prog)
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name))
    return cache.get(name)
  }

  const mouse = { x: 0.5, y: 0.5, vx: 0, vy: 0, active: 0 }
  let velARead = velA
  let velBWrite = velB
  let dyeARead = dyeA
  let dyeBWrite = dyeB
  let lastTime = performance.now()
  let time = 0
  let raf = 0
  let stopped = false

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
  }

  function uploadVideo() {
    if (videoBroken || !video || video.readyState < 2 || !video.videoWidth) return
    try {
      gl.bindTexture(gl.TEXTURE_2D, videoTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      videoReady = true
    } catch (err) {
      videoBroken = true
      console.warn('[Roamer] video texture blocked (CORS) — using fallback backdrop.', err)
    }
  }

  function onPointer(e) {
    const rect = root.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    mouse.vx = (nx - mouse.x) * 0.9
    mouse.vy = -(ny - mouse.y) * 0.9
    mouse.x = nx
    // simulation space has y pointing up
    mouse.y = 1 - ny
    mouse.active = 1
  }

  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('resize', resize)
  resize()

  function frame(now) {
    if (stopped) return
    if (videoBroken) {
      // CORS-tainted video can't be sampled: let the raw video show instead of a gradient.
      canvas.style.display = 'none'
      return
    }
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    time += dt

    resize()
    uploadVideo()
    mouse.active *= 0.88
    mouse.vx *= 0.45
    mouse.vy *= 0.45

    const w = canvas.width
    const h = canvas.height

    gl.disable(gl.BLEND)
    gl.viewport(0, 0, SIM, SIM)

    // pass 1 — velocity
    gl.useProgram(velProg)
    bindQuad(velProg)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velBWrite.fbo)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, velARead.texture)
    gl.uniform1i(location(velProg, 'uPrev'), 0)
    gl.uniform2f(location(velProg, 'uTexel'), 1 / SIM, 1 / SIM)
    gl.uniform2f(location(velProg, 'uMouse'), mouse.x, mouse.y)
    gl.uniform2f(location(velProg, 'uMouseVel'), mouse.vx, mouse.vy)
    gl.uniform1f(location(velProg, 'uActive'), mouse.active)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // pass 2 — dye
    gl.useProgram(dyeProg)
    bindQuad(dyeProg)
    gl.bindFramebuffer(gl.FRAMEBUFFER, dyeBWrite.fbo)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, dyeARead.texture)
    gl.uniform1i(location(dyeProg, 'uPrevDye'), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, velARead.texture)
    gl.uniform1i(location(dyeProg, 'uVel'), 1)
    gl.uniform2f(location(dyeProg, 'uMouse'), mouse.x, mouse.y)
    gl.uniform1f(location(dyeProg, 'uActive'), mouse.active)
    gl.uniform1f(location(dyeProg, 'uTime'), time)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // pass 3 — composite to screen
    gl.viewport(0, 0, w, h)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.useProgram(renderProg)
    bindQuad(renderProg)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, videoTex)
    gl.uniform1i(location(renderProg, 'uVideo'), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, dyeARead.texture)
    gl.uniform1i(location(renderProg, 'uDye'), 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, velARead.texture)
    gl.uniform1i(location(renderProg, 'uVel'), 2)
    gl.uniform2f(location(renderProg, 'uRes'), w, h)
    gl.uniform2f(location(renderProg, 'uMouse'), mouse.x, mouse.y)
    gl.uniform1f(location(renderProg, 'uHasVideo'), videoReady ? 1 : 0)
    const aspect = video && video.videoWidth ? video.videoWidth / video.videoHeight : 16 / 9
    gl.uniform1f(location(renderProg, 'uVideoAspect'), aspect)
    gl.uniform1f(location(renderProg, 'uTime'), time)
    gl.uniform1f(location(renderProg, 'uActive'), mouse.active)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // ping-pong swap
    const tmpVel = velARead
    velARead = velBWrite
    velBWrite = tmpVel
    const tmpDye = dyeARead
    dyeARead = dyeBWrite
    dyeBWrite = tmpDye

    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return function cleanup() {
    stopped = true
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('resize', resize)
    ;[velA, velB, dyeA, dyeB].forEach((t) => {
      gl.deleteTexture(t.texture)
      gl.deleteFramebuffer(t.fbo)
    })
    gl.deleteTexture(videoTex)
    gl.deleteBuffer(quad)
    gl.deleteProgram(velProg)
    gl.deleteProgram(dyeProg)
    gl.deleteProgram(renderProg)
  }
}

export default function RoamerHeader() {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const root = rootRef.current
    if (!canvas || !root) return
    return startFluid(canvas, video, root)
  }, [])

  return (
    <section className="roamer-root" ref={rootRef}>
      <style>{css}</style>

      <video
        ref={videoRef}
        className="roamer-video"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
      />

      <div className="roamer-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>

      <div className="roamer-overlay">
        <motion.nav
          className="roamer-nav"
          initial={{ y: -45, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <a className="roamer-brand" href="#top">
            ROAMER
          </a>

          <div className="roamer-nav-center">
            {NAV_LINKS.map((label, i) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '20px' }}>
                {i > 0 && <span className="roamer-nav-divider" />}
                <button className="roamer-nav-link" type="button">
                  <RollingLabel label={label} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="roamer-cta" type="button">
              Plan Your Trip
              <span className="roamer-cta-icon">
                <ArrowUpRight size={15} strokeWidth={2} />
              </span>
            </button>
            <button
              className="roamer-menu-btn"
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </motion.nav>

        <motion.div
          className="roamer-glass-card"
          initial={{ x: -70, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
        >
          <div className="roamer-card-grid">
            {[
              { img: CARD_ONE, label: 'Stargazing Camps', alt: 'Tent under a starry sky' },
              { img: CARD_TWO, label: 'Mountain Getaways', alt: 'Mountain range at golden hour' },
            ].map((card) => (
              <div className="roamer-subcard" key={card.label}>
                <div className="roamer-thumb">
                  <img src={card.img} alt={card.alt} loading="lazy" />
                </div>
                <button className="roamer-card-label" type="button">
                  {card.label}
                </button>
              </div>
            ))}
          </div>
          <p className="roamer-card-desc">
            Explore breathtaking places, from starry skies to serene horizons. Journeys made for
            dreamers.
          </p>
        </motion.div>

        <motion.div
          className="roamer-bottom-section"
          initial={{ y: 55, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.95, delay: 0.35, ease: EASE }}
        >
          <div className="roamer-bottom-row">
            <h1 className="roamer-main-headline">
              <span className="roamer-headline-line">
                <AnimatedText text="Explore —" baseDelay={0.5} />
              </span>
              <span className="roamer-headline-line">
                <AnimatedText text="Discover — Repeat" baseDelay={0.62} />
              </span>
            </h1>
            <div className="roamer-bottom-desc">
              <p>
                <AnimatedText
                  text="Discover stunning destinations, plan unforgettable road trips, and create stories that last a lifetime."
                  baseDelay={0.85}
                  stagger={0.009}
                />
              </p>
              <p className="roamer-bottom-sub">
                From starry nights to mountain escapes, travel made for dreamers like you.
              </p>
            </div>
          </div>

          <motion.div
            className="roamer-footer-bar"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.85, ease: EASE }}
          >
            <span className="roamer-metric">
              <Compass size={17} strokeWidth={1.6} />
              1000+ Destinations Mapped
            </span>
            <span className="roamer-metric">
              <Tent size={17} strokeWidth={1.6} />
              500+ Happy Travelers
            </span>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <div>
            <motion.div
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-[90vw] max-w-[380px] flex-col overflow-y-auto border-l border-white/15 bg-[#091120]/95 p-6 text-[#FEFFFF] backdrop-blur-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-medium uppercase"
                  style={{ fontSize: 20, letterSpacing: '0.24em' }}
                >
                  ROAMER
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="mt-9 flex flex-col gap-5">
                {NAV_LINKS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="text-left text-lg font-light text-white/85"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              <p className="mt-9 text-xs uppercase tracking-[0.2em] text-white/45">
                Featured Escapes
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { img: CARD_ONE, label: 'Stargazing Camps' },
                  { img: CARD_TWO, label: 'Mountain Getaways' },
                ].map((card) => (
                  <div key={card.label} className="flex flex-col gap-2">
                    <div className="h-[92px] overflow-hidden rounded-lg">
                      <img
                        src={card.img}
                        alt={card.label}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="rounded-md bg-[#1a2842] px-2.5 py-2 text-[12px] text-white/90">
                      {card.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm font-light leading-relaxed text-white/75">
                Explore breathtaking places, from starry skies to serene horizons. Journeys made
                for dreamers.
              </p>

              <button
                type="button"
                className="mt-7 flex w-full items-center justify-between rounded-lg bg-[#FEFFFF] px-4 py-3 text-sm font-medium text-[#0A0D14]"
              >
                Plan Your Trip
                <ArrowUpRight size={16} />
              </button>

              <div className="mt-7 flex flex-col gap-2 border-t border-white/15 pt-4 text-[13px] font-light text-white/80">
                <span className="flex items-center gap-2">
                  <Compass size={15} strokeWidth={1.6} /> 1000+ Destinations Mapped
                </span>
                <span className="flex items-center gap-2">
                  <Tent size={15} strokeWidth={1.6} /> 500+ Happy Travelers
                </span>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
