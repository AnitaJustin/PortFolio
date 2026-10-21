
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { AnimationClip, AnimationMixer, LoopRepeat, MathUtils } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// ✏️ YOUR ACTION BUTTONS. Files are in the public folder, so "/pushup.glb" means public/pushup.glb.
//   repeat: how many times the animation plays (default 1)
//   hold:   seconds to stay in the final pose before relaxing (good for poses)
//   turn:   rotates the avatar to show it from the side (radians)
const ACTIONS = [
  { id: 'twirl', label: 'Twirl', icon: '🌀' }, // built in: no file needed
  { id: 'pushup', label: 'Push-up', icon: '💪', file: '/Pushuppose.glb', repeat: 5, turn: Math.PI / 2 },
  { id: 'running', label: 'Run', icon: '🏃', file: '/running.glb', repeat: 4 },
  { id: 'flip', label: 'Flip', icon: '🤸', file: '/flippose.glb' },
  { id: 'dance', label: 'Dance', icon: '💃', file: '/dancepose.glb', repeat: 2 },
  { id: 'hero', label: 'Hero pose', icon: '🦸', file: '/superhero.glb', hold: 0.5 },
]

// ✏️ Camera framing. scale = zoom (bigger = closer), y = height on the body that sits mid-box.
const CLOSE = { scale: 2.6, y: 1.3 } // resting view: head down to the thighs
const FULL = { scale: 1.85, y: 0.93 } // while an action plays: whole body

// ✏️ Lighting. Too dark? Raise these. Washed out? Lower them.
const AMBIENT = 1.2
const SKY = 1.0
const FRONT = 1.0

const loader = new GLTFLoader()

function prepareClip(clip, id) {
  const tracks = []
  for (const t of clip.tracks) {
    const name = t.name.replace(/^mixamorig:?/, '')
    if (name.endsWith('.scale')) continue
    if (name.endsWith('.position')) {
      if (!name.startsWith('Hips.')) continue // only the hips move; other bones keep the avatar's proportions
      const v = t.values
      let maxY = 0
      for (let i = 1; i < v.length; i += 3) maxY = Math.max(maxY, Math.abs(v[i]))
      const unit = maxY > 5 ? 0.01 : 1 // values above 5 can only be centimetres
      for (let i = 0; i < v.length; i++) v[i] *= unit
      for (const axis of [0, 2]) {
        // x = 0, z = 2
        let min = Infinity
        let max = -Infinity
        for (let i = axis; i < v.length; i += 3) {
          min = Math.min(min, v[i])
          max = Math.max(max, v[i])
        }
        if (max - min > 0.5) for (let i = axis; i < v.length; i += 3) v[i] = 0
      }
    }
    t.name = name
    tracks.push(t)
  }
  return new AnimationClip(id, clip.duration, tracks)
}

async function loadClip(def) {
  const gltf = await loader.loadAsync(def.file)
  if (!gltf.animations.length) throw new Error('no animation inside the file')
  const longest = gltf.animations.reduce((a, b) => (b.duration > a.duration ? b : a))
  return prepareClip(longest, def.id)
}

function Avatar({ api, reduceMotion, setActive }) {
  const group = useRef()
  const model = useRef()
  const spin = useRef(0) // extra turns from the Twirl button (radians)
  const view = useRef(0) // side-on angle for actions like push-up
  const hold = useRef(0) // seconds to hold the last pose
  const timer = useRef(null)
  const frame = useRef({ ...CLOSE }) // the framing right now
  const target = useRef(CLOSE) // the framing we are easing towards
  const current = useRef(null) // whatever animation is playing

  const { scene, animations } = useGLTF('/avatar.glb')
  const mixer = useMemo(() => new AnimationMixer(scene), [scene])

  useEffect(() => {
    if (!animations[0]) return
    const idle = mixer.clipAction(animations[0]).play() // the relaxed standing pose
    current.current = idle

    const returnToIdle = () => {
      const from = current.current
      if (!from || from === idle) return
      idle.reset().crossFadeFrom(from, 0.4, false).play()
      current.current = idle
      target.current = CLOSE
      view.current = 0
      setActive(null)
    }

    const onFinished = (e) => {
      if (e.action !== current.current || e.action === idle) return
      clearTimeout(timer.current)
      timer.current = setTimeout(returnToIdle, hold.current * 1000)
    }
    mixer.addEventListener('finished', onFinished)

    // the buttons (outside the canvas) call these two functions
    api.current.play = (def, clip) => {
      if (def.id === 'twirl') {
        spin.current += Math.PI * 2
        return
      }
      if (!clip) return
      const firstBone = clip.tracks[0]?.name.split('.')[0]
      if (!scene.getObjectByName(firstBone)) {
        console.warn(`"${def.id}": bone "${firstBone}" not found on the avatar, so it will not move.`)
      }
      clearTimeout(timer.current)
      const next = mixer.clipAction(clip)
      next.reset().setLoop(LoopRepeat, def.repeat ?? 1)
      next.clampWhenFinished = true // hold the last pose while blending back
      if (next !== current.current) next.crossFadeFrom(current.current, 0.3, false)
      next.play()
      current.current = next
      hold.current = def.hold ?? 0
      target.current = FULL
      view.current = def.turn ?? 0
      setActive(def.id)
    }
    api.current.stop = () => {
      clearTimeout(timer.current)
      returnToIdle()
    }

    return () => {
      clearTimeout(timer.current)
      mixer.removeEventListener('finished', onFinished)
      mixer.stopAllAction()
    }
  }, [mixer, animations, scene, api, setActive])

  useFrame((state, delta) => {
    mixer.update(delta)
    const g = group.current
    const follow = reduceMotion ? 0 : state.pointer.x * 0.2
    g.rotation.y = MathUtils.damp(g.rotation.y, spin.current + view.current + follow, 3, delta)
    g.rotation.x = MathUtils.damp(g.rotation.x, reduceMotion ? 0 : -state.pointer.y * 0.06, 4, delta)
    g.position.y = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.5) * 0.03

    // ease the zoom between the close-up and the full-body view
    const f = frame.current
    f.scale = MathUtils.damp(f.scale, target.current.scale, 3, delta)
    f.y = MathUtils.damp(f.y, target.current.y, 3, delta)
    model.current.scale.setScalar(f.scale)
    model.current.position.y = -f.y * f.scale
  })

  return (
    <group ref={group}>
      <primitive ref={model} object={scene} scale={CLOSE.scale} position={[0, -CLOSE.y * CLOSE.scale, 0]} />
    </group>
  )
}

useGLTF.preload('/avatar.glb')

export default function Hero3D() {
  const [active, setActive] = useState(null) // which action is playing
  const [loading, setLoading] = useState(null) // which file is downloading
  const [failed, setFailed] = useState([]) // actions whose file could not be loaded
  const cache = useRef({}) // animations we have already loaded
  const api = useRef({})
  const reduceMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  async function onAction(def) {
    if (!def.file) return api.current.play?.(def)
    if (active === def.id) return api.current.stop?.() // click again to stop
    let clip = cache.current[def.id]
    if (!clip) {
      setLoading(def.id)
      try {
        clip = await loadClip(def)
        cache.current[def.id] = clip
      } catch (err) {
        console.warn(`Could not load ${def.file}:`, err.message)
        setFailed((f) => [...f, def.id])
        return
      } finally {
        setLoading(null)
      }
    }
    api.current.play?.(def, clip)
  }

  return (
    <div className="stage-wrap">
      <div
        className={active ? 'stage playing' : 'stage'}
        role="img"
        aria-label="Interactive 3D avatar. Use the buttons below to make it move."
      >
        {/* decoration behind the avatar (the purple circle is drawn in CSS) */}
        <div className="confetti" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
        {/* flat = no tone mapping, so colors stay true to the model's textures */}
        <Canvas flat camera={{ position: [0, 2, 5], fov: 40 }} dpr={[1, 2]}>
          <ambientLight intensity={AMBIENT} />
          <hemisphereLight intensity={SKY} />
          <directionalLight position={[0, 1.5, 5]} intensity={FRONT} />
          <Suspense fallback={null}>
            <Avatar api={api} reduceMotion={reduceMotion} setActive={setActive} />
          </Suspense>
        </Canvas>
      </div>
      <p className="moves-label">What do you want me to do?</p>
      <div className="actions-bar" role="group" aria-label="Make the avatar move">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={active === a.id ? 'action-btn on' : 'action-btn'}
            aria-pressed={active === a.id}
            disabled={failed.includes(a.id) || loading === a.id}
            title={failed.includes(a.id) ? `Could not load ${a.file}` : undefined}
            onClick={() => onAction(a)}
          >
            <span aria-hidden="true">{a.icon}</span>
            {loading === a.id ? 'Loading…' : a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
