// One-off asset generator: og-image.png (1200x630) + apple-touch-icon.png (180x180).
// Run with `npm run images` after branding changes. Output committed to public/.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = resolve(__dirname, '..', 'public');

// Single quotes for multiword names — these sit inside double-quoted XML attributes.
const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Helvetica, Arial, sans-serif";
const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#173D60"/>
      <stop offset="1" stop-color="#0E151D"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#1F4E79"/>
  <text x="80" y="150" font-family="${font}" font-size="30" font-weight="700" letter-spacing="3" fill="#6FA8D6">EWM MASTERY</text>
  <text x="80" y="270" font-family="${font}" font-size="82" font-weight="800" fill="#FFFFFF">SAP EWM Support</text>
  <text x="80" y="360" font-family="${font}" font-size="82" font-weight="800" fill="#FFFFFF">&amp; Interview Prep</text>
  <text x="80" y="440" font-family="${font}" font-size="34" fill="#9DACBB">Free · offline · no login — by Avinash Chavan</text>
  <g font-family="${mono}" font-size="30" fill="#E8EDF3">
    <rect x="80" y="490" width="240" height="70" rx="12" fill="#16283A" stroke="#2C3947"/>
    <text x="105" y="534" font-weight="600">26 runbooks</text>
    <rect x="344" y="490" width="240" height="70" rx="12" fill="#16283A" stroke="#2C3947"/>
    <text x="369" y="534" font-weight="600">21 study days</text>
    <rect x="608" y="490" width="240" height="70" rx="12" fill="#16283A" stroke="#2C3947"/>
    <text x="633" y="534" font-weight="600">630 Q&amp;A</text>
  </g>
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" rx="40" fill="#1F4E79"/>
  <text x="90" y="110" font-family="${font}" font-size="52" font-weight="800" letter-spacing="-1" fill="#FFFFFF" text-anchor="middle">EWM</text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile(resolve(pub, 'og-image.png'));
await sharp(Buffer.from(icon)).png().toFile(resolve(pub, 'apple-touch-icon.png'));
console.log('generated og-image.png (1200x630) + apple-touch-icon.png (180x180)');
