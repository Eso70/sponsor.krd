import { readFileSync } from 'fs';
import { join } from 'path';

type RootManifest = {
  packageManager?: string;
  engines?: { pnpm?: string };
  pnpm?: { overrides?: Record<string, string> };
};

type BackendManifest = {
  dependencies?: Record<string, string>;
};

const workspaceRoot = join(__dirname, '../../..');
const rootManifest = JSON.parse(
  readFileSync(join(workspaceRoot, 'package.json'), 'utf8'),
) as RootManifest;
const backendManifest = JSON.parse(
  readFileSync(join(workspaceRoot, 'backend/package.json'), 'utf8'),
) as BackendManifest;
const lockfile = readFileSync(join(workspaceRoot, 'pnpm-lock.yaml'), 'utf8');

describe('production dependency alignment', () => {
  it('pins the package manager that owns the committed lockfile format', () => {
    expect(rootManifest.packageManager).toBe('pnpm@9.15.9');
    expect(rootManifest.engines?.pnpm).toBe('9.15.9');
  });

  it('resolves Nest and every Fastify plugin through one Fastify version', () => {
    const fastifyVersion = backendManifest.dependencies?.fastify;
    expect(fastifyVersion).toBe('5.11.3');
    expect(rootManifest.pnpm?.overrides?.fastify).toBe(fastifyVersion);

    const installedFastifyVersions = [
      ...lockfile.matchAll(/^\s{2}fastify@(\d+\.\d+\.\d+):$/gm),
    ].map((match) => match[1]);
    expect([...new Set(installedFastifyVersions)]).toEqual([fastifyVersion]);
  });
});
