function hexToRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255];
}
function lin(c) { return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function lum(h) { const [r,g,b] = hexToRgb(h).map(lin); return 0.2126*r + 0.7152*g + 0.0722*b; }
function cr(h1,h2) { const l1=lum(h1),l2=lum(h2); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); }

// Adjust HSL lightness to hit target contrast
function hslToHex(h,s,l) {
  s/=100; l/=100;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k=(n+h/30)%12; const c=l-a*Math.max(-1,Math.min(k-3,9-k,1)); return Math.round(255*c).toString(16).padStart(2,'0'); };
  return '#'+f(0)+f(8)+f(4);
}
function hexToHsl(h) {
  let [r,g,b] = hexToRgb(h);
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let hv, s, l=(max+min)/2;
  if(max===min){hv=s=0;}else{
    const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:hv=((g-b)/d+(g<b?6:0))/6;break;case g:hv=((b-r)/d+2)/6;break;default:hv=((r-g)/d+4)/6;}
  }
  return [Math.round(hv*360), Math.round(s*100), Math.round(l*100)];
}

const pairs = [
  ['muted-fg / bg-light',        '#64748b','#f8fafc', 4.5, 'light', '--muted-foreground'],
  ['muted-fg / muted-light',     '#64748b','#f1f5f9', 4.5, 'light', '--muted-foreground'],
  ['muted-fg / card-light',      '#64748b','#ffffff', 4.5, 'light', '--muted-foreground'],
  ['muted-fg / bg-dark',         '#64748b','#0f172a', 4.5, 'dark',  '--muted-foreground (dark)'],
  ['muted-fg / card-dark',       '#64748b','#1e293b', 4.5, 'dark',  '--muted-foreground (dark)'],
  ['sidebar-fg / sidebar',       '#93a3b8','#0c1222', 4.5, 'both',  '--sidebar-foreground'],
  ['sidebar-muted / sidebar',    '#4b5c72','#0c1222', 4.5, 'both',  '--sidebar-muted'],
  ['sidebar-active / sidebar',   '#a5b4fc','#0c1222', 3.0, 'both',  '--sidebar-active'],
  ['success / success-bg',       '#16a34a','#dcfce7', 4.5, 'light', '--status-success'],
  ['warning / warning-bg',       '#eab308','#fef9c3', 4.5, 'light', '--status-warning'],
  ['danger / danger-bg',         '#dc2626','#fee2e2', 4.5, 'light', '--status-danger'],
  ['info / info-bg',             '#2563eb','#dbeafe', 4.5, 'light', '--status-info'],
  ['neutral / neutral-bg',       '#64748b','#f1f5f9', 4.5, 'light', '--status-neutral'],
  ['destructive / white',        '#ef4444','#ffffff', 4.5, 'light', '--destructive'],
  ['dark-warning / dark-warn-bg','#facc15','#422006', 4.5, 'dark',  '--status-warning (dark)'],
  ['dark-danger / dark-danger-bg','#f87171','#450a0a',4.5, 'dark',  '--status-danger (dark)'],
  ['dark-info / dark-info-bg',   '#60a5fa','#172554', 4.5, 'dark',  '--status-info (dark)'],
];

console.log('=== WCAG AA Contrast Audit — COVOS Signal Palette ===\n');
const results = [];
pairs.forEach(([name, fg, bg, thresh, mode, token]) => {
  const ratio = cr(fg, bg);
  const pass = ratio >= thresh;
  const [h,s,l] = hexToHsl(fg);
  let fixedHex = null;
  let fixedL = null;
  if (!pass) {
    // Try adjusting lightness — dark bg needs lighter fg, light bg needs darker fg
    const bgLum = lum(bg);
    // Search for minimum lightness change
    for (let delta = 1; delta <= 60; delta++) {
      const tryL = bgLum > lum(fg) ? l+delta : l-delta; // go lighter on dark bg, darker on light bg
      if (tryL < 0 || tryL > 100) continue;
      const tryHex = hslToHex(h, s, tryL);
      if (cr(tryHex, bg) >= thresh) {
        fixedHex = tryHex;
        fixedL = tryL;
        break;
      }
    }
  }
  const result = { name, fg, bg, ratio: ratio.toFixed(2), thresh, pass, mode, token, h, s, l, fixedHex, fixedL };
  results.push(result);
  const status = pass ? '✅ PASS' : '❌ FAIL';
  const fix = fixedHex ? ` → fix: L${l}→L${fixedL} (${fixedHex})` : '';
  console.log(`${status}  ${ratio.toFixed(2).padStart(5)}:1 (need ${thresh}:1)  ${name}${fix}`);
});

console.log('\n=== FAILING TOKENS & FIXES ===\n');
results.filter(r => !r.pass).forEach(r => {
  console.log(`Token: ${r.token}`);
  console.log(`  Mode: ${r.mode}, Pair: ${r.name}`);
  console.log(`  Current: hsl(${r.h} ${r.s}% ${r.l}%)  hex: ${r.fg}  ratio: ${r.ratio}:1`);
  if (r.fixedHex) {
    console.log(`  Fixed:   hsl(${r.h} ${r.s}% ${r.fixedL}%)  hex: ${r.fixedHex}`);
  }
  console.log('');
});
