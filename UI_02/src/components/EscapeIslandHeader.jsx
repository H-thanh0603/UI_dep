import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './EscapeIslandHeader.css'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_SRC =
  'https://cdn.jiro.build/Header%20Section/Island%20ESCAPE/output.mp4'

const TRAIL_LENGTH = 16
const TRAIL_AGE_STEP = 0.015
const HOVER_LERP = 0.05
const PLANE_SEGMENTS = 128

/* ------------------------------------------------------------------ shaders */

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uVideo;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uHoverState;
  uniform vec3 uTrail[${TRAIL_LENGTH}];

  varying vec2 vUv;

  void main() {
    float screenAspect = uResolution.x / max(uResolution.y, 1.0);
    float imageAspect = uImageResolution.x / max(uImageResolution.y, 1.0);

    // background-size: cover
    vec2 ratio = vec2(
      min(screenAspect / imageAspect, 1.0),
      min(imageAspect / screenAspect, 1.0)
    );

    // screen uv -> cover uv
    vec2 uv = vUv * ratio + (1.0 - ratio) * 0.5;

    vec2 totalDistortion = vec2(0.0);

    for (int i = 0; i < ${TRAIL_LENGTH}; i++) {
      vec3 point = uTrail[i];
      float age = point.z;

      // trail points live in screen space; bring them into cover space
      vec2 origin = point.xy * ratio + (1.0 - ratio) * 0.5;
      vec2 dir = (uv - origin) * vec2(screenAspect, 1.0);

      float dist = length(dir);
      float wave = sin(dist * 40.0 - age * 30.0);
      float maxRadius = 0.1 + age * 0.3;
      float dampen = smoothstep(maxRadius, 0.0, dist);
      float fade = 1.0 - smoothstep(0.0, 1.0, age);

      totalDistortion += normalize(dir + vec2(0.00001)) * wave * dampen * fade * 0.025;
    }

    // Each of the 16 trail samples is a ripple source at the pinned 0.025
    // amplitude. Where the samples bunch up (slow cursor) their raw sum reaches
    // ~16x one ripple and smears the frame into a vortex. This soft knee is
    // amplitude-preserving for a single ripple and saturates smoothly instead
    // of clipping, so the distortion stays water-like at any cursor speed.
    float magnitude = length(totalDistortion);
    float knee = 0.009;
    totalDistortion *= (knee * (1.0 - exp(-magnitude / knee))) / max(magnitude, 0.00001);

    vec2 distortedUv = uv + totalDistortion * uHoverState;

    vec3 color = texture2D(uVideo, clamp(distortedUv, 0.0, 1.0)).rgb;

    gl_FragColor = vec4(color, 1.0);
  }
`

/* ------------------------------------------------------------------ helpers */

function splitChars(text) {
  return text.split(/(\s+)/).filter(Boolean)
}

function Chars({ text, baseDelay, speed }) {
  const tokens = useMemo(function () {
    return splitChars(text)
  }, [text])

  let index = 0

  return (
    <>
      {tokens.map(function (token, tokenIndex) {
        // Real whitespace keeps the line breakable and the copy selectable.
        if (/^\s+$/.test(token)) {
          return <span key={`s-${tokenIndex}`}>{' '}</span>
        }

        const nodes = Array.from(token).map(function (char, charIndex) {
          const delay = baseDelay + index * speed
          index += 1
          return (
            <span
              key={`c-${tokenIndex}-${charIndex}`}
              className="escape-char"
              style={{ animationDelay: `${delay.toFixed(3)}s` }}
            >
              {char}
            </span>
          )
        })

        return (
          <span key={`w-${tokenIndex}`} className="escape-word">
            {nodes}
          </span>
        )
      })}
    </>
  )
}

function SlideText({ children }) {
  const label = String(children)
  return (
    <span className="text-slider">
      <span className="text-slider-inner" data-text={label}>
        {label}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ section */

export default function EscapeIslandHeader() {
  const sectionRef = useRef(null)
  const mountRef = useRef(null)

  useEffect(function initScene() {
    const section = sectionRef.current
    const mount = mountRef.current
    if (!section || !mount) return undefined

    /* --- hidden video used as the WebGL texture source ------------------- */
    const video = document.createElement('video')
    video.src = VIDEO_SRC
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.preload = 'auto'
    video.loop = false
    video.setAttribute('aria-hidden', 'true')
    video.style.position = 'fixed'
    video.style.top = '0'
    video.style.left = '0'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    video.style.zIndex = '-1'
    document.body.appendChild(video)

    /* --- renderer ------------------------------------------------------- */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    mount.appendChild(renderer.domElement)

    const texture = new THREE.VideoTexture(video)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    // Raw shader output: keep the texture a plain RGBA8 sample so the video's
    // sRGB values pass straight through instead of being decoded twice.
    texture.colorSpace = THREE.NoColorSpace

    const imageResolution = new THREE.Vector2(1183, 511)

    const trail = Array.from({ length: TRAIL_LENGTH }, function () {
      return new THREE.Vector3(0.5, 0.5, 1)
    })

    const uniforms = {
      uVideo: { value: texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uImageResolution: { value: imageResolution },
      uHoverState: { value: 0 },
      uTrail: { value: trail },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthTest: false,
      depthWrite: false,
    })

    let width = Math.max(1, mount.clientWidth)
    let height = Math.max(1, mount.clientHeight)

    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      100,
    )
    camera.position.z = 10

    let geometry = new THREE.PlaneGeometry(width, height, PLANE_SEGMENTS, PLANE_SEGMENTS)
    const mesh = new THREE.Mesh(geometry, material)
    const scene = new THREE.Scene()
    scene.add(mesh)

    renderer.setSize(width, height, false)
    uniforms.uResolution.value.set(width, height)

    /* --- state ---------------------------------------------------------- */
    const pointer = { x: 0.5, y: 0.5, inside: false }
    let hoverTarget = 0
    let hoverState = 0
    let rafId = 0
    let disposed = false
    let trigger = null
    let pendingPoint = null
    let frames = 0
    let forcedHover = null

    // pointermove fires many times per frame; queue the latest position and
    // commit exactly one trail point per frame so the 16 samples spread across
    // ~16 frames of movement instead of stacking on one spot.
    function handlePointerMove(event) {
      const rect = mount.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.x = (event.clientX - rect.left) / rect.width
      pointer.y = 1 - (event.clientY - rect.top) / rect.height
      pendingPoint = { x: pointer.x, y: pointer.y }
    }

    function commitTrailPoint() {
      if (!pendingPoint) return
      for (let i = TRAIL_LENGTH - 1; i > 0; i -= 1) {
        trail[i].copy(trail[i - 1])
      }
      trail[0].set(pendingPoint.x, pendingPoint.y, 0)
      pendingPoint = null
    }

    function handlePointerEnter(event) {
      hoverTarget = 1
      handlePointerMove(event)
    }

    function handlePointerLeave() {
      hoverTarget = 0
    }

    /* --- resize --------------------------------------------------------- */
    function resize() {
      const nextWidth = Math.max(1, mount.clientWidth)
      const nextHeight = Math.max(1, mount.clientHeight)
      if (nextWidth === width && nextHeight === height) return

      width = nextWidth
      height = nextHeight

      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(width, height, false)

      mesh.geometry.dispose()
      geometry = new THREE.PlaneGeometry(width, height, PLANE_SEGMENTS, PLANE_SEGMENTS)
      mesh.geometry = geometry

      uniforms.uResolution.value.set(width, height)
    }

    /* --- render loop ---------------------------------------------------- */
    function frame() {
      if (disposed) return
      rafId = window.requestAnimationFrame(frame)

      resize()

      frames += 1

      if (forcedHover !== null) {
        hoverState = forcedHover
      } else {
        hoverState += (hoverTarget - hoverState) * HOVER_LERP
      }
      uniforms.uHoverState.value = hoverState

      commitTrailPoint()

      for (let i = 0; i < TRAIL_LENGTH; i += 1) {
        trail[i].z = Math.min(1, trail[i].z + TRAIL_AGE_STEP)
      }

      if (video.readyState >= 2) {
        texture.needsUpdate = true
      }

      renderer.render(scene, camera)
    }

    /* --- scroll scrubbed playback --------------------------------------- */
    function handleLoadedMetadata() {
      const w = video.videoWidth
      const h = video.videoHeight
      if (w && h) imageResolution.set(w, h)

      if (!Number.isFinite(video.duration) || video.duration <= 0) return
      if (trigger) return

      video.pause()

      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: function (self) {
          if (!Number.isFinite(video.duration) || video.duration <= 0) return
          const time = self.progress * video.duration
          if (Math.abs(video.currentTime - time) > 0.01) {
            video.currentTime = time
          }
        },
      })

      ScrollTrigger.refresh()
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    if (video.readyState >= 1) handleLoadedMetadata()

    /* --- wire up -------------------------------------------------------- */
    mount.addEventListener('pointermove', handlePointerMove)
    mount.addEventListener('pointerenter', handlePointerEnter)
    mount.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('resize', resize)

    rafId = window.requestAnimationFrame(frame)

    if (import.meta.env.DEV) {
      window.__escapeDebug = function () {
        return {
          hover: hoverState,
          target: hoverTarget,
          frames,
          trail: trail.map(function (p) {
            return [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)]
          }),
        }
      }
      window.__escapeForce = function (value) {
        forcedHover = value
      }
    }

    return function teardown() {
      disposed = true
      window.cancelAnimationFrame(rafId)

      mount.removeEventListener('pointermove', handlePointerMove)
      mount.removeEventListener('pointerenter', handlePointerEnter)
      mount.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('resize', resize)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)

      if (trigger) {
        trigger.kill()
        trigger = null
      }

      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
      texture.dispose()
      renderer.dispose()

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }

      video.pause()
      video.removeAttribute('src')
      video.load()
      if (video.parentNode) video.parentNode.removeChild(video)
    }
  }, [])

  return (
    <section className="escape-section" ref={sectionRef} aria-label="ESCAPE island">
      <div className="escape-stage">
        <div className="escape-webgl" ref={mountRef} aria-hidden="true" />

        <div className="escape-overlay">
          {/* logo ------------------------------------------------------- */}
          <div className="escape-logo escape-reveal escape-delay-1">
            <svg
              className="escape-logo-mark"
              width="34"
              height="32"
              viewBox="0 0 34 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="15" height="14" rx="3" fill="#FFFFFF" />
              <rect x="19" width="15" height="14" rx="3" fill="#FFFFFF" />
              <rect y="18" width="15" height="14" rx="3" fill="#FFFFFF" />
              <rect x="19" y="18" width="15" height="14" rx="3" fill="#FFFFFF" />
            </svg>
            <span className="escape-logo-text">ESCAPE</span>
          </div>

          {/* centre nav -------------------------------------------------- */}
          <nav className="escape-nav" aria-label="Primary">
            <button type="button" className="escape-nav-item">
              <Chars text="CATEGORIES" baseDelay={0.4} speed={0.03} />
            </button>
            <button type="button" className="escape-nav-item">
              <Chars text="TOP SAAS" baseDelay={0.5} speed={0.03} />
            </button>
            <button type="button" className="escape-nav-item">
              <Chars text="ALTERNATIVE" baseDelay={0.6} speed={0.03} />
            </button>
            <button type="button" className="escape-nav-item">
              <Chars text="TRENDING" baseDelay={0.7} speed={0.03} />
            </button>
          </nav>

          {/* top right cta ----------------------------------------------- */}
          <button type="button" className="escape-btn-top">
            <SlideText>Start Exploring</SlideText>
          </button>

          {/* mobile menu ------------------------------------------------- */}
          <button type="button" className="escape-mobile-menu" aria-label="Open menu">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 6H21M3 12H21M3 18H21"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* bottom gradient -------------------------------------------- */}
          <div className="escape-bottom-gradient" />

          {/* bottom content --------------------------------------------- */}
          <div className="escape-content-wrapper">
            <h1 className="escape-title">
              <Chars text="A Place Between Day & Night" baseDelay={0.8} speed={0.04} />
            </h1>

            <p className="escape-subtitle">
              <Chars
                text="Leave the noise behind. Follow the water, find the light, and discover a place made for slowing down."
                baseDelay={1.5}
                speed={0.015}
              />
            </p>

            <button type="button" className="escape-btn-bottom">
              <SlideText>Discover the Island</SlideText>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
