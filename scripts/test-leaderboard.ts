export {};
async function test() {
  const res = await fetch('http://localhost:3000/api/v1/hackathons/hack_buildathon_2026/leaderboard');
  console.log('STATUS:', res.status);
  const json = await res.json();
  console.log('RESPONSE:', JSON.stringify(json, null, 2));
}
test();

