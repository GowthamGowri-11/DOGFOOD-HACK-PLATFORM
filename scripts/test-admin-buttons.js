const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Testing Admin Buttons & API Endpoints...');

  // 1. Test CSV Export endpoint
  console.log('\n--- 1. Testing CSV Export ---');
  const exportRes = await request('GET', '/api/v1/admin/users/export');
  console.log('Export Status:', exportRes.status);
  console.log('Content-Type:', exportRes.headers['content-type']);
  console.log('CSV preview:', typeof exportRes.body === 'string' ? exportRes.body.slice(0, 150) : exportRes.body);
  if (exportRes.status !== 200 || !exportRes.body.includes('ID,Full Name,Email,Role,Status,Phone,Created At')) {
    throw new Error('Export CSV failed!');
  }
  console.log('✓ CSV Export test passed!');

  // 2. Test Create User button endpoint
  console.log('\n--- 2. Testing Create User ---');
  const testEmail = `button_test_${Date.now()}@example.com`;
  const createRes = await request('POST', '/api/v1/admin/users', {
    fullName: 'Button Test User',
    email: testEmail,
    password: 'Password123!',
    role: 'Student',
    phone: '9876543210',
  });
  console.log('Create User Status:', createRes.status);
  console.log('Create User Response:', createRes.body);
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error('Create User failed: ' + JSON.stringify(createRes.body));
  }
  const createdUser = createRes.body.data.user;
  const createdId = createdUser.id;
  console.log('✓ Created User ID:', createdId, 'Role:', createdUser.role);

  // 3. Test Refresh endpoint (GET /api/v1/admin/users?pageSize=100)
  console.log('\n--- 3. Testing Refresh Users Endpoint ---');
  const refreshRes = await request('GET', '/api/v1/admin/users?pageSize=100');
  console.log('Refresh Status:', refreshRes.status);
  if (refreshRes.status !== 200 || !refreshRes.body.success) {
    throw new Error('Refresh failed!');
  }
  const foundInRefresh = refreshRes.body.data.users.find(u => u.id === createdId);
  console.log('Found created user in refresh?', Boolean(foundInRefresh), foundInRefresh ? foundInRefresh.bio : '');
  if (!foundInRefresh) {
    throw new Error('Created user not found in refresh list!');
  }
  console.log('✓ Refresh test passed!');

  // 4. Test Edit User button endpoint (PATCH /api/v1/admin/users/[id])
  console.log('\n--- 4. Testing Edit User ---');
  const editRes = await request('PATCH', `/api/v1/admin/users/${createdId}`, {
    fullName: 'Button Test User (Edited)',
    role: 'ORGANIZER',
    isActive: false,
    bio: 'Phone: 9998887776',
  });
  console.log('Edit User Status:', editRes.status);
  console.log('Edit User Response:', editRes.body);
  if (editRes.status !== 200 || !editRes.body.success) {
    throw new Error('Edit User failed: ' + JSON.stringify(editRes.body));
  }
  const updatedUser = editRes.body.data.user;
  if (updatedUser.fullName !== 'Button Test User (Edited)' || updatedUser.isActive !== false || updatedUser.role !== 'ORGANIZER') {
    throw new Error('Updated fields mismatch!');
  }
  console.log('✓ Edit User test passed!');

  // 5. Cleanup: Delete test user
  console.log('\n--- 5. Cleanup: Delete Test User ---');
  const deleteRes = await request('DELETE', `/api/v1/admin/users/${createdId}`);
  console.log('Delete Status:', deleteRes.status);
  console.log('✓ Cleanup completed!');

  console.log('\n========================================');
  console.log('ALL ADMIN BUTTON APIS TESTED & VERIFIED!');
  console.log('========================================');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
