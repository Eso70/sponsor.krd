const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Never inherit the application's database name for a mutating smoke check.
const database =
  process.env.COMMUNICATION_SMOKE_DB_NAME || 'sponsor_krd_communications_test';
if (!/^sponsor_krd_communications_test(?:_[a-z0-9]+)?$/.test(database)) {
  throw new Error(
    'COMMUNICATION_SMOKE_DB_NAME must name a dedicated sponsor_krd_communications_test database',
  );
}
const result = spawnSync(
  process.execPath,
  [
    require.resolve('jest/bin/jest'),
    '--config',
    './test/jest-e2e.json',
    '--runInBand',
    '--runTestsByPath',
    './test/app.e2e-spec.ts',
    '--testNamePattern',
    'communications smoke',
  ],
  {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DB_NAME: database },
    windowsHide: true,
    stdio: 'inherit',
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
