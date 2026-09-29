// Стилизованные векторные «медальоны» персонажей и предметов.
// Это символы (цвет, уши-трубочки, шляпа с пером…), а не кадры из фильмов.
import type { ReactElement } from 'react';
import type { AvatarId } from '../types/game';

type Art = { name: string; bg: [string, string]; draw: ReactElement };

const eye = (x: number, y: number, r = 4.2, look = 0.8) => (
  <g>
    <ellipse cx={x} cy={y} rx={r + 1.6} ry={r + 2} fill="#fff" />
    <circle cx={x + look} cy={y + 0.6} r={r * 0.62} fill="#3a2410" />
    <circle cx={x + look + 1} cy={y - 0.6} r={r * 0.22} fill="#fff" />
  </g>
);

export const AVATARS: Record<AvatarId, Art> = {
  shrek: {
    name: 'Шрек',
    bg: ['#9bc53d', '#3a5a2b'],
    draw: (
      <g>
        <rect x="14" y="44" width="11" height="7" rx="3" fill="#7fa82e" transform="rotate(-20 19 47)" />
        <rect x="75" y="44" width="11" height="7" rx="3" fill="#7fa82e" transform="rotate(20 81 47)" />
        <ellipse cx="10.5" cy="42.5" rx="3" ry="4" fill="#5d7f1d" />
        <ellipse cx="89.5" cy="42.5" rx="3" ry="4" fill="#5d7f1d" />
        <path d="M22 92 C22 70 30 64 50 64 C70 64 78 70 78 92Z" fill="#e8dcc0" />
        <path d="M30 92 L34 70 L44 67 L42 92Z M70 92 L66 70 L56 67 L58 92Z" fill="#5a3a1c" />
        <ellipse cx="50" cy="50" rx="27" ry="26" fill="#8fbc3a" />
        <ellipse cx="50" cy="60" rx="22" ry="15" fill="#86b233" />
        <path d="M34 38 Q40 34 45 38" stroke="#4d6b16" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M55 38 Q60 34 66 38" stroke="#4d6b16" strokeWidth="3" fill="none" strokeLinecap="round" />
        {eye(40, 45, 3.6)}
        {eye(60, 45, 3.6)}
        <ellipse cx="50" cy="55" rx="6" ry="4.5" fill="#7aa52b" />
        <path d="M37 64 Q50 71 63 64" stroke="#3f5a12" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  fiona: {
    name: 'Фиона',
    bg: ['#f3a1b8', '#7b2d4a'],
    draw: (
      <g>
        <path d="M24 44 C18 64 22 86 30 96 L70 96 C78 86 82 64 76 44Z" fill="#c1440e" />
        <path d="M30 94 C34 76 42 70 50 70 C58 70 66 76 70 94Z" fill="#2e7d32" />
        <ellipse cx="50" cy="50" rx="22" ry="24" fill="#9ccc4a" />
        <path d="M27 44 C28 24 72 24 73 44 C66 34 56 31 50 31 C44 31 34 34 27 44Z" fill="#d4531a" />
        <path d="M38 22 L42 30 L46 20 L50 29 L54 20 L58 30 L62 22 L62 32 L38 32Z" fill="#f1c94b" stroke="#9a7310" strokeWidth="1" />
        {eye(41, 48, 3.4)}
        {eye(59, 48, 3.4)}
        <path d="M37 42 Q41 40 45 42 M55 42 Q59 40 63 42" stroke="#6b2c0f" strokeWidth="1.6" fill="none" />
        <ellipse cx="50" cy="57" rx="3.5" ry="2.5" fill="#86b33a" />
        <path d="M42 64 Q50 69 58 64" stroke="#8b1e3f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  donkey: {
    name: 'Осёл',
    bg: ['#b9c2cc', '#4a5560'],
    draw: (
      <g>
        <path d="M30 34 L20 6 L38 28Z" fill="#8a8f96" />
        <path d="M70 34 L80 6 L62 28Z" fill="#8a8f96" />
        <path d="M31 30 L24 12 L36 27Z M69 30 L76 12 L64 27Z" fill="#3b3f45" />
        <path d="M48 20 Q52 12 56 20 Q58 14 60 22" stroke="#3b3f45" strokeWidth="3" fill="none" />
        <ellipse cx="50" cy="46" rx="22" ry="22" fill="#9aa0a8" />
        <ellipse cx="50" cy="70" rx="19" ry="16" fill="#d8d3cb" />
        {eye(40, 42, 4.4, 1.2)}
        {eye(60, 42, 4.4, -0.4)}
        <ellipse cx="42" cy="66" rx="2.5" ry="1.6" fill="#3b3f45" />
        <ellipse cx="58" cy="66" rx="2.5" ry="1.6" fill="#3b3f45" />
        <path d="M36 75 Q50 88 64 75Z" fill="#5b1a1a" />
        <rect x="42" y="75" width="16" height="6" rx="1" fill="#fffbe8" />
        <line x1="50" y1="75" x2="50" y2="81" stroke="#cfc8b0" />
      </g>
    ),
  },
  puss: {
    name: 'Кот в сапогах',
    bg: ['#f5b041', '#8e4b0b'],
    draw: (
      <g>
        <path d="M28 44 L24 22 L40 34Z M72 44 L76 22 L60 34Z" fill="#e08a1e" />
        <ellipse cx="50" cy="56" rx="24" ry="22" fill="#f0a02c" />
        <path d="M34 50 L42 48 M34 56 L41 54 M66 50 L58 48 M66 56 L59 54" stroke="#b86a0c" strokeWidth="2" />
        <ellipse cx="50" cy="66" rx="12" ry="8" fill="#fbe3b8" />
        {eye(41, 54, 5, 0.5)}
        {eye(59, 54, 5, -0.5)}
        <path d="M47 62 L53 62 L50 65Z" fill="#c0392b" />
        <path d="M44 68 Q50 71 56 68" stroke="#6b3a07" strokeWidth="1.6" fill="none" />
        <path d="M24 64 L8 60 M24 67 L8 68 M76 64 L92 60 M76 67 L92 68" stroke="#fff" strokeWidth="1.2" opacity="0.8" />
        <ellipse cx="50" cy="36" rx="34" ry="8" fill="#4a2d14" transform="rotate(-8 50 36)" />
        <path d="M32 34 C32 16 68 14 68 32Z" fill="#5a3a1c" transform="rotate(-8 50 30)" />
        <path d="M60 22 C74 4 92 8 94 14 C84 12 74 16 64 26Z" fill="#fdfefe" stroke="#d5d8dc" strokeWidth="1" />
      </g>
    ),
  },
  dragon: {
    name: 'Дракониха',
    bg: ['#f08080', '#7b1e2e'],
    draw: (
      <g>
        <path d="M32 30 L26 8 L40 26Z M68 30 L74 8 L60 26Z" fill="#6d4c41" />
        <path d="M22 48 L6 40 L20 56Z M78 48 L94 40 L80 56Z" fill="#c2185b" />
        <ellipse cx="50" cy="50" rx="28" ry="24" fill="#e0526e" />
        <ellipse cx="50" cy="70" rx="22" ry="14" fill="#f06a84" />
        <ellipse cx="41" cy="67" rx="2.4" ry="3.4" fill="#7b1e2e" />
        <ellipse cx="59" cy="67" rx="2.4" ry="3.4" fill="#7b1e2e" />
        {eye(38, 44, 5)}
        {eye(62, 44, 5)}
        <path d="M31 36 L29 32 M34 35 L33 30 M37 35 L37 30 M63 35 L63 30 M66 35 L67 30 M69 36 L71 32" stroke="#2b0b12" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M38 77 Q50 84 62 77" stroke="#7b1e2e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M42 78 L44 82 L46 79 M54 79 L56 82 L58 78" fill="#fff" />
      </g>
    ),
  },
  pinocchio: {
    name: 'Пиноккио',
    bg: ['#e9c46a', '#8a5a2b'],
    draw: (
      <g>
        <ellipse cx="46" cy="54" rx="22" ry="24" fill="#e0a96d" />
        <path d="M24 40 C24 20 68 20 68 40 L74 42 L20 42Z" fill="#f4d03f" stroke="#b7950b" strokeWidth="1.2" />
        <path d="M24 40 L68 40" stroke="#c0392b" strokeWidth="3" />
        <path d="M60 22 L68 12" stroke="#c0392b" strokeWidth="2.5" />
        {eye(38, 52, 4)}
        {eye(54, 52, 4)}
        <path d="M50 60 L92 56 L92 60 L50 64Z" fill="#c68a4c" stroke="#8a5a2b" strokeWidth="1" />
        <path d="M78 57 L82 50 L86 57" fill="#58a834" />
        <circle cx="34" cy="64" r="4" fill="#e57373" opacity="0.6" />
        <path d="M38 70 Q46 75 54 70" stroke="#6b3a07" strokeWidth="2" fill="none" />
        <circle cx="30" cy="56" r="1" fill="#8a5a2b" />
        <circle cx="60" cy="70" r="1" fill="#8a5a2b" />
      </g>
    ),
  },
  gingy: {
    name: 'Пряня',
    bg: ['#f6ddcc', '#8e5b2d'],
    draw: (
      <g>
        <path d="M50 14 C62 14 66 24 64 32 C74 32 86 34 86 44 C86 52 74 52 66 50 L70 80 C72 88 64 92 58 88 L50 76 L42 88 C36 92 28 88 30 80 L34 50 C26 52 14 52 14 44 C14 34 26 32 36 32 C34 24 38 14 50 14Z" fill="#c8864b" stroke="#8e5b2d" strokeWidth="1.5" />
        <path d="M20 42 Q24 46 20 48 M80 42 Q76 46 80 48 M38 84 Q42 80 44 84 M56 84 Q58 80 62 84" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="44" cy="24" r="2.8" fill="#fff" />
        <circle cx="56" cy="24" r="2.8" fill="#fff" />
        <circle cx="44" cy="24" r="1.4" fill="#2b1a0c" />
        <circle cx="56" cy="24" r="1.4" fill="#2b1a0c" />
        <path d="M43 30 Q50 36 57 30" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="46" r="4" fill="#e74c3c" />
        <circle cx="50" cy="58" r="4" fill="#27ae60" />
        <circle cx="50" cy="70" r="3.4" fill="#f1c40f" />
      </g>
    ),
  },
  farquaad: {
    name: 'Лорд Фаркуад',
    bg: ['#e57373', '#5e1515'],
    draw: (
      <g>
        <path d="M24 60 C22 34 30 26 50 26 C70 26 78 34 76 60 L68 62 L68 44 L32 44 L32 62Z" fill="#1c1c1c" />
        <path d="M34 24 L38 12 L44 20 L50 8 L56 20 L62 12 L66 24Z" fill="#f1c94b" stroke="#9a7310" strokeWidth="1.2" />
        <circle cx="50" cy="16" r="2" fill="#c0392b" />
        <ellipse cx="50" cy="58" rx="18" ry="20" fill="#f3d4b5" />
        <path d="M32 44 L68 44 L68 50 L32 50Z" fill="#1c1c1c" />
        {eye(43, 56, 3)}
        {eye(57, 56, 3)}
        <path d="M44 70 Q50 74 56 70" stroke="#7b3f2a" strokeWidth="2" fill="none" />
        <path d="M22 96 L28 78 L72 78 L78 96Z" fill="#b71c1c" />
      </g>
    ),
  },
  wolf: {
    name: 'Серый волк',
    bg: ['#aab7c4', '#34495e'],
    draw: (
      <g>
        <path d="M26 40 L22 16 L40 30Z M74 40 L78 16 L60 30Z" fill="#7f8c8d" />
        <ellipse cx="50" cy="54" rx="24" ry="22" fill="#95a5a6" />
        <ellipse cx="50" cy="68" rx="13" ry="10" fill="#d0d3d4" />
        <ellipse cx="50" cy="62" rx="5" ry="3.5" fill="#2c3e50" />
        <circle cx="40" cy="50" r="7" fill="none" stroke="#5d4037" strokeWidth="2" />
        <circle cx="60" cy="50" r="7" fill="none" stroke="#5d4037" strokeWidth="2" />
        <line x1="47" y1="50" x2="53" y2="50" stroke="#5d4037" strokeWidth="2" />
        <circle cx="40" cy="50" r="2.4" fill="#2c3e50" />
        <circle cx="60" cy="50" r="2.4" fill="#2c3e50" />
        <path d="M18 44 C18 18 82 18 82 44 C74 34 62 30 50 30 C38 30 26 34 18 44Z" fill="#fdf2e9" stroke="#e8c9b0" strokeWidth="1.5" />
        <path d="M18 44 Q12 50 18 54 M82 44 Q88 50 82 54" stroke="#e8c9b0" strokeWidth="2" fill="none" />
        <circle cx="30" cy="28" r="2" fill="#f5b7b1" />
        <circle cx="50" cy="23" r="2" fill="#f5b7b1" />
        <circle cx="70" cy="28" r="2" fill="#f5b7b1" />
        <path d="M42 74 Q50 78 58 74" stroke="#2c3e50" strokeWidth="1.8" fill="none" />
      </g>
    ),
  },
  mice: {
    name: 'Три слепые мыши',
    bg: ['#d7ccc8', '#4e342e'],
    draw: (
      <g>
        {[
          [24, 60, 0.8],
          [76, 60, 0.8],
          [50, 50, 1],
        ].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx="-12" cy="-14" r="9" fill="#9e9e9e" />
            <circle cx="12" cy="-14" r="9" fill="#9e9e9e" />
            <circle cx="-12" cy="-14" r="5" fill="#f8bbd0" />
            <circle cx="12" cy="-14" r="5" fill="#f8bbd0" />
            <ellipse cx="0" cy="0" rx="15" ry="14" fill="#bdbdbd" />
            <rect x="-13" y="-6" width="11" height="7" rx="3" fill="#111" />
            <rect x="2" y="-6" width="11" height="7" rx="3" fill="#111" />
            <line x1="-2" y1="-3" x2="2" y2="-3" stroke="#111" strokeWidth="1.5" />
            <circle cx="0" cy="7" r="2.4" fill="#e91e63" />
          </g>
        ))}
      </g>
    ),
  },
  godmother: {
    name: 'Фея-крёстная',
    bg: ['#aed6f1', '#1f4e79'],
    draw: (
      <g>
        <ellipse cx="50" cy="26" rx="16" ry="12" fill="#f5d76e" />
        <ellipse cx="50" cy="56" rx="22" ry="24" fill="#fad7c0" />
        <path d="M28 50 C26 30 74 30 72 50 C66 40 58 36 50 36 C42 36 34 40 28 50Z" fill="#f4d03f" />
        <circle cx="41" cy="54" r="7" fill="none" stroke="#8e44ad" strokeWidth="1.8" />
        <circle cx="59" cy="54" r="7" fill="none" stroke="#8e44ad" strokeWidth="1.8" />
        <circle cx="41" cy="54" r="2.4" fill="#2c3e50" />
        <circle cx="59" cy="54" r="2.4" fill="#2c3e50" />
        <path d="M42 68 Q50 74 58 68" stroke="#c0392b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M24 96 C26 82 38 78 50 78 C62 78 74 82 76 96Z" fill="#5dade2" />
        <line x1="78" y1="88" x2="88" y2="62" stroke="#f1c94b" strokeWidth="2.5" />
        <path d="M88 52 L90.5 58 L97 58 L92 62 L94 68 L88 64.5 L82 68 L84 62 L79 58 L85.5 58Z" fill="#fff59d" stroke="#f1c94b" />
      </g>
    ),
  },
  kitty: {
    name: 'Кисуля Мягколапка',
    bg: ['#d5d8dc', '#1b2631'],
    draw: (
      <g>
        <path d="M28 44 L24 20 L40 34Z M72 44 L76 20 L60 34Z" fill="#212121" />
        <ellipse cx="50" cy="56" rx="24" ry="22" fill="#2b2b2b" />
        <path d="M50 38 C40 50 40 66 50 76 C60 66 60 50 50 38Z" fill="#f5f5f5" />
        <ellipse cx="41" cy="54" rx="5.4" ry="6.4" fill="#c5e1a5" />
        <ellipse cx="59" cy="54" rx="5.4" ry="6.4" fill="#c5e1a5" />
        <ellipse cx="41" cy="55" rx="1.8" ry="5" fill="#1b1b1b" />
        <ellipse cx="59" cy="55" rx="1.8" ry="5" fill="#1b1b1b" />
        <path d="M47 64 L53 64 L50 67Z" fill="#f48fb1" />
        <path d="M24 64 L8 60 M24 67 L8 68 M76 64 L92 60 M76 67 L92 68" stroke="#bbb" strokeWidth="1.2" />
      </g>
    ),
  },
  pig: {
    name: 'Три поросёнка',
    bg: ['#f8c8dc', '#8e3b5a'],
    draw: (
      <g>
        <path d="M28 36 L22 18 L42 30Z M72 36 L78 18 L58 30Z" fill="#f48fb1" />
        <ellipse cx="50" cy="54" rx="27" ry="24" fill="#f8bbd0" />
        {eye(40, 46, 3.4)}
        {eye(60, 46, 3.4)}
        <ellipse cx="50" cy="62" rx="12" ry="9" fill="#f48fb1" stroke="#d81b60" strokeWidth="1.5" />
        <ellipse cx="45.5" cy="62" rx="2.4" ry="3.4" fill="#ad1457" />
        <ellipse cx="54.5" cy="62" rx="2.4" ry="3.4" fill="#ad1457" />
        <path d="M42 75 Q50 80 58 75" stroke="#ad1457" strokeWidth="2" fill="none" />
        <path d="M30 88 L50 80 L70 88 L70 96 L30 96Z" fill="#4e342e" />
      </g>
    ),
  },
  rumple: {
    name: 'Румпельштильцхен',
    bg: ['#d2b4de', '#4a235a'],
    draw: (
      <g>
        <path d="M30 42 C18 30 24 6 50 6 C76 6 82 30 70 42 C66 30 60 26 50 26 C40 26 34 30 30 42Z" fill="#8d6e63" />
        <path d="M30 42 C26 36 22 38 20 32 M70 42 C74 36 78 38 80 32" stroke="#6d4c41" strokeWidth="3" fill="none" />
        <ellipse cx="50" cy="54" rx="20" ry="20" fill="#f0c8a0" />
        <path d="M36 48 L46 50 M64 48 L54 50" stroke="#4e342e" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="42" cy="54" r="2.4" fill="#2c3e50" />
        <circle cx="58" cy="54" r="2.4" fill="#2c3e50" />
        <path d="M40 66 Q50 74 60 64" stroke="#7b1e2e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M24 96 C26 80 38 74 50 74 C62 74 74 80 76 96Z" fill="#6c3483" />
        <path d="M46 74 L50 84 L54 74Z" fill="#f4d03f" />
      </g>
    ),
  },
};

export const AVATAR_IDS = Object.keys(AVATARS) as AvatarId[];

export const ILLUSTRATIONS: Record<string, Art> = {
  shrek: AVATARS.shrek,
  donkey: AVATARS.donkey,
  puss: AVATARS.puss,
  dragon: AVATARS.dragon,
  gingy: AVATARS.gingy,
  fiona: AVATARS.fiona,
  farquaad: AVATARS.farquaad,
  onion: {
    name: 'Луковица',
    bg: ['#e8daef', '#5b2c6f'],
    draw: (
      <g>
        <path d="M50 16 C44 26 22 40 22 62 C22 80 36 90 50 90 C64 90 78 80 78 62 C78 40 56 26 50 16Z" fill="#c39bd3" stroke="#6c3483" strokeWidth="2" />
        <path d="M50 18 C42 34 34 48 34 64 C34 78 42 88 50 90 M50 18 C58 34 66 48 66 64 C66 78 58 88 50 90 M50 18 L50 90" stroke="#8e44ad" strokeWidth="1.6" fill="none" />
        <path d="M50 16 C48 8 44 4 40 4 M50 16 C52 8 58 6 62 8" stroke="#58a834" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M42 88 L40 94 M50 90 L50 96 M58 88 L60 94" stroke="#d7bde2" strokeWidth="1.6" />
      </g>
    ),
  },
  mirror: {
    name: 'Волшебное зеркало',
    bg: ['#aed6f1', '#1b2631'],
    draw: (
      <g>
        <ellipse cx="50" cy="50" rx="30" ry="38" fill="#d4a017" stroke="#7d6608" strokeWidth="2" />
        <ellipse cx="50" cy="50" rx="24" ry="32" fill="#5dade2" />
        <ellipse cx="50" cy="50" rx="24" ry="32" fill="url(#mirrorShine)" />
        <path d="M40 46 Q50 38 60 46 M42 60 Q50 66 58 60" stroke="#eaf2f8" strokeWidth="2" fill="none" opacity="0.9" />
        <ellipse cx="42" cy="48" rx="3" ry="2" fill="#eaf2f8" opacity="0.8" />
        <ellipse cx="58" cy="48" rx="3" ry="2" fill="#eaf2f8" opacity="0.8" />
        <defs>
          <linearGradient id="mirrorShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="12" r="4" fill="#f1c94b" />
        <circle cx="50" cy="88" r="4" fill="#f1c94b" />
      </g>
    ),
  },
  crown: {
    name: 'Корона',
    bg: ['#f9e79f', '#7d6608'],
    draw: (
      <g>
        <path d="M16 72 L20 30 L36 50 L50 22 L64 50 L80 30 L84 72Z" fill="#f1c94b" stroke="#9a7310" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="16" y="70" width="68" height="12" rx="3" fill="#d4a017" stroke="#9a7310" strokeWidth="2" />
        <circle cx="50" cy="60" r="6" fill="#c0392b" />
        <circle cx="32" cy="64" r="4" fill="#2e86c1" />
        <circle cx="68" cy="64" r="4" fill="#27ae60" />
        <circle cx="20" cy="30" r="3.5" fill="#fff" />
        <circle cx="50" cy="22" r="3.5" fill="#fff" />
        <circle cx="80" cy="30" r="3.5" fill="#fff" />
      </g>
    ),
  },
  castle: {
    name: 'Замок',
    bg: ['#fad7a0', '#784212'],
    draw: (
      <g>
        <rect x="20" y="44" width="60" height="44" fill="#d5c4a1" stroke="#7e6b4f" strokeWidth="2" />
        <rect x="14" y="30" width="16" height="58" fill="#e5d4b1" stroke="#7e6b4f" strokeWidth="2" />
        <rect x="70" y="30" width="16" height="58" fill="#e5d4b1" stroke="#7e6b4f" strokeWidth="2" />
        <rect x="40" y="22" width="20" height="30" fill="#e5d4b1" stroke="#7e6b4f" strokeWidth="2" />
        <path d="M12 30 L22 12 L32 30Z M68 30 L78 12 L88 30Z M38 22 L50 4 L62 22Z" fill="#c0392b" stroke="#7b241c" strokeWidth="1.5" />
        <path d="M42 88 L42 70 Q50 60 58 70 L58 88Z" fill="#5d4037" />
        <rect x="46" y="30" width="8" height="10" rx="4" fill="#34495e" />
        <rect x="19" y="44" width="6" height="8" rx="3" fill="#34495e" />
        <rect x="75" y="44" width="6" height="8" rx="3" fill="#34495e" />
        <path d="M50 4 L50 -4 L58 0 L50 2" fill="#f1c94b" />
      </g>
    ),
  },
  potion: {
    name: 'Зелье',
    bg: ['#d6eaf8', '#154360'],
    draw: (
      <g>
        <path d="M40 14 L60 14 L60 34 C74 40 80 52 80 64 C80 80 66 90 50 90 C34 90 20 80 20 64 C20 52 26 40 40 34Z" fill="#aed6f1" stroke="#1b4f72" strokeWidth="2.5" opacity="0.95" />
        <path d="M22 62 C30 56 40 66 50 60 C60 54 70 64 78 60 C78 78 66 88 50 88 C34 88 22 78 22 62Z" fill="#e84393" />
        <rect x="38" y="8" width="24" height="8" rx="3" fill="#8d6e63" />
        <circle cx="40" cy="72" r="3" fill="#fff" opacity="0.7" />
        <circle cx="56" cy="78" r="2" fill="#fff" opacity="0.7" />
        <circle cx="48" cy="66" r="1.6" fill="#fff" opacity="0.7" />
        <path d="M30 50 Q34 42 42 40" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round" />
      </g>
    ),
  },
  frog: {
    name: 'Лягушка',
    bg: ['#abebc6', '#145a32'],
    draw: (
      <g>
        <ellipse cx="50" cy="62" rx="32" ry="24" fill="#58d68d" />
        <circle cx="34" cy="38" r="12" fill="#58d68d" />
        <circle cx="66" cy="38" r="12" fill="#58d68d" />
        {eye(34, 38, 5)}
        {eye(66, 38, 5)}
        <path d="M30 66 Q50 80 70 66" stroke="#145a32" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M38 22 L42 14 L46 20 L50 12 L54 20 L58 14 L62 22Z" fill="#f1c94b" stroke="#9a7310" />
      </g>
    ),
  },
  star: {
    name: 'Звезда желаний',
    bg: ['#1b2631', '#0b0f1a'],
    draw: (
      <g>
        <circle cx="50" cy="50" r="30" fill="#f7dc6f" opacity="0.25" />
        <path d="M50 12 L60 38 L88 40 L66 58 L74 86 L50 70 L26 86 L34 58 L12 40 L40 38Z" fill="#f7dc6f" stroke="#d4a017" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="20" cy="18" r="1.5" fill="#fff" />
        <circle cx="84" cy="16" r="1.2" fill="#fff" />
        <circle cx="86" cy="80" r="1.5" fill="#fff" />
        <circle cx="14" cy="78" r="1.2" fill="#fff" />
      </g>
    ),
  },
  beanstalk: {
    name: 'Бобовый стебель',
    bg: ['#d6eaf8', '#1e8449'],
    draw: (
      <g>
        <ellipse cx="70" cy="18" rx="22" ry="9" fill="#fff" />
        <ellipse cx="56" cy="22" rx="14" ry="7" fill="#fdfefe" />
        <path d="M44 96 C30 76 62 66 46 48 C32 32 60 24 58 14" stroke="#1e8449" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M40 78 C28 76 26 68 30 64 C38 66 40 72 40 78Z M50 60 C62 58 66 52 64 46 C56 46 52 52 50 60Z M46 40 C34 38 32 30 36 26 C44 28 46 34 46 40Z" fill="#27ae60" />
      </g>
    ),
  },
  slipper: {
    name: 'Хрустальная туфелька',
    bg: ['#d6eaf8', '#2e4053'],
    draw: (
      <g>
        <path d="M14 70 C30 70 44 62 56 44 C60 38 68 38 72 44 L84 70 C86 76 82 80 76 80 L22 80 C14 80 10 72 14 70Z" fill="#d6eaf8" stroke="#5dade2" strokeWidth="2.5" opacity="0.95" />
        <path d="M72 80 L76 92 L82 92 L80 78" fill="#aed6f1" stroke="#5dade2" strokeWidth="2" />
        <path d="M30 70 C40 66 50 58 58 48" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M66 26 L68 32 L74 34 L68 36 L66 42 L64 36 L58 34 L64 32Z" fill="#fff" />
      </g>
    ),
  },
};

export const ILLUSTRATION_IDS = Object.keys(ILLUSTRATIONS);

export function ArtMedallion({ art, size = 72, ring = true }: { art: Art; size?: number; ring?: boolean }) {
  const gid = `g-${art.name.replace(/\s+/g, '')}-${size}`;
  return (
    <svg width={size} height={size} viewBox="-4 -4 108 108" aria-label={art.name} role="img">
      <defs>
        <radialGradient id={gid} cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor={art.bg[0]} />
          <stop offset="1" stopColor={art.bg[1]} />
        </radialGradient>
        <clipPath id={`${gid}-clip`}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} />
      <g clipPath={`url(#${gid}-clip)`}>{art.draw}</g>
      {ring && (
        <>
          <circle cx="50" cy="50" r="49" fill="none" stroke="#3b2417" strokeWidth="5" />
          <circle cx="50" cy="50" r="49" fill="none" stroke="#d4a017" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}

export function Avatar({ id, size = 72 }: { id: AvatarId; size?: number }) {
  return <ArtMedallion art={AVATARS[id] ?? AVATARS.shrek} size={size} />;
}

/** Картинка вопроса: встроенная иллюстрация или загруженный файл */
export function QuestionImage({ src, size = 260 }: { src: string; size?: number }) {
  if (src.startsWith('builtin:')) {
    const art = ILLUSTRATIONS[src.slice(8)];
    return art ? <ArtMedallion art={art} size={size} /> : null;
  }
  return <img src={src} alt="" style={{ maxHeight: size * 1.4, maxWidth: '100%', borderRadius: 16, objectFit: 'contain' }} />;
}
