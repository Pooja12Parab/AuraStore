import { readFileSync } from 'fs';

const reports = process.argv.slice(2).map((p) => JSON.parse(readFileSync(p, 'utf8')));

const testResults = new Map();

for (const report of reports) {
  for (const spec of report.suites ?? []) {
    for (const test of spec.tests ?? []) {
      const key = `${spec.title} › ${test.title}`;
      if (!testResults.has(key)) testResults.set(key, { pass: 0, fail: 0 });
      const r = testResults.get(key);
      if (test.status === 'passed') r.pass++;
      else if (test.status === 'failed') r.fail++;
    }
  }
}

const flaky = [];
for (const [name, r] of testResults) {
  const total = r.pass + r.fail;
  if (total < 3) continue;
  const failRate = r.fail / total;
  if (failRate > 0 && failRate < 1) {
    flaky.push({ name, failRate: `${(failRate * 100).toFixed(0)}%`, pass: r.pass, fail: r.fail });
  }
}

if (flaky.length === 0) {
  console.log('No flaky tests detected.');
  process.exit(0);
}

console.log('=== Flaky Tests Detected ===');
for (const t of flaky) {
  console.log(`  ${t.name}: ${t.failRate} (${t.pass}p / ${t.fail}f)`);
}

process.exit(0); // Always exit 0 — this is a report, not a gate
