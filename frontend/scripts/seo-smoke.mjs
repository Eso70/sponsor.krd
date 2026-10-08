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
const customHost = "alpha-custom.example.com";
let customDomainActive = false;
const names = {
  alpha: "Alpha Business",
  beta: "بزنس بێتا",
  "": "Platform Profile",
};
const fixture = createServer((req, res) => {
  const tenant = String(req.headers["x-subdomain"] || "");
  const url = new URL(req.url, `http://localhost:${backendPort}`);
  const respond = (data, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: status === 200, data }));
  };
  if (url.pathname === "/api/internal/domains/resolve") {
    if (req.headers["x-tenant-proxy-key"] !== "disposable-seo-smoke-secret")
      return respond(null, 403);
    const host = (url.searchParams.get("host") || "").split(":")[0];
    return respond(
      customDomainActive && [customHost, "alpha.localhost"].includes(host)
        ? {
            hostname: host,
            subdomain: "alpha",
            primaryHostname: customHost,
            isCustom: host === customHost,
          }
        : null,
    );
  }
  if (url.pathname.endsWith("/subdomain-check"))
    return respond({}, tenant in names ? 200 : 404);
  if (!(tenant in names)) return respond({}, 404);
  if (url.pathname.includes("/linktree-status/")) {
    const id = url.pathname.split("/").at(-1);
    return respond(
      { slug: id === "noindex" ? id : "same-slug" },
      id === "unavailable"
        ? 503
        : ["same-slug", "random-id", "noindex"].includes(id)
          ? 200
          : 404,
    );
  }
  if (url.pathname === "/api/public/sitemap") {
    if (!/^(0|[1-9]\d{0,4})$/.test(url.searchParams.get("chunk") || ""))
      return respond({}, 400);
    return respond({
      pages: [{ slug: "same-slug", updatedAt: "2026-10-02" }],
      totalPages: 1,
    });
  }
  if (url.pathname.includes("/linktree/")) {
    const id = url.pathname.split("/").at(-1);
    if (!["same-slug", "random-id", "noindex"].includes(id))
      return respond({}, 404);
    return respond({
      linktree: {
        id: `${tenant || "platform"}-page`,
        uid: "random-id",
        seo_name: id === "noindex" ? id : "same-slug",
        name: names[tenant],
        subtitle:
          id === "noindex"
            ? ""
            : tenant === "beta"
              ? "خزمەتگوزارییەکانی بزنس"
              : "Actual services",
        description:
          id === "noindex"
            ? "To contact us, tap one of the links below"
            : tenant === "beta"
              ? "وەسفی ڕاستەقینەی بزنس"
              : `Actual description for ${names[tenant]}`,
        template_key: "spectrum",
        template_config: {
          templateKey: "spectrum",
          seo: {
            title: "Obsolete override",
            robotsIndex: id === "noindex",
            locale: "ar",
          },
        },
        background_color: "#161b22",
        status: "active",
        footer_hidden: true,
      },
      links: [
        {
          id: "website-link",
          platform: "website",
          url: "https://example.com/official",
          display_name: "Official website",
          display_order: 0,
          metadata: {},
        },
      ],
      analytics: { pixelIds: [], actions: {} },
    });
  }
  if (url.pathname === "/api/public/platform-theme")
    return respond({ accent_color: "#25F4EE" });
  return respond({});
});

function get(host, route, agent = "Googlebot") {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port: frontendPort,
        path: route,
        agent: false,
        headers: { host: `${host}:${frontendPort}`, "user-agent": agent },
      },
      (res) => {
        const parts = [];
        res.on("data", (part) => parts.push(part));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(parts),
          }),
        );
      },
    );
    req.setTimeout(60_000, () => req.destroy(new Error("HTTP timeout")));
    req.on("error", (error) =>
      reject(
        new Error(`GET ${host}${route}: ${error.message}`, { cause: error }),
      ),
    );
    req.end();
  });
}

await new Promise((resolve) =>
  fixture.listen(backendPort, "127.0.0.1", resolve),
);
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "dev",
    "--webpack",
    "-p",
    String(frontendPort),
  ],
  {
    cwd: frontendDirectory,
    windowsHide: true,
    env: {
      ...process.env,
      SEO_SMOKE: "1",
      NEXT_PUBLIC_ROOT_DOMAIN: `localhost:${frontendPort}`,
      NEXT_PUBLIC_APP_URL: `http://localhost:${frontendPort}`,
      NEXT_PUBLIC_API_URL: `http://127.0.0.1:${backendPort}`,
      INTERNAL_PROXY_SECRET: "disposable-seo-smoke-secret",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let output = "";
child.stdout.on("data", (part) => {
  output = (output + part).slice(-12000);
});
child.stderr.on("data", (part) => {
  output = (output + part).slice(-12000);
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Next startup timed out")),
      60_000,
    );
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Next exited with ${code}`));
    });
    child.stdout.on("data", (part) => {
      if (String(part).includes("Ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  if (process.env.SEO_SMOKE_IMAGE_ONLY === "1") {
    const image = await get(
      "alpha.localhost",
      "/linktree/same-slug/share-image",
    );
    assert.equal(image.status, 200);
    console.log("Share-image HTTP check passed", image.body.length);
  } else {
    for (const tenant of ["alpha", "beta"]) {
      const host = `${tenant}.localhost`;
      const robots = await get(host, "/robots.txt");
      assert.equal(robots.status, 200);
      assert.match(
        robots.body.toString(),
        new RegExp(`${tenant}\\.localhost:${frontendPort}/sitemap\\.xml`),
      );
      const sitemap = await get(host, "/sitemap.xml");
      assert.equal(sitemap.status, 200);
      assert.match(
        sitemap.body.toString(),
        new RegExp(`${tenant}\\.localhost:${frontendPort}/linktree/same-slug`),
      );
      assert.doesNotMatch(sitemap.body.toString(), /noindex|unpublished/);
      for (const agent of ["Googlebot", "Mozilla/5.0"]) {
        const response = await get(host, "/linktree/same-slug", agent);
        assert.equal(response.status, 200);
        const html = response.body.toString();
        assert.ok(html.includes(names[tenant]));
        assert.ok(!html.includes(names[tenant === "alpha" ? "beta" : "alpha"]));
        assert.match(html, /<h1[^>]*>/);
        assert.match(html, /<title>/);
        assert.match(html, /name="description"/);
        assert.match(
          html,
          new RegExp(`<html[^>]+lang="${tenant === "alpha" ? "en" : "ckb"}"`),
        );
        assert.match(html, /rel="canonical"/);
        assert.match(html, /property="og:title"/);
        assert.doesNotMatch(
          html,
          /<title>Obsolete override|content="Obsolete override"/,
        );
        assert.match(html, /application\/ld\+json/);
        assert.match(html, /<a[^>]+href="https:\/\/example.com\/official"/);
        assert.ok(
          html.includes(`http://${host}:${frontendPort}/linktree/same-slug`),
        );
      }
      assert.equal((await get(host, "/linktree/missing")).status, 404);
      assert.equal((await get(host, "/linktree/unpublished")).status, 404);
      assert.equal((await get(host, "/linktree/INVALID")).status, 404);
      assert.equal(
        (await get(host, `/linktree/${"a".repeat(51)}`)).status,
        404,
      );
      assert.equal((await get(host, "/linktree/unavailable")).status, 503);
      const alias = await get(host, "/linktree/random-id");
      assert.equal(alias.status, 308);
      const campaign = await get(host, "/linktree/noindex");
      assert.match(campaign.body.toString(), /content="noindex, follow"/);
      const image = await get(host, "/linktree/same-slug/share-image");
      assert.equal(image.status, 200);
      assert.match(String(image.headers["content-type"]), /image\/png/);
      assert.ok(image.body.length > 1000);
      assert.equal(image.body.readUInt32BE(16), 1200);
      assert.equal(image.body.readUInt32BE(20), 630);
    }
    assert.equal((await get("unknown.localhost", "/sitemap.xml")).status, 404);
    assert.equal(
      (await get("alpha.evil.test", "/linktree/same-slug")).status,
      404,
    );
    const www = await get("www.localhost", "/linktree/same-slug");
    assert.equal(www.status, 308);
    assert.equal((await get("localhost", "/robots.txt")).status, 200);
    const platformPage = await get("localhost", "/linktree/same-slug");
    assert.equal(platformPage.status, 200);
    assert.match(
      platformPage.body.toString(),
      /<title>Platform Profile<\/title>/,
    );
    assert.match(platformPage.body.toString(), /<html[^>]+lang="en"/);
    assert.doesNotMatch(
      platformPage.body.toString(),
      /<title>Obsolete override/,
    );
    const rootSitemap = await get("localhost", "/sitemap.xml");
    assert.match(rootSitemap.body.toString(), /\/legal\/privacy/);
    assert.match(rootSitemap.body.toString(), /\/legal\/terms/);
    for (const path of ["/legal/privacy", "/legal/terms"]) {
      const rootLegal = await get("localhost", path);
      assert.equal(rootLegal.status, 200);
      assert.match(
        rootLegal.body.toString(),
        new RegExp(
          `rel="canonical" href="http://localhost:${frontendPort}${path}"`,
        ),
      );
      const tenantLegal = await get("alpha.localhost", path);
      assert.match(tenantLegal.body.toString(), /content="noindex, follow"/);
    }
    for (const path of [
      "/api/internal/domains/resolve?host=alpha.localhost",
      "/api/%69nternal/domains/resolve",
      "/api/internal/domains/tls?domain=alpha.com",
    ]) {
      assert.equal((await get("localhost", path)).status, 404);
    }
    customDomainActive = true;
    for (const path of ["/", "/linktree/same-slug?source=qr"]) {
      const alias = await get("alpha.localhost", path);
      assert.equal(alias.status, 307);
      assert.equal(alias.headers.location, `https://${customHost}${path}`);
      assert.equal(alias.headers["cache-control"], "no-store");
    }
    for (const path of [
      "/business/workspace-entry",
      "/business/workspace-entry/",
      "/business/settings",
    ]) {
      let entry = await get(customHost, path);
      if (path.endsWith("/")) {
        // Next normalizes the slash before Proxy; follow that same-host step.
        assert.equal(entry.status, 308);
        const normalized = new URL(
          entry.headers.location,
          `http://${customHost}:${frontendPort}`,
        );
        assert.equal(normalized.hostname, customHost);
        assert.equal(normalized.pathname, "/business/workspace-entry");
        entry = await get(customHost, normalized.pathname);
      }
      assert.equal(entry.status, 307);
      assert.equal(
        entry.headers.location,
        `http://alpha.localhost:${frontendPort}/business/workspace-entry`,
      );
      assert.equal(entry.headers["cache-control"], "no-store, private");
    }
    const entryPage = await get("alpha.localhost", "/business/workspace-entry");
    assert.equal(entryPage.status, 200);
    assert.match(entryPage.body.toString(), /\/api\/auth\/google\/start/);
    assert.equal((await get(customHost, "/linktree/same-slug")).status, 200);
    assert.equal((await get(customHost, "/api/auth/profile")).status, 404);
    customDomainActive = false;
    assert.equal(
      (await get("alpha.localhost", "/linktree/same-slug")).status,
      200,
    );
    assert.equal((await get(customHost, "/linktree/same-slug")).status, 404);
    console.log(
      "SEO HTTP smoke passed: tenant isolation, SEO, public redirects, custom-domain dashboard entry, removal fallback, and blocked private/internal APIs.",
    );
  }
} catch (error) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.error("Preview process status:", child.exitCode, child.signalCode);
  console.error(output.slice(-5000));
  throw error;
} finally {
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn(
        "taskkill",
        ["/PID", String(child.pid), "/T", "/F"],
        { windowsHide: true, stdio: "ignore" },
      );
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
  } else child.kill("SIGTERM");
  await new Promise((resolve) => fixture.close(resolve));
}
