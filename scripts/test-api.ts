export {};
async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/admin/teams');
    console.log('STATUS:', res.status);
    const json = await res.json();
    console.log('SUCCESS:', json.success);
    console.log('HACKATHONS:', json.data?.hackathons?.length);
    console.log('TEAMS:', json.data?.teams?.length);
    console.log('STATS:', json.data?.stats);
    if (!json.success) {
      console.log('ERROR:', json.error);
    }
  } catch (e) {
    console.error('FETCH ERROR:', e);
  }
}
test();

