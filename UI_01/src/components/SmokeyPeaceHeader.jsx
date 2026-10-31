import { useEffect, useRef } from 'react'
import './SmokeyPeaceHeader.css'

const SIM_SIZE = 256
const DPR_MAX = 2

const VERT_SRC = [
  'attribute vec2 aPos;',
  'varying vec2 vUv;',
  'void main() {',
  '  vUv = aPos * 0.5 + 0.5;',
  '  gl_Position = vec4(aPos, 0.0, 1.0);',
  '}',
].join('\n')

const VELOCITY_SRC = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uVel;',
  'uniform vec2 uTexel;',
  'uniform vec2 uMouse;',
  'uniform vec2 uMouseDir;',
  'uniform float uAspect;',
  'uniform float uDamp;',
  'uniform float uMouseActive;',
  '',
  'void main() {',
  '  vec2 vel = texture2D(uVel, vUv).xy;',
  '',
  '  vec2 blur = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).xy',
  '            + texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).xy',
  '            + texture2D(uVel, vUv + vec2(0.0, uTexel.y)).xy',
  '            + texture2D(uVel, vUv - vec2(0.0, uTexel.y)).xy;',
  '  blur *= 0.25;',
  '  vel = mix(vel, blur, 0.30);',
  '',
  '  vel *= uDamp;',
  '',
  '  vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);',
  '  float dist = length(d);',
  '  float force = smoothstep(0.20, 0.0, dist);',
  '  vel += uMouseDir * vec2(uAspect, 1.0) * force * 9.0 * uMouseActive;',
  '',
  '  gl_FragColor = vec4(clamp(vel, -1.0, 1.0), 0.0, 1.0);',
  '}',
].join('\n')

const DYE_SRC = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uVel;',
  'uniform sampler2D uDye;',
  'uniform vec2 uMouse;',
  'uniform float uAspect;',
  'uniform float uTime;',
  'uniform vec3 uInjectColor;',
  'uniform float uMouseActive;',
  'uniform float uDt;',
  '',
  'float hash(vec2 p) {',
  '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
  '}',
  '',
  'float noise(vec2 p) {',
  '  vec2 i = floor(p);',
  '  vec2 f = fract(p);',
  '  vec2 u = f * f * (3.0 - 2.0 * f);',
  '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
  '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
  '}',
  '',
  'float fbm(vec2 p) {',
  '  float v = 0.0;',
  '  float a = 0.5;',
  '  for (int i = 0; i < 4; i++) {',
  '    v += a * noise(p);',
  '    p *= 2.02;',
  '    a *= 0.5;',
  '  }',
  '  return v;',
  '}',
  '',
  'void main() {',
  '  vec2 vel = texture2D(uVel, vUv).xy;',
  '  vec2 coord = vUv - vel * uDt;',
  '  vec3 dye = texture2D(uDye, coord).rgb * 0.9965;',
  '',
  '  vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);',
  '  float n = fbm(vUv * 3.5 + vec2(uTime * 0.03, -uTime * 0.02));',
  '  float softDist = length(d) * (0.55 + n);',
  '  float influence = pow(max(0.0, 1.0 - softDist / 0.16), 2.5) * uMouseActive;',
  '  dye += uInjectColor * influence * 0.9;',
  '',
  '  gl_FragColor = vec4(clamp(dye, 0.0, 1.0), 1.0);',
  '}',
].join('\n')

const RENDER_SRC = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform sampler2D uImage;',
  'uniform sampler2D uDye;',
  '',
  'void main() {',
  '  vec3 base = texture2D(uImage, vUv).rgb;',
  '  vec3 dye  = texture2D(uDye, vUv).rgb;',
  '  vec3 col = 1.0 - (1.0 - base) * (1.0 - dye * 1.6);',
  '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
  '}',
].join('\n')

const COOL1 = [0.25, 0.85, 0.9]
const COOL2 = [0.6, 0.95, 1.0]
const WARM1 = [0.45, 0.8, 0.75]

function mix3(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

function compile(gl, type, src) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[SmokeyPeaceHeader] shader error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function makeProgram(gl, fragSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.bindAttribLocation(program, 0, 'aPos')
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[SmokeyPeaceHeader] link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

function createTarget(gl, size, type, filter) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, type, null)

  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  )

  return { texture, framebuffer }
}

const VIDEO_SRC =
  '/proxy-video/Header%20Section/Smokey%20Header/Modern_house_with_infinity_pool_202609031459.mp4'

export default function SmokeyPeaceHeader() {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const sectionRef = useRef(null)

  useEffect(function setupFluid() {
    const canvas = canvasRef.current
    const video = videoRef.current
    const section = sectionRef.current
    if (!canvas || !section) return undefined

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    })
    if (!gl) return undefined

    const floatExt = gl.getExtension('OES_texture_float')
    const floatLinear = gl.getExtension('OES_texture_float_linear')
    const texType = floatExt ? gl.FLOAT : gl.UNSIGNED_BYTE
    const texFilter = floatExt && floatLinear ? gl.LINEAR : gl.NEAREST

    const velocityProgram = makeProgram(gl, VELOCITY_SRC)
    const dyeProgram = makeProgram(gl, DYE_SRC)
    const renderProgram = makeProgram(gl, RENDER_SRC)
    if (!velocityProgram || !dyeProgram || !renderProgram) return undefined

    const velocityUniforms = {
      vel: gl.getUniformLocation(velocityProgram, 'uVel'),
      texel: gl.getUniformLocation(velocityProgram, 'uTexel'),
      mouse: gl.getUniformLocation(velocityProgram, 'uMouse'),
      mouseDir: gl.getUniformLocation(velocityProgram, 'uMouseDir'),
      aspect: gl.getUniformLocation(velocityProgram, 'uAspect'),
      damp: gl.getUniformLocation(velocityProgram, 'uDamp'),
      mouseActive: gl.getUniformLocation(velocityProgram, 'uMouseActive'),
    }

    const dyeUniforms = {
      vel: gl.getUniformLocation(dyeProgram, 'uVel'),
      dye: gl.getUniformLocation(dyeProgram, 'uDye'),
      mouse: gl.getUniformLocation(dyeProgram, 'uMouse'),
      aspect: gl.getUniformLocation(dyeProgram, 'uAspect'),
      time: gl.getUniformLocation(dyeProgram, 'uTime'),
      injectColor: gl.getUniformLocation(dyeProgram, 'uInjectColor'),
      mouseActive: gl.getUniformLocation(dyeProgram, 'uMouseActive'),
      dt: gl.getUniformLocation(dyeProgram, 'uDt'),
    }

    const renderUniforms = {
      image: gl.getUniformLocation(renderProgram, 'uImage'),
      dye: gl.getUniformLocation(renderProgram, 'uDye'),
    }

    let velocityA = createTarget(gl, SIM_SIZE, texType, texFilter)
    let velocityB = createTarget(gl, SIM_SIZE, texType, texFilter)
    let dyeA = createTarget(gl, SIM_SIZE, texType, texFilter)
    let dyeB = createTarget(gl, SIM_SIZE, texType, texFilter)

    // Base image texture — dark fallback until the video exposes frames.
    const imageTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, imageTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([14, 18, 20, 255]),
    )

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    // Autoplay is best-effort: kicked off explicitly so the texture animates
    // even when the attribute alone is ignored. Muted, so no gesture needed.
    if (video) {
      video.muted = true
      const playback = video.play()
      if (playback && typeof playback.catch === 'function') {
        playback.catch(function ignorePlaybackRejection() {})
      }
    }

    const mouse = {
      x: 0.5,
      y: 0.5,
      px: 0.5,
      py: 0.5,
      dx: 0,
      dy: 0,
      active: 0,
      hasMoved: false,
    }

    let rafId = 0
    let running = true
    const startTime = performance.now()

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    function bindQuad(program) {
      const loc = gl.getAttribLocation(program, 'aPos')
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    }

    function drawTo(target) {
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer)
        gl.viewport(0, 0, SIM_SIZE, SIM_SIZE)
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    function handlePointerMove(event) {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const nx = (event.clientX - rect.left) / rect.width
      const ny = 1 - (event.clientY - rect.top) / rect.height
      const dx = nx - mouse.x
      const dy = ny - mouse.y
      mouse.dx = dx
      mouse.dy = dy
      mouse.x = nx
      mouse.y = ny
      mouse.hasMoved = true
      const aspect = rect.width / rect.height
      const speed = Math.sqrt(dx * dx * aspect * aspect + dy * dy)
      if (speed > 0.005) mouse.active = 1
    }

    function handlePointerLeave() {
      mouse.active = 0
    }

    gl.clearColor(0, 0, 0, 1)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityA.framebuffer)
    gl.viewport(0, 0, SIM_SIZE, SIM_SIZE)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityB.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, dyeA.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, dyeB.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    resize()
    window.addEventListener('resize', resize)
    section.addEventListener('pointermove', handlePointerMove)
    section.addEventListener('pointerleave', handlePointerLeave)
    section.addEventListener('pointerdown', handlePointerMove)

    function frame(now) {
      if (!running) return
      rafId = window.requestAnimationFrame(frame)
      if (gl.isContextLost()) return

      resize()

      const time = (now - startTime) / 1000
      const rect = canvas.getBoundingClientRect()
      const aspect = rect.width && rect.height ? rect.width / rect.height : 1

      if (mouse.hasMoved) {
        mouse.active *= 0.88
        if (mouse.active < 0.006) mouse.active = 0
      }

      // Sample the hidden video into the base texture.
      if (video && video.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, imageTexture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      }

      // --- pass 1: velocity (diffuse + damp + soft mouse force) ---
      gl.useProgram(velocityProgram)
      bindQuad(velocityProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, velocityA.texture)
      gl.uniform1i(velocityUniforms.vel, 0)
      gl.uniform2f(velocityUniforms.texel, 1 / SIM_SIZE, 1 / SIM_SIZE)
      gl.uniform2f(velocityUniforms.mouse, mouse.x, mouse.y)
      gl.uniform2f(velocityUniforms.mouseDir, mouse.dx, mouse.dy)
      gl.uniform1f(velocityUniforms.aspect, aspect)
      gl.uniform1f(velocityUniforms.damp, 0.965)
      gl.uniform1f(velocityUniforms.mouseActive, mouse.active)
      drawTo(velocityB)

      // --- pass 2: dye advection + injection ---
      const coolCycle = 0.5 + 0.5 * Math.sin(time * 0.7)
      const cool = mix3(COOL1, COOL2, coolCycle)
      const warmCycle = 0.5 + 0.5 * Math.sin(time * 0.31)
      const inject = mix3(cool, WARM1, warmCycle)

      gl.useProgram(dyeProgram)
      bindQuad(dyeProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, velocityB.texture)
      gl.uniform1i(dyeUniforms.vel, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, dyeA.texture)
      gl.uniform1i(dyeUniforms.dye, 1)
      gl.uniform2f(dyeUniforms.mouse, mouse.x, mouse.y)
      gl.uniform1f(dyeUniforms.aspect, aspect)
      gl.uniform1f(dyeUniforms.time, time)
      gl.uniform3f(dyeUniforms.injectColor, inject[0], inject[1], inject[2])
      gl.uniform1f(dyeUniforms.mouseActive, mouse.active)
      gl.uniform1f(dyeUniforms.dt, 0.015)
      drawTo(dyeB)

      // --- pass 3: screen-blend dye over the video base ---
      gl.useProgram(renderProgram)
      bindQuad(renderProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, imageTexture)
      gl.uniform1i(renderUniforms.image, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, dyeB.texture)
      gl.uniform1i(renderUniforms.dye, 1)
      drawTo(null)

      const swapVelocity = velocityA
      velocityA = velocityB
      velocityB = swapVelocity

      const swapDye = dyeA
      dyeA = dyeB
      dyeB = swapDye
    }

    rafId = window.requestAnimationFrame(frame)

    return function teardown() {
      running = false
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      section.removeEventListener('pointermove', handlePointerMove)
      section.removeEventListener('pointerleave', handlePointerLeave)
      section.removeEventListener('pointerdown', handlePointerMove)

      gl.deleteTexture(velocityA.texture)
      gl.deleteTexture(velocityB.texture)
      gl.deleteTexture(dyeA.texture)
      gl.deleteTexture(dyeB.texture)
      gl.deleteFramebuffer(velocityA.framebuffer)
      gl.deleteFramebuffer(velocityB.framebuffer)
      gl.deleteFramebuffer(dyeA.framebuffer)
      gl.deleteFramebuffer(dyeB.framebuffer)
      gl.deleteTexture(imageTexture)
      gl.deleteBuffer(quad)
      gl.deleteProgram(velocityProgram)
      gl.deleteProgram(dyeProgram)
      gl.deleteProgram(renderProgram)

      velocityA = null
      velocityB = null
      dyeA = null
      dyeB = null
    }
  }, [])

  return (
    <section className="smokeH-section" ref={sectionRef}>
      <video
        ref={videoRef}
        className="smokeH-video"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        aria-hidden="true"
      />

      <div className="smokeH-canvas-wrap">
        <canvas ref={canvasRef} className="smokeH-canvas" />
      </div>

      <div className="smokeH-navbar-left">
        <span className="smokeH-vector">
          <svg viewBox="0 0 36 23" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M0 6.64258L36.24 0.892578V5.07258L6.48 9.53258L30.96 8.18258L29.64 12.0526L8.4 12.6826L20.88 15.6526L18 19.3426L0 6.64258Z" />
          </svg>
        </span>
        <span className="smokeH-wordmark">FANCE</span>
      </div>

      <nav className="smokeH-navbar-right">
        {['Home', 'About', 'Journal', 'Contact'].map(function (label) {
          return (
            <button key={label} type="button" className="smokeH-nav-btn">
              <span className="smokeH-roll">
                <span className="smokeH-nav-label smokeH-roll-text">{label}</span>
                <span className="smokeH-nav-label smokeH-roll-text" aria-hidden="true">
                  {label}
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="smokeH-content-center">
        <h1 className="smokeH-heading">
          A Quiet Escape,
          <br />
          Beautifully Designed
        </h1>

        <button type="button" className="smokeH-cta">
          <span className="smokeH-roll">
            <span className="smokeH-cta-label smokeH-roll-text">Explore the Space</span>
            <span className="smokeH-cta-label smokeH-roll-text" aria-hidden="true">
              Explore the Space
            </span>
          </span>
        </button>
      </div>
    </section>
  )
}
