import * as fs from 'fs';
import * as path from 'path';

/**
 * Smoke test: Validates the Caddyfile contains required configuration
 * for wildcard subdomain routing on sponsor.krd.
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 */
describe('Caddyfile Configuration Validation', () => {
  let caddyfileContent: string;

  beforeAll(() => {
    const caddyfilePath = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'Caddyfile',
    );
    caddyfileContent = fs.readFileSync(caddyfilePath, 'utf-8');
  });

  it('should contain wildcard entry for *.sponsor.krd', () => {
    expect(caddyfileContent).toMatch(/\*\.sponsor\.krd/);
  });

  it('forwards resolved visitor addresses on every frontend and backend route', () => {
    expect(
      caddyfileContent.match(/header_up X-Forwarded-For \{client_ip\}/g),
    ).toHaveLength(6);
    expect(
      caddyfileContent.match(/header_up X-Real-IP \{client_ip\}/g),
    ).toHaveLength(6);
    expect(caddyfileContent).not.toMatch(
      /header_up X-(?:Forwarded-For|Real-IP) \{remote_host\}/,
    );
    expect(caddyfileContent).toContain('client_ip_headers CF-Connecting-IP');
    expect(caddyfileContent).toContain('trusted_proxies_strict');
    expect(caddyfileContent).toMatch(
      /trusted_proxies static 173\.245\.48\.0\/20/,
    );
    expect(caddyfileContent).not.toContain(
      'trusted_proxies static private_ranges',
    );
  });

  it('should contain Host header preservation (header_up Host {host})', () => {
    expect(caddyfileContent).toMatch(/header_up\s+Host\s+\{host\}/);
  });

  it('should contain a tls block', () => {
    expect(caddyfileContent).toMatch(/tls\s*\{/);
  });

  it('should contain dns cloudflare for TLS DNS challenge', () => {
    expect(caddyfileContent).toMatch(/dns\s+cloudflare/);
  });

  it('should contain sponsor.krd root domain entry (separate from wildcard)', () => {
    // Match "sponsor.krd {" that is NOT preceded by "*."
    expect(caddyfileContent).toMatch(/^sponsor\.krd\s*[,{]/m);
  });

  it('should contain proxy to frontend (localhost:3011)', () => {
    expect(caddyfileContent).toMatch(/localhost:3011/);
  });

  it('should contain proxy to backend (localhost:4000)', () => {
    expect(caddyfileContent).toMatch(/localhost:4000/);
  });
  it('marks direct API responses as nonindexable on root and tenant hosts', () => {
    expect(
      caddyfileContent.match(
        /header @api X-Robots-Tag "noindex, nofollow, noarchive"/g,
      ),
    ).toHaveLength(3);
  });
});
