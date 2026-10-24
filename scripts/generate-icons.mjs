// Renders every app icon and splash image from one SVG design with sharp.
// Design: a 3/4 progress ring with an amber marker (same geometry as src/ui/components/Logo.tsx).
// Run with `npm run icons`.
import sharp from 'sharp';

const NAVY = '#1F3A5F';
const PAPER = '#FAF8F4';
const AMBER = '#E0A030';

const ring = (stroke, marker = AMBER) => `
  <circle cx="512" cy="512" r="250" fill="none" stroke="${stroke}" stroke-opacity="0.22" stroke-width="72"/>
  <path d="M512 262 A250 250 0 1 1 262 512" fill="none" stroke="${stroke}" stroke-width="72" stroke-linecap="round"/>
  <circle cx="262" cy="512" r="56" fill="${marker}"/>`;

const svg = (body, background = '') =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${background}${body}</svg>`,
  );

const outputs = [
  // Legacy/iOS icon: full square, no transparency.
  ['assets/icon.png', svg(ring(PAPER), `<rect width="1024" height="1024" fill="${NAVY}"/>`), 1024],
  // Android adaptive icon layers; the ring stays inside the 66 % safe zone.
  ['assets/android-icon-foreground.png', svg(ring(PAPER)), 1024],
  ['assets/android-icon-background.png', svg('', `<rect width="1024" height="1024" fill="${NAVY}"/>`), 1024],
  // Android 13+ themed icon: single color, the system tints it.
  ['assets/android-icon-monochrome.png', svg(ring('#FFFFFF', '#FFFFFF')), 1024],
  // Splash images on light and dark backgrounds.
  ['assets/splash-icon.png', svg(ring(NAVY)), 1024],
  ['assets/splash-icon-dark.png', svg(ring('#A9C4E6')), 1024],
  ['assets/favicon.png', svg(ring(PAPER), `<rect width="1024" height="1024" rx="200" fill="${NAVY}"/>`), 48],
];

for (const [file, data, size] of outputs) {
  await sharp(data).resize(size, size).png().toFile(file);
  console.log('wrote', file);
}
