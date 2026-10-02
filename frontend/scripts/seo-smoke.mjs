/** Real Next HTTP/HTML integration against disposable, owner-scoped fixtures. */
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../package.json", import.meta.url));
const frontendDirectory = fileURLToPath(new URL("..", import.meta.url));
const frontendPort = 4312;
const backendPort = 4313;
const names = { alpha: "Alpha Business", beta: "بزنس بێتا", "": "Platform Profile" };
const fixture = createServer((req, res) => {
  const tenant = String(req.headers["x-subdomain"] || "");
  const url = new URL(req.url, `http://localhost:${backendPort}`);
  const respond = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify({ success: status === 200, data })); };
  if (url.pathname.endsWith("/subdomain-check")) return respond({}, tenant in names ? 200 : 404);
  if (!(tenant in names)) return respond({}, 404);
  if (url.pathname.includes("/linktree-status/")) {
    const id = url.pathname.split("/").at(-1);
    return respond({ slug: id === "noindex" ? id : "same-slug" }, id === "unavailable" ? 503 : ["same-slug", "random-id", "noindex"].includes(id) ? 200 : 404);
  }
  if (url.pathname === "/api/public/sitemap") {
    return respond({ pages: [{ slug: "same-slug", updatedAt: "2026-10-02" }], totalPages: 1 });
  }
  if (url.pathname.includes("/linktree/")) {
    const id = url.pathname.split("/").at(-1);
    if (!["same-slug", "random-id", "noindex"].includes(id)) return respond({}, 404);
    return respond({ linktree: {
      id: `${tenant || "platform"}-page`, uid: "random-id", seo_name: id === "noindex" ? id : "same-slug",
      name: names[tenant], subtitle: "Actual services", description: `Actual description for ${names[tenant]}`,
      template_key: "spectrum", template_config: { templateKey: "spectrum", seo: { robotsIndex: id !== "noindex", locale: tenant === "alpha" ? "en" : "ckb" } },
      background_color: "#161b22", status: "active", footer_hidden: true,
    }, links: [{ id: "website-link", platform: "website", url: "https://example.com/official", display_name: "Official website", display_order: 0, metadata: {} }],
    analytics: { pixelIds: [], actions: {} } });
  }
  if (url.pathname === "/api/public/platform-theme") return respond({ accent_color: "#25F4EE" });
  return respond({});
});

function get(host, route, agent = "Googlebot") {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port: frontendPort, path: route, agent: false, headers: { host: `${host}:${frontendPort}`, "user-agent": agent } }, res => {
      const parts = []; res.on("data", part => parts.push(part));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(parts) }));
    });
    req.setTimeout(60_000, () => req.destroy(new Error("HTTP timeout")));
    req.on("error", error => reject(new Error(`GET ${host}${route}: ${error.message}`, { cause: error }))); req.end();
  });
}

await new Promise(resolve => fixture.listen(backendPort, "127.0.0.1", resolve));
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--webpack", "-p", String(frontendPort)], {
  cwd: frontendDirectory, windowsHide: true,
  env: { ...process.env, SEO_SMOKE: "1", NEXT_PUBLIC_ROOT_DOMAIN: `localhost:${frontendPort}`, NEXT_PUBLIC_APP_URL: `http://localhost:${frontendPort}`,
    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${backendPort}`, INTERNAL_PROXY_SECRET: "disposable-seo-smoke-secret" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", part => { output = (output + part).slice(-12000); });
child.stderr.on("data", part => { output = (output + part).slice(-12000); });
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Next startup timed out")), 60_000);
    child.once("exit", code => { clearTimeout(timeout); reject(new Error(`Next exited with ${code}`)); });
    child.stdout.on("data", part => { if (String(part).includes("Ready")) { clearTimeout(timeout); resolve(); } });
  });
  if (process.env.SEO_SMOKE_IMAGE_ONLY === "1") {
    const image = await get("alpha.localhost", "/linktree/same-slug/share-image");
    assert.equal(image.status, 200); console.log("Share-image HTTP check passed", image.body.length);
  } else {
  for (const tenant of ["alpha", "beta"]) {
    const host = `${tenant}.localhost`;
    const robots = await get(host, "/robots.txt"); assert.equal(robots.status, 200);
    assert.match(robots.body.toString(), new RegExp(`${tenant}\\.localhost:${frontendPort}/sitemap\\.xml`));
    const sitemap = await get(host, "/sitemap.xml"); assert.equal(sitemap.status, 200);
    assert.match(sitemap.body.toString(), new RegExp(`${tenant}\\.localhost:${frontendPort}/linktree/same-slug`));
    assert.doesNotMatch(sitemap.body.toString(), /noindex|unpublished/);
    for (const agent of ["Googlebot", "Mozilla/5.0"]) {
      const response = await get(host, "/linktree/same-slug", agent); assert.equal(response.status, 200);
      const html = response.body.toString();
      assert.ok(html.includes(names[tenant])); assert.ok(!html.includes(names[tenant === "alpha" ? "beta" : "alpha"]));
      assert.match(html, /<h1[^>]*>/); assert.match(html, /<title>/); assert.match(html, /name="description"/);
      assert.match(html, new RegExp(`<html[^>]+lang="${tenant === "alpha" ? "en" : "ckb"}"`));
      assert.match(html, /rel="canonical"/); assert.match(html, /property="og:title"/);
      assert.match(html, /application\/ld\+json/); assert.match(html, /<a[^>]+href="https:\/\/example.com\/official"/);
      assert.ok(html.includes(`http://${host}:${frontendPort}/linktree/same-slug`));
    }
    assert.equal((await get(host, "/linktree/missing")).status, 404);
    assert.equal((await get(host, "/linktree/unpublished")).status, 404);
    assert.equal((await get(host, "/linktree/INVALID")).status, 404);
    assert.equal((await get(host, `/linktree/${"a".repeat(51)}`)).status, 404);
    assert.equal((await get(host, "/linktree/unavailable")).status, 503);
    const alias = await get(host, "/linktree/random-id"); assert.equal(alias.status, 308);
    const campaign = await get(host, "/linktree/noindex"); assert.match(campaign.body.toString(), /content="noindex, follow"/);
    const image = await get(host, "/linktree/same-slug/share-image");
    assert.equal(image.status, 200); assert.match(String(image.headers["content-type"]), /image\/png/);
    assert.ok(image.body.length > 1000);
    assert.equal(image.body.readUInt32BE(16), 1200);
    assert.equal(image.body.readUInt32BE(20), 630);
  }
  assert.equal((await get("unknown.localhost", "/sitemap.xml")).status, 404);
  assert.equal((await get("alpha.evil.test", "/linktree/same-slug")).status, 404);
  const www = await get("www.localhost", "/linktree/same-slug"); assert.equal(www.status, 308);
  assert.equal((await get("localhost", "/robots.txt")).status, 200);
  const rootSitemap = await get("localhost", "/sitemap.xml");
  assert.match(rootSitemap.body.toString(), /\/legal\/privacy/);
  assert.match(rootSitemap.body.toString(), /\/legal\/terms/);
  for (const path of ["/legal/privacy", "/legal/terms"]) {
    const rootLegal = await get("localhost", path);
    assert.equal(rootLegal.status, 200);
    assert.match(rootLegal.body.toString(), new RegExp(`rel="canonical" href="http://localhost:${frontendPort}${path}"`));
    const tenantLegal = await get("alpha.localhost", path);
    assert.match(tenantLegal.body.toString(), /content="noindex, follow"/);
  }
  console.log("SEO HTTP smoke passed: two tenants, raw HTML, robots, sitemaps, real links, OG images, 404/503/308, noindex, and hostile hosts.");
  }
} catch (error) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.error("Preview process status:", child.exitCode, child.signalCode);
  console.error(output.slice(-5000)); throw error;
} finally {
  if (process.platform === "win32") {
    await new Promise(resolve => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      killer.on("exit", resolve); killer.on("error", resolve);
    });
  } else child.kill("SIGTERM");
  await new Promise(resolve => fixture.close(resolve));
}
