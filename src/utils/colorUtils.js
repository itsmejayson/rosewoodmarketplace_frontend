export function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    default: h = (r - g) / d + 4;
  }

  return {
    h: Math.round((h / 6) * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Apply a hex brand color to all CSS variables that drive the rosewood palette
export function applyBrandColor(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const { h, s } = hexToHsl(hex);
  const root = document.documentElement;
  root.style.setProperty('--rw-h', h);
  root.style.setProperty('--rw-s', `${s}%`);
  // Keep shadcn/ui --primary and --ring in sync (rosewood-600 L=50%)
  root.style.setProperty('--primary', `${h} ${s}% 50%`);
  root.style.setProperty('--ring', `${h} ${s}% 50%`);
}
