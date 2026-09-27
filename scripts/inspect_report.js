const fs = require('fs');
const readline = require('readline');

async function run() {
  const filePath = 'C:/Users/sathi/.gemini/antigravity-ide/brain/330f9ec5-fa89-45d3-bbed-30561d800ce1/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"step_index":1237')) {
      const obj = JSON.parse(line);
      console.log('--- REPORT END ---');
      console.log(obj.content.substring(obj.content.length - 4000));
      break;
    }
  }
}
run();
