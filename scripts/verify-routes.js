const http = require('http');

const routes = [
  '/',
  '/hackathons',
  '/hackathons/apex-ai-global-hackathon-2026',
  '/projects',
  '/projects/proj_sentinel_ai',
  '/leaderboard',
  '/participant/dashboard',
  '/participant/attendance',
  '/participant/certificates',
  '/organizer/dashboard',
  '/organizer/judging',
  '/organizer/ai-jury',
  '/organizer/attendance',
  '/judge/dashboard',
  '/judge/assignments/proj_sentinel_ai',
  '/verify/APEX-2026-8F29A1',
  '/admin/dashboard',
  '/admin/overview',
  '/overview',
  '/admin/users',
  '/admin/hackathons',
  '/admin/hackathons/create',
  '/admin/teams',
  '/admin/submissions',
  '/admin/judges',
  '/admin/results',
  '/admin/certificates',
  '/admin/audit-logs',
  '/admin/system',
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${route}`, (res) => {
      resolve({ route, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ route, status: 'ERROR: ' + err.message });
    });
  });
}

async function run() {
  console.log('🚀 Verifying all application routes against http://localhost:3000...\n');
  const results = [];
  for (const r of routes) {
    const res = await checkRoute(r);
    const indicator = (res.status === 200 || res.status === 307 || res.status === 308) ? '✅' : '❌';
    console.log(`${indicator} ${res.status} : ${res.route}`);
    results.push(res);
  }

  const allPassed = results.every((r) => r.status === 200 || r.status === 307 || r.status === 308);
  console.log('\n----------------------------------------');
  if (allPassed) {
    console.log(`🎉 ALL ${routes.length} ROUTES VERIFIED SUCCESSFULLY (HTTP 200 / REDIRECTS)!`);
  } else {
    console.log('⚠️ Some routes failed verification.');
    process.exit(1);
  }
}

run();
