import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

// Every palette the UI uses is driven by CSS variables, so one set of class names serves
// both themes. Light mode mirrors each scale (950 <-> 50, 300/400 -> 700 ...) and keeps the
// 500/600 accents, which carry white text on buttons in both themes.
const SCALES = ['slate', 'cyan', 'emerald', 'rose', 'amber', 'violet', 'purple', 'yellow', 'orange', 'blue'];
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHT_STEP = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 700, 500: 500, 600: 600, 700: 300, 800: 200, 900: 100, 950: 50 };

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const themedColors = Object.fromEntries(
  SCALES.map((s) => [s, Object.fromEntries(STEPS.map((step) => [step, v(`${s}-${step}`)]))])
);

const darkVars = {}, lightVars = {};
for (const s of SCALES) {
  for (const step of STEPS) {
    darkVars[`--c-${s}-${step}`] = rgb(colors[s][step]);
    lightVars[`--c-${s}-${step}`] = rgb(colors[s][LIGHT_STEP[step]]);
  }
}
Object.assign(darkVars, { '--c-white': '255 255 255', '--c-page': '7 11 20', '--c-code': '5 8 17' });
Object.assign(lightVars, { '--c-white': rgb(colors.slate[900]), '--c-page': rgb(colors.slate[50]), '--c-code': '255 255 255' });

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ...themedColors,
        white: v('white'),
        page: v('page'),
        code: v('code'),
        'on-accent': '#ffffff',
        ink: colors.slate[950],
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...darkVars, colorScheme: 'dark' },
        ':root[data-theme="light"]': { ...lightVars, colorScheme: 'light' },
      });
    }),
  ],
};
