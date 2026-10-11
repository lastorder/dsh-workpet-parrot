/**
 * dsh-workpet-parrot — a cockatiel appearance for the Work Pet.
 *
 * This file is loaded by DeepSeek Harness as-is: no build, no TypeScript, no
 * JSX. It calls `window.__ModuleLoader__.load` with a factory; the factory
 * receives `require`, which supplies the page's React.
 *
 * The file has three parts:
 *   1. ARTWORK   — palette, body parts, and one pose per activity, written as
 *                  plain SVG markup in a 100 × 80 box. This is where to work.
 *   2. ANIMATION — the CSS keyframes the artwork's classes refer to.
 *   3. PLUG-IN   — registers the skin into `ctx.workpet` (rarely touched).
 */
window.__ModuleLoader__.load({
  id: 'dsh-workpet-parrot',
  factory: (require) => {
    const React = require('react')

    // =====================================================================
    // 1. ARTWORK
    // =====================================================================

    /** Colours: dove-grey plumage, lemon face and crest, apricot cheeks. */
    const P = {
      body: '#aab0b6', bodyLight: '#d3d7da', bodyDark: '#858c93',
      wing: '#7b838b', wingBar: '#f3f2ea',
      face: '#f7dc6f', faceLight: '#fcefb4', crest: '#f2cf5b', crestTip: '#9e9a86',
      cheek: '#f28a4a', beak: '#dccbb6', feet: '#caa597',
      ink: '#4a4440', eye: '#2a2522', tail: '#6e757c',
      branch: '#9c7550', leaf: '#93b46a', leafDark: '#6f9150', tear: '#8fc3e8',
      screen: '#cfe6f7', laptop: '#6d625a', laptopDark: '#4a413b',
    }

    /** Gradients. `id` is unique per drawing, because several birds can be on screen at once. */
    const defs = (id) => `
      <defs>
        <radialGradient id="body-${id}" cx="45%" cy="30%" r="75%">
          <stop offset="0" stop-color="${P.bodyLight}"/><stop offset=".65" stop-color="${P.body}"/><stop offset="1" stop-color="${P.bodyDark}"/>
        </radialGradient>
        <radialGradient id="face-${id}" cx="60%" cy="40%" r="70%">
          <stop offset="0" stop-color="${P.faceLight}"/><stop offset="1" stop-color="${P.face}"/>
        </radialGradient>
      </defs>`

    /** A stroke with an ink outline: legs, tail feathers, crest feathers. */
    const tube = (d, color, width = 3) => `
      <path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${width + 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`

    /** The leafy branch the bird sits on, with a soft shadow. */
    const perch = (x1 = 18, x2 = 84, y = 68) => {
      const branch = `M${x1} ${y + 1} Q${(x1 + x2) / 2} ${y - 2} ${x2} ${y + 0.5}`
      return `
        <ellipse cx="${(x1 + x2) / 2}" cy="76" rx="${(x2 - x1) / 2.4}" ry="2.6" fill="${P.ink}" opacity=".1"/>
        <path d="${branch}" fill="none" stroke="${P.ink}" stroke-width="6.4" stroke-linecap="round"/>
        <path d="${branch}" fill="none" stroke="${P.branch}" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M${x2 - 6} ${y} q4 -7 10 -7 q-2 6 -10 7 Z" fill="${P.leaf}" stroke="${P.leafDark}" stroke-width=".7"/>
        <path d="M${x1 + 5} ${y + 1} q-5 5 -9 4 q3 -5 9 -4 Z" fill="${P.leafDark}"/>`
    }

    /** One eye at (x, y). Kinds: open, up, look, focus, happy, closed, wide, spiral, sad. */
    const eye = (kind, x, y) => {
      switch (kind) {
        case 'happy': return `<path d="M${x - 2.8} ${y + 1} q2.8 -3.8 5.6 0" fill="none" stroke="${P.eye}" stroke-width="1.7" stroke-linecap="round"/>`
        case 'closed': return `<path d="M${x - 2.8} ${y - 0.2} q2.8 3 5.6 0" fill="none" stroke="${P.eye}" stroke-width="1.6" stroke-linecap="round"/>`
        case 'spiral': return `
          <g class="wpp-spin" style="transform-origin:${x}px ${y}px">
            <path d="M${x} ${y} a1.2 1.2 0 1 1 1.2 1.2 a2.4 2.4 0 1 1 2.3 -2.9" fill="none" stroke="${P.eye}" stroke-width="1.2" stroke-linecap="round"/>
          </g>`
        case 'wide': return `
          <circle cx="${x}" cy="${y}" r="3.4" fill="${P.eye}"/>
          <circle cx="${x + 1.1}" cy="${y - 1.3}" r="1.2" fill="#fff"/>`
        case 'focus': return `
          <ellipse cx="${x}" cy="${y + 0.3}" rx="2.3" ry="2.6" fill="${P.eye}"/>
          <circle cx="${x + 0.8}" cy="${y - 0.5}" r=".8" fill="#fff"/>
          <path d="M${x - 3} ${y - 2} q3 -1.2 6 0" fill="none" stroke="${P.ink}" stroke-width="1.1" stroke-linecap="round"/>`
        case 'sad': return `
          <ellipse cx="${x}" cy="${y + 0.5}" rx="2.2" ry="2.6" fill="${P.eye}"/>
          <circle cx="${x + 0.8}" cy="${y - 0.4}" r=".8" fill="#fff"/>
          <path d="M${x + 3} ${y - 3.8} l-5.6 1.5" fill="none" stroke="${P.ink}" stroke-width="1.1" stroke-linecap="round"/>`
        default: { // open, up, look
          const dy = kind === 'up' ? -1 : 0
          return `
            <ellipse cx="${x}" cy="${y + dy}" rx="2.5" ry="3.1" fill="${P.eye}"/>
            <circle cx="${x + 1}" cy="${y + dy - 1.2}" r="1" fill="#fff"/>
            <circle cx="${x - 0.8}" cy="${y + dy + 1.3}" r=".5" fill="#fff"/>`
        }
      }
    }

    /** How far the crest is laid back: up (alert), mid (relaxed), down (calm or sleepy). */
    const CREST_ANGLE = { up: 0, mid: -32, down: -62 }

    /**
     * The head, facing right, centred on (cx, cy), radius 12.5.
     * face: { eyes, crest, tilt, beakOpen, blush: 'soft' | 'strong', tear, crestMotion }
     */
    const head = (id, cx, cy, face) => {
      const { eyes = 'open', crest = 'mid', tilt = 0, beakOpen = false, blush = 'soft', tear = false, crestMotion = '' } = face
      const eyeClass = eyes === 'open' || eyes === 'up' ? 'wpp-blink' : eyes === 'look' ? 'wpp-look' : ''
      const lowerBeak = beakOpen
        ? `<path d="M10.4 2.8 Q13.6 4.8 13 7.6 Q10.6 6.6 9.8 4.2 Z" fill="${P.beak}" stroke="${P.ink}" stroke-width="1" stroke-linejoin="round"/>`
        : `<path d="M10.4 2.4 Q12.6 3.6 12.4 5.2 Q10.8 4.8 10 3.8 Z" fill="${P.beak}" stroke="${P.ink}" stroke-width=".9" stroke-linejoin="round"/>`
      return `
        <g transform="translate(${cx} ${cy}) rotate(${tilt})">
          <g transform="rotate(${CREST_ANGLE[crest]} -1 -10)">
            <g class="${crestMotion}" style="transform-origin:-1px -10px">
              ${tube('M-3 -9 C-6 -17 -11 -21 -17 -20', P.crest, 3.2)}
              ${tube('M-1 -10 C-2 -21 -8 -27 -14 -28', P.crest, 3.4)}
              ${tube('M1.5 -10.5 C2 -22 -2.5 -30 -8 -32', P.crest, 3.6)}
              <path d="M-14 -28 q-1.6 -.4 -2.6 .4 M-8 -32 q-1.6 -.2 -2.4 .8" stroke="${P.crestTip}" stroke-width="2" stroke-linecap="round"/>
            </g>
          </g>
          <circle r="12.5" fill="url(#face-${id})"/>
          <path d="M-12.4 1 C-12.8 -7 -7 -12.6 .5 -12.5 C-5 -7.5 -7 0 -5.2 10.8 C-9.4 8.8 -12.2 5.4 -12.4 1 Z" fill="${P.body}"/>
          <circle r="12.5" fill="none" stroke="${P.ink}" stroke-width="1.5"/>
          <circle cx="4.6" cy="5" r="${blush === 'strong' ? 4.4 : 3.8}" fill="${P.cheek}"/>
          <g class="${eyeClass}">${eye(eyes, 3.6, -1.6)}</g>
          ${tear ? `<path class="wpp-drip" d="M2.4 2.6 q-1.6 2.6 0 3.7 q1.6 -1.1 0 -3.7 Z" fill="${P.tear}"/>` : ''}
          <path d="M10 -3.4 Q17.4 -2 15 4.8 Q12.2 3.6 10.2 2.2 Z" fill="${P.beak}" stroke="${P.ink}" stroke-width="1.2" stroke-linejoin="round"/>
          ${lowerBeak}
        </g>`
    }

    /** A folded wing on the bird's side, with the white wing bar. */
    const foldedWing = (x, y) => `
      <g transform="translate(${x} ${y})">
        <path d="M2 0 C-8 3 -11 16 -8 27 C-2 21 4 12 5 4 Z" fill="${P.wing}" stroke="${P.ink}" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M1.4 3 C-4 6 -6 11 -6.4 15 C-3 12 0 8.6 2.6 5 Z" fill="${P.wingBar}" opacity=".95"/>
        <path d="M-7 20 l-2.4 4 M-5 22 l-2 4" stroke="${P.ink}" stroke-width=".8" opacity=".5"/>
      </g>`

    /** An open wing hinged at (0, 0), pointing up-left; rotate it to flap. */
    const openWing = (color = P.wing) => `
      <path d="M0 0 C-6 -10 -18 -16 -28 -14 C-24 -10 -24 -7 -27 -4 C-22 -3 -20 0 -22 3 C-14 4 -6 4 0 0 Z" fill="${color}" stroke="${P.ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M-4 -3 C-9 -7 -14 -8.6 -18 -8 C-14 -5 -9 -2.4 -4 -1 Z" fill="${P.wingBar}" opacity=".95"/>`

    const tail = () => tube('M45 60 L30 79', P.tail, 4) + tube('M47.5 61 L36 80', P.bodyDark, 3.2)
    const feet = (x) => tube(`M${x - 3} 63 L${x - 4} 68`, P.feet, 2.2) + tube(`M${x + 3} 63 L${x + 4} 68`, P.feet, 2.2)
    const body = (id) => `
      <g transform="rotate(-10 49 50)">
        <ellipse cx="49" cy="50" rx="12.5" ry="16" fill="url(#body-${id})" stroke="${P.ink}" stroke-width="1.5"/>
        <ellipse cx="52.5" cy="53" rx="6.5" ry="10" fill="${P.bodyLight}" opacity=".55"/>
      </g>`

    // ---------------------------------------------------------------------
    // Poses. Whole-body motions pivot on the feet (50, 68).
    // ---------------------------------------------------------------------

    /** Sitting on the branch. options.motion animates the whole bird; options.wave raises a wing. */
    const perched = (id, face, options = {}) => `
      ${perch()}
      <g class="${options.motion || ''}" style="transform-origin:50px 68px">
        <g class="wpp-breathe" style="transform-origin:50px 68px">
          <g class="wpp-tail" style="transform-origin:46px 60px">${tail()}</g>
          ${feet(50)}
          ${body(id)}
          ${options.wave
            ? `<g transform="translate(45 42)"><g class="wpp-wave">${openWing()}</g></g>`
            : foldedWing(47, 38)}
          ${head(id, 54, 30, face)}
        </g>
      </g>`

    /** Flying with both wings beating; used while a tool runs. */
    const flying = (id, compact) => `
      ${compact ? '' : `<ellipse cx="48" cy="75" rx="20" ry="2.4" fill="${P.ink}" opacity=".1"/>`}
      <g class="wpp-bob">
        <g transform="translate(47 41)"><g class="wpp-flap-far">${openWing(P.bodyDark)}</g></g>
        ${tube('M33 48 L12 55', P.tail, 4)}
        ${tube('M33 50 L15 60', P.bodyDark, 3.2)}
        <ellipse cx="46" cy="47" rx="16" ry="10" transform="rotate(-10 46 47)" fill="url(#body-${id})" stroke="${P.ink}" stroke-width="1.5"/>
        <ellipse cx="50" cy="51" rx="9" ry="5" transform="rotate(-10 50 51)" fill="${P.bodyLight}" opacity=".55"/>
        ${tube('M44 55 L41 58', P.feet, 2)}
        ${tube('M48 56 L46 59', P.feet, 2)}
        ${head(id, 62, 34, { eyes: 'focus', crest: 'down' })}
        <g transform="translate(49 43)"><g class="wpp-flap">${openWing()}</g></g>
      </g>
      ${compact ? '' : `
        <g class="wpp-wind" stroke="${P.bodyDark}" stroke-width="1.6" stroke-linecap="round" opacity=".45">
          <path d="M4 34 h9"/><path d="M1 44 h7"/><path d="M6 64 h8"/>
        </g>`}`

    /** Pecking at a small laptop on the branch; used while the model writes. */
    const typing = (id) => `
      ${perch(10, 92)}
      <path d="M60 66 L90 66 L86 70 L62 70 Z" fill="${P.laptopDark}" stroke="${P.ink}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M66 65.5 L70 47 L91 47 L87 65.5 Z" fill="${P.laptop}" stroke="${P.ink}" stroke-width="1.1" stroke-linejoin="round"/>
      <path class="wpp-glow" d="M68.3 63.5 L71.5 49 L88.7 49 L85.5 63.5 Z" fill="${P.screen}"/>
      <g stroke-width="1.3" stroke-linecap="round">
        <path class="wpp-code" d="M72.6 53 h7.5" stroke="#7aa2c8"/>
        <path class="wpp-code" d="M71.8 56.5 h10" stroke="#9cbf74" style="animation-delay:-.5s"/>
        <path class="wpp-code" d="M71 60 h6" stroke="${P.cheek}" style="animation-delay:-1s"/>
      </g>
      <g transform="translate(-8 0)">
        <g class="wpp-tail" style="transform-origin:46px 60px">${tail()}</g>
        ${feet(50)}
        ${body(id)}
        ${foldedWing(47, 38)}
        <g class="wpp-peck" style="transform-origin:52px 42px">${head(id, 55, 31, { eyes: 'focus', tilt: 8 })}</g>
      </g>`

    /** Fluffed into a ball, head turned back and tucked, standing on one foot. */
    const sleeping = (id) => `
      ${perch()}
      <g class="wpp-breathe-slow" style="transform-origin:50px 68px">
        ${tube('M45 60 L32 79', P.tail, 4)}
        ${tube('M47.5 61 L37 80', P.bodyDark, 3.2)}
        ${tube('M50 63 L50 68', P.feet, 2.2)}
        <circle cx="50" cy="49" r="16.5" fill="url(#body-${id})" stroke="${P.ink}" stroke-width="1.5"/>
        <ellipse cx="53" cy="53" rx="9" ry="10" fill="${P.bodyLight}" opacity=".5"/>
        ${foldedWing(50, 37)}
        <g transform="translate(46 35) scale(-1 1) translate(-46 -35)">
          ${head(id, 46, 35, { eyes: 'closed', crest: 'down', tilt: 24 })}
        </g>
      </g>`

    /** Held up by the user: swinging, both wings flapping, feet kicking. */
    const dangling = (id) => `
      <g class="wpp-swing" style="transform-origin:50px 4px">
        <g transform="translate(43 40)"><g class="wpp-flutter">${openWing()}</g></g>
        <g transform="translate(57 40) scale(-1 1)"><g class="wpp-flutter" style="animation-delay:-.06s">${openWing()}</g></g>
        ${tube('M48 63 L42 77', P.tail, 4)}
        ${tube('M52 63 L56 77', P.bodyDark, 3.2)}
        <g class="wpp-kick" style="transform-origin:46px 62px">${tube('M46 62 L45 70', P.feet, 2.2)}</g>
        <g class="wpp-kick" style="transform-origin:54px 62px;animation-delay:-.2s">${tube('M54 62 L55 70', P.feet, 2.2)}</g>
        <ellipse cx="50" cy="50" rx="12" ry="15" fill="url(#body-${id})" stroke="${P.ink}" stroke-width="1.5"/>
        <ellipse cx="51" cy="53" rx="6" ry="9" fill="${P.bodyLight}" opacity=".55"/>
        ${head(id, 51, 27, { eyes: 'wide', crest: 'up', beakOpen: true, blush: 'strong', crestMotion: 'wpp-crest-bob' })}
      </g>`

    /** Activity → pose. Every activity in the Work Pet contract has a case. */
    const draw = (scene, id, compact) => {
      switch (scene.activity) {
        case 'absent': return perched(id, { eyes: 'closed', crest: 'down' })
        case 'sleeping': return sleeping(id)
        case 'thinking': return perched(id, { eyes: 'up', tilt: -16, crestMotion: 'wpp-crest-bob' })
        case 'writing': return typing(id)
        case 'tool': return flying(id, compact)
        case 'retrying': return perched(id, { eyes: 'spiral' }, { motion: 'wpp-wobble' })
        case 'awaiting': return perched(id, { eyes: 'wide', crest: 'up', beakOpen: true }, { motion: 'wpp-nudge', wave: true })
        case 'delegating': return perched(id, { eyes: 'look' })
        case 'done': return perched(id, { eyes: 'happy', crest: 'up', beakOpen: true, blush: 'strong' }, { motion: 'wpp-hop' })
        case 'error': return perched(id, { eyes: 'sad', crest: 'down', tear: true }, { motion: 'wpp-shake' })
        case 'petted': return perched(id, { eyes: 'happy', crest: 'up', tilt: 14, blush: 'strong', crestMotion: 'wpp-crest-bob' }, { motion: 'wpp-fluff' })
        case 'dragged': return dangling(id)
        case 'idle':
        default: return perched(id, { eyes: 'open' })
      }
    }

    /** The skin's Figure: a React component that wraps the SVG markup. */
    function ParrotFigure({ scene, compact }) {
      const id = 'wpp' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
      return React.createElement('svg', {
        className: 'wpp',
        viewBox: '0 0 100 80',
        width: '100%',
        height: '100%',
        'aria-hidden': true,
        dangerouslySetInnerHTML: { __html: defs(id) + draw(scene, id, compact === true) },
      })
    }

    // =====================================================================
    // 2. ANIMATION — every class above is prefixed `wpp-`.
    // =====================================================================

    const CSS = `
.wpp{overflow:visible;}
.wpp-blink{animation:wpp-blink 3.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center;}
.wpp-look{animation:wpp-look 3.2s ease-in-out infinite;}
.wpp-spin{animation:wpp-spin 1s linear infinite;}
.wpp-drip{animation:wpp-drip 1.6s ease-in infinite;}
.wpp-breathe{animation:wpp-breathe 2.8s ease-in-out infinite;}
.wpp-breathe-slow{animation:wpp-breathe 4s ease-in-out infinite;}
.wpp-tail{animation:wpp-tail 3s ease-in-out infinite;}
.wpp-crest-bob{animation:wpp-crest-bob 1.4s ease-in-out infinite;}
.wpp-bob{animation:wpp-bob .26s ease-in-out infinite;}
.wpp-flap{animation:wpp-flap .26s ease-in-out infinite;}
.wpp-flap-far{animation:wpp-flap .26s ease-in-out infinite;animation-delay:-.04s;}
.wpp-wind{animation:wpp-wind .5s linear infinite;}
.wpp-peck{animation:wpp-peck .32s ease-in-out infinite alternate;}
.wpp-glow{animation:wpp-glow 2s ease-in-out infinite;}
.wpp-code{stroke-dasharray:12;animation:wpp-code 1.5s steps(6) infinite;}
.wpp-wave{animation:wpp-wave .6s ease-in-out infinite;}
.wpp-nudge{animation:wpp-nudge 1s ease-in-out infinite;}
.wpp-wobble{animation:wpp-wobble .6s ease-in-out infinite;}
.wpp-hop{animation:wpp-hop .9s cubic-bezier(.4,0,.2,1) infinite;}
.wpp-shake{animation:wpp-shake .5s ease-in-out 3;}
.wpp-fluff{animation:wpp-fluff .9s ease-in-out infinite;}
.wpp-swing{animation:wpp-swing 1.2s ease-in-out infinite;}
.wpp-flutter{animation:wpp-flutter .16s ease-in-out infinite;}
.wpp-kick{animation:wpp-kick .4s ease-in-out infinite;}
@keyframes wpp-blink{0%,92%,100%{transform:scaleY(1);}95%{transform:scaleY(.1);}}
@keyframes wpp-look{0%,40%,100%{transform:translateX(0);}50%,70%{transform:translateX(1.4px);}80%,90%{transform:translateX(-1.2px);}}
@keyframes wpp-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes wpp-drip{0%{transform:translateY(0);opacity:1;}100%{transform:translateY(5px);opacity:0;}}
@keyframes wpp-breathe{0%,100%{transform:scale(1,1);}50%{transform:scale(1.015,1.03);}}
@keyframes wpp-tail{0%,100%{transform:rotate(0deg);}50%{transform:rotate(4deg);}}
@keyframes wpp-crest-bob{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-12deg);}}
@keyframes wpp-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-2.4px);}}
@keyframes wpp-flap{0%,100%{transform:rotate(22deg);}50%{transform:rotate(-58deg);}}
@keyframes wpp-wind{from{transform:translateX(6px);opacity:.1;}50%{opacity:.6;}to{transform:translateX(-6px);opacity:0;}}
@keyframes wpp-peck{from{transform:rotate(0deg);}to{transform:rotate(12deg);}}
@keyframes wpp-glow{0%,100%{opacity:.85;}50%{opacity:1;}}
@keyframes wpp-code{from{stroke-dashoffset:12;}to{stroke-dashoffset:0;}}
@keyframes wpp-wave{0%,100%{transform:rotate(26deg);}50%{transform:rotate(62deg);}}
@keyframes wpp-nudge{0%,100%{transform:translateY(0);}35%{transform:translateY(-3px);}}
@keyframes wpp-wobble{0%,100%{transform:rotate(-6deg);}50%{transform:rotate(6deg);}}
@keyframes wpp-hop{0%,100%{transform:translateY(0) scale(1,1);}20%{transform:translateY(0) scale(1.06,.92);}50%{transform:translateY(-12px) scale(.96,1.05);}78%{transform:translateY(0) scale(1.04,.96);}}
@keyframes wpp-shake{0%,100%{transform:translateX(0) rotate(0deg);}25%{transform:translateX(-2.4px) rotate(-2deg);}75%{transform:translateX(2.4px) rotate(2deg);}}
@keyframes wpp-fluff{0%,100%{transform:scale(1,1);}50%{transform:scale(1.05,1.02);}}
@keyframes wpp-swing{0%,100%{transform:rotate(-7deg);}50%{transform:rotate(7deg);}}
@keyframes wpp-flutter{0%,100%{transform:rotate(18deg);}50%{transform:rotate(-30deg);}}
@keyframes wpp-kick{0%,100%{transform:rotate(-10deg);}50%{transform:rotate(12deg);}}
@media (prefers-reduced-motion:reduce){.wpp *{animation:none !important;}}
`

    // =====================================================================
    // 3. PLUG-IN — register the skin into the Work Pet capability.
    // =====================================================================

    const dictionaries = {
      zh: { title: '玄凤鹦鹉', description: '顶着黄色冠羽、脸颊两团橘红的灰色玄凤鹦鹉，站在带叶子的小树枝上。' },
      en: { title: 'Cockatiel', description: 'A dove-grey cockatiel with a lemon crest and apricot cheeks, perched on a leafy branch.' },
    }

    function insertStyles() {
      if (typeof document === 'undefined') return () => {}
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-workpet-parrot'
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => tag.remove()
    }

    return {
      // Activate only while the Work Pet capability (ctx.workpet) is available.
      inject: ['workpet', 'locale'],
      apply(ctx) {
        ctx.effect(insertStyles, 'workpet-parrot: stylesheet')
        ctx.effect(() => ctx.locale.register('workpetParrot', dictionaries), 'workpet-parrot: dictionaries')
        const t = ctx.locale.bind('workpetParrot')
        ctx.effect(() => ctx.workpet.register({
          id: 'cockatiel',
          order: 10,
          title: () => t('title'),
          description: () => t('description'),
          Figure: ParrotFigure,
        }), 'workpet-parrot: skin')
      },
    }
  },
})
