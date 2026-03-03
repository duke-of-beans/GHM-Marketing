const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walkDir(full));
    else if (entry.name === 'route.ts') results.push(full);
  }
  return results;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const routes = walkDir(apiDir);
const results = [];

for (const routePath of routes) {
  const content = fs.readFileSync(routePath, 'utf8');
  const relPath = routePath
    .split(path.sep).join('/')
    .split('src/app/api/')[1]
    .replace('/route.ts', '');

  const methods = [];
  if (/export\s+(async\s+)?function\s+GET/m.test(content)) methods.push('GET');
  if (/export\s+(async\s+)?function\s+POST/m.test(content)) methods.push('POST');
  if (/export\s+(async\s+)?function\s+PUT/m.test(content)) methods.push('PUT');
  if (/export\s+(async\s+)?function\s+PATCH/m.test(content)) methods.push('PATCH');
  if (/export\s+(async\s+)?function\s+DELETE/m.test(content)) methods.push('DELETE');

  const hasWithPermission = /withPermission/.test(content);
  const hasRequireTenant = /requireTenant/.test(content);
  const hasGetServerSession = /getServerSession/.test(content);
  const hasAuth = /\bauth\(\)/.test(content);
  const hasGetCurrentUser = /getCurrentUser/.test(content);
  const hasCronSecret = /CRON_SECRET/.test(content);

  const isPublicRoute = relPath.includes('public/') ||
    relPath.includes('webhook') ||
    relPath === 'auth/[...nextauth]';
  const isTokenRoute = relPath.includes('onboarding/[token]') ||
    relPath.includes('share/');

  let status = 'UNGUARDED';
  if (hasWithPermission) status = 'GUARDED_PERM';
  else if (hasGetCurrentUser && hasRequireTenant) status = 'GUARDED_SESSION_TENANT';
  else if (hasGetCurrentUser) status = 'GUARDED_SESSION';
  else if (hasGetServerSession || hasAuth) status = 'GUARDED_SESSION';
  else if (hasRequireTenant) status = 'GUARDED_TENANT';
  else if (hasCronSecret) status = 'GUARDED_CRON';
  else if (isPublicRoute) status = 'PUBLIC';
  else if (isTokenRoute) status = 'PUBLIC_TOKEN';

  results.push({
    route: '/api/' + relPath,
    methods: methods.join(','),
    status,
  });
}

// Sort UNGUARDED first
results.sort((a, b) => {
  if (a.status === 'UNGUARDED' && b.status !== 'UNGUARDED') return -1;
  if (b.status === 'UNGUARDED' && a.status !== 'UNGUARDED') return 1;
  return a.route.localeCompare(b.route);
});

// Print summary
const unguarded = results.filter(r => r.status === 'UNGUARDED');
const guarded = results.filter(r => r.status.startsWith('GUARDED'));
const pub = results.filter(r => r.status.startsWith('PUBLIC'));

console.log('=== ROUTE AUDIT SUMMARY ===');
console.log(`Total routes: ${results.length}`);
console.log(`Guarded: ${guarded.length}`);
console.log(`Public (intentional): ${pub.length}`);
console.log(`UNGUARDED: ${unguarded.length}`);
console.log('');

if (unguarded.length > 0) {
  console.log('=== UNGUARDED ROUTES ===');
  for (const r of unguarded) {
    console.log(`  ${r.methods.padEnd(12)} ${r.route}`);
  }
  console.log('');
}

console.log('=== ALL ROUTES ===');
for (const r of results) {
  console.log(`${r.status.padEnd(28)} ${r.methods.padEnd(12)} ${r.route}`);
}
