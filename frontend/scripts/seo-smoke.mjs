/** Real Next HTTP/HTML integration against disposable, owner-scoped fixtures. */
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";

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
  if (process.env.SEO_SMOKE_FORMS_LOADING_ONLY === "1") {
    if (url.pathname === "/api/auth/session") {
      const locale =
        /business_dashboard_locale=(en|ar|ckb)/.exec(
          String(req.headers.cookie || ""),
        )?.[1] || "en";
      return setTimeout(() => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            user: {
              id: "11111111-1111-4111-8111-111111111111",
              username: tenant,
              subdomain: tenant,
              name: names[tenant],
              website_color: "#22c55e",
              preferred_locale: locale,
            },
          }),
        );
      }, 350);
    }
    if (url.pathname === "/api/auth/effective-access")
      return respond({
        subscription: {
          id: "fixture",
          status: "active",
          planId: "fixture",
          planCode: "max",
          planName: "Max",
          currentPeriodEnd: null,
        },
        navigation: { forms: true },
        permissions: Object.fromEntries(
          ["business:forms:read", "business:pages:forms-access"].map((key) => [
            key,
            { outcome: "allow" },
          ]),
        ),
        entitlements: {},
        usage: {},
        templateKeys: ["spectrum"],
        pendingApprovals: [],
      });
    if (url.pathname === "/api/linktrees") return respond([]);
  }
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
  if (url.pathname === "/api/public/platform-branding") return respond({name: "Sponsor.krd", logo: "/images/brand/rise.svg", favicon: "/images/brand/rise.ico"});
  if (url.pathname.startsWith("/api/auth/subdomain-theme/")) {
    const name = url.pathname.split("/").at(-1);
    return name in names ? respond({name: names[name], logo: "/images/upload/test.png", favicon: "/images/upload/test.png"}) : respond({}, 404);
  }
  if (url.pathname.endsWith("/subdomain-check"))
    return respond({}, tenant in names ? 200 : 404);
  if (!(tenant in names)) return respond({}, 404);
  if (url.pathname === "/api/public/business") return respond({ name: names[tenant], logo: "/images/upload/test.png", website_color: "#22c55e" });
  if (url.pathname === "/api/public/linktrees") return respond([]);

  if (url.pathname.includes("/linktree-status/")) {
    const id = url.pathname.split("/").at(-1);
    return respond(
      { slug: ["noindex", "categorized", "hidden-seo"].includes(id) ? id : "same-slug" },
      id === "unavailable"
        ? 503
        : ["same-slug", "random-id", "noindex", "categorized", "hidden-seo"].includes(id)
          ? 200
          : 404,
    );
  }
  if (url.pathname.includes("/api/public/forms/")) {
    const id = url.pathname.split("/")[4];
    if (!["contact", "starter", "card"].includes(id)) return respond({}, 404);
    if (url.pathname.endsWith("/status")) return respond({ slug: id });
    return respond({
      form: {
        id: "form-id",
        slug: id,
        name: `${names[tenant]} contact`,
        headline: `${names[tenant]} contact`,
        description:
          id === "starter" ? "" : "Book a consultation with our business team.",
        status: "active",
        layout: id === "card" ? "card" : "form",
        language: tenant === "beta" ? "ckb" : "en",
        appearance: "light",
        color: "#16a34a",
        banner: "/images/upload/test.png",
        logo: "",
        bannerEnabled: true,
        logoEnabled: false,
        questions: [],
        blocks: [],
        actions: [],
        actionsEnabled: false,
        finalHeadline: "Thanks",
        finalDescription: "",
        buttonText: "",
        buttonUrl: "",
      },
      analytics: {
        pixelIds: [`FORM_${(tenant || "platform").toUpperCase()}_PIXEL`],
        actions: {},
      },
      privacyVersion: "2026-10-11",
    });
  }
  if (url.pathname === "/api/public/sitemap") {
    if (!/^(0|[1-9]\d{0,4})$/.test(url.searchParams.get("chunk") || ""))
      return respond({}, 400);
    return respond({
      pages: [
        { slug: "same-slug", updatedAt: "2026-10-02" },
        { slug: "categorized", updatedAt: "2026-10-14" },
        { slug: "contact", pageType: "form", updatedAt: "2026-10-11" },
      ],
      totalPages: 1,
    });
  }
  if (url.pathname.includes("/linktree/")) {
    const id = url.pathname.split("/").at(-1);
    if (!["same-slug", "random-id", "noindex", "categorized", "hidden-seo"].includes(id))
      return respond({}, 404);
    return respond({
      linktree: {
        id: `${tenant || "platform"}-page`,
        uid: "random-id",
        seo_name: ["noindex", "categorized", "hidden-seo"].includes(id) ? id : "same-slug",
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
          seo: ["categorized", "hidden-seo"].includes(id) ? {
            version: 1, category: "food", businessType: "restaurant",
            title: `${names[tenant]} search title — خزمەتگوزارییەکان و زانیارییەکانی پەیوەندی — معلومات النشاط والخدمات — Business information and contacts`, description: `${names[tenant]} search description`,
            language: tenant === "alpha" ? "ar" : "ckb", indexing: id === "hidden-seo" ? "noindex" : "auto",
            business: { street: "Fixture street", city: "Fixture city", cuisine: "Fixture cuisine", hours: { days: ["Mo"], opens: "09:00", closes: "18:00" } },
          } : {
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

function get(host, route, agent = "Googlebot", cookie = "") {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port: frontendPort,
        path: route,
        agent: false,
        headers: {
          host: `${host}:${frontendPort}`,
          "user-agent": agent,
          ...(cookie ? { cookie } : {}),
        },
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
      ...(process.env.SEO_SMOKE_FORMS_LOADING_ONLY === "1"
        ? { PLATFORM_ADMIN_PATH: "forms-loading-fixture-console" }
        : {}),
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
  if (process.env.SEO_SMOKE_FORMS_LOADING_ONLY === "1") {
    for (const locale of ["en", "ar", "ckb"]) {
      for (const [host, path, cookie] of [
        [
          "alpha.localhost",
          "/business/forms",
          `business_session=fixture-only; business_dashboard_locale=${locale}`,
        ],
        [
          "localhost",
          "/forms-loading-fixture-console/forms",
          `platform_admin_session=fixture-only; platform_dashboard_locale=${locale}`,
        ],
      ]) {
        const response = await get(host, path, "Mozilla/5.0", cookie);
        assert.equal(
          response.status,
          200,
          `${path} must render successfully (${locale})`,
        );
        assert.doesNotMatch(
          response.body.toString(),
          /Functions cannot be passed directly|3602605739|1353732555/,
        );
        const titleBrand = host === "localhost" ? "Sponsor.krd" : names.alpha;
        const tabTitle = response.body.toString().match(/<title>([^<]+)<\/title>/)?.[1];
        assert.ok(tabTitle?.endsWith(` | ${titleBrand}`), `owner title on ${path}: ${tabTitle}`);
        assert.match(response.body.toString(), /name="robots"[^>]+noindex/);
        assert.equal((response.body.toString().match(/rel="icon"/g) || []).length, 1);

        assert.match(
          response.body.toString(),
          /grid-cols-1 lg:grid-cols-2 xl:grid-cols-3/,
        );
      }
    }
    assert.doesNotMatch(output, /Functions cannot be passed directly/);
    console.log(
      "Forms loading HTTP checks passed for Business and Platform in all three languages",
    );
  } else if (process.env.SEO_SMOKE_IMAGE_ONLY === "1") {
    const image = await get(
      "alpha.localhost",
      "/linktree/same-slug/share-image",
    );
    assert.equal(image.status, 200);
    console.log("Share-image HTTP check passed", image.body.length);
  } else {
    const platformIcon = await get("localhost", "/favicon.ico");
    assert.equal(platformIcon.status, 307);
    assert.match(String(platformIcon.headers.location), /\/images\/brand\/rise\.ico$/);
    const iconFile = await get("localhost", "/images/brand/rise.ico");
    assert.equal(iconFile.status, 200);
    assert.deepEqual([...iconFile.body.subarray(0, 4)], [0, 0, 1, 0]);
    const tenantImages = [];
    for (const tenant of ["alpha", "beta"]) {
      const host = `${tenant}.localhost`;
      const tabIcon = await get(host, "/favicon.ico");
      assert.equal(tabIcon.status, 307);
      assert.match(String(tabIcon.headers.location), /\/api\/public\/brand-icon\?asset=/);
      assert.equal(new URL(tabIcon.headers.location, `http://${host}:${frontendPort}`).hostname, host);
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
        assert.equal((html.match(/<title>/g) || []).length, 1, "one unambiguous tab title");
        assert.equal((html.match(/rel="icon"/g) || []).length, 1, "one tab icon candidate");
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
      tenantImages.push(image.body);
      const customized = await get(host, "/linktree/categorized?utm_source=test");
      assert.equal(customized.status, 200);
      const customHtml = customized.body.toString();
      assert.ok(customHtml.includes(`${names[tenant]} search title`));
      assert.ok(customHtml.includes(`${names[tenant]} search description`));
      assert.match(customHtml, /Fixture street/);
      assert.match(customHtml, /Fixture cuisine/);
      assert.match(customHtml, /\"@type\":\"Restaurant\"/);
      assert.match(customHtml, new RegExp(`<html[^>]+lang="${tenant === "alpha" ? "ar" : "ckb"}"`));
      assert.match(customHtml, /<html[^>]+dir="rtl"/);
      assert.match(customHtml, /content="index, follow"/);
      assert.match((await get(host, "/linktree/hidden-seo")).body.toString(), /content="noindex, follow"/);
      const customImage = await get(host, "/linktree/categorized/share-image");
      assert.equal(customImage.status, 200);
      assert.equal(customImage.body.readUInt32BE(16), 1200);
      assert.equal(customImage.body.readUInt32BE(20), 630);
      await mkdir(new URL("../../.runtime/seo-images/", import.meta.url), { recursive: true });
      await writeFile(new URL(`../../.runtime/seo-images/${tenant}.png`, import.meta.url), customImage.body);
    }
    assert.ok(!tenantImages[0].equals(tenantImages[1]), "tenant images must contain different content");
    assert.equal((await get("unknown.localhost", "/sitemap.xml")).status, 404);
    assert.equal(
      (await get("alpha.evil.test", "/linktree/same-slug")).status,
      404,
    );
    const www = await get("www.localhost", "/linktree/same-slug");
    assert.equal(www.status, 308);
    assert.equal((await get("localhost", "/robots.txt")).status, 200);
    for (const [host, language] of [
      ["alpha.localhost", "en"],
      ["beta.localhost", "ckb"],
      ["localhost", "en"],
    ]) {
      for (const slug of ["contact", "card", "starter"]) {
        const response = await get(host, `/form/${slug}?utm_source=tiktok`);
        assert.equal(response.status, 200);
        const html = response.body.toString();
        assert.match(html, new RegExp(`<html[^>]+lang="${language}"`));
        assert.match(
          html,
          new RegExp(
            `rel="canonical"[^>]+href="http://${host}:${frontendPort}/form/${slug}"`,
          ),
        );
        assert.match(html, /property="og:type" content="website"/);
        assert.match(
          html,
          slug === "starter"
            ? /content="noindex, follow"/
            : /content="index, follow"/,
        );
        assert.match(html, /loading="eager"/);
        assert.match(html, /analytics\.tiktok\.com/);
        const ownerPixel = `FORM_${host.startsWith("alpha.") ? "ALPHA" : host.startsWith("beta.") ? "BETA" : "PLATFORM"}_PIXEL`;
        assert.ok(
          html.includes(ownerPixel),
          "served form HTML must contain its owner Pixel base code",
        );
        for (const pixel of [
          "FORM_ALPHA_PIXEL",
          "FORM_BETA_PIXEL",
          "FORM_PLATFORM_PIXEL",
        ]) {
          if (pixel !== ownerPixel)
            assert.ok(
              !html.includes(pixel),
              "form must never include another owner Pixel",
            );
        }
        assert.doesNotMatch(
          html,
          /name="twitter:card" content="summary_large_image"[^>]*data:/,
        );
      }
      assert.equal((await get(host, "/form/missing")).status, 404);
      assert.match(
        (await get(host, "/sitemap.xml")).body.toString(),
        /\/form\/contact<\/loc>/,
      );
    }
    const platformPage = await get("localhost", "/linktree/same-slug");
    for (const language of ["en", "ckb", "ar"]) {
      const home = await get("localhost", "/", "Googlebot", `sponsor_public_locale=${language}`);
      assert.equal(home.status, 200);
      const homeHtml = home.body.toString();
      assert.match(homeHtml, new RegExp(`<html[^>]+lang="${language}"`));
      assert.match(homeHtml, new RegExp(`property="og:locale" content="${{ en: "en_US", ckb: "ckb_IQ", ar: "ar_IQ" }[language]}"`));
      assert.match(homeHtml, /name="twitter:description"/);
      assert.doesNotMatch(homeHtml, /analytics\.tiktok\.com/);
      for (const path of ["/advertising", "/advertising/video-code"]) {
        const removed = await get("alpha.localhost", path, "Googlebot");
        assert.equal(removed.status, 404);
      }
    }
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
    for (const path of [
      "/",
      "/linktree/same-slug?source=qr",
      "/business/workspace-entry",
      "/api/auth/profile",
    ]) {
      const alias = await get("alpha.localhost", path);
      assert.equal(alias.status, 404);
      assert.equal(alias.headers.location, undefined);
      // Next development replaces page cache headers with mandatory revalidation.
      assert.match(alias.headers["cache-control"], /no-store|no-cache/);
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
      assert.equal(entry.status, path === "/business/settings" ? 404 : 200);
      assert.equal(entry.headers.location, undefined);
      assert.match(entry.headers["cache-control"], /no-store|no-cache/);
    }
    const entryPage = await get(customHost, "/business/workspace-entry");
    assert.equal(entryPage.status, 200);
    assert.match(entryPage.body.toString(), /\/api\/auth\/google\/start/);
    assert.equal((await get(customHost, "/linktree/same-slug")).status, 200);
    assert.equal(
      (await get(customHost, "/api/platform/businesses")).status,
      404,
    );
    customDomainActive = false;
    assert.equal(
      (await get("alpha.localhost", "/linktree/same-slug")).status,
      200,
    );
    assert.equal((await get(customHost, "/linktree/same-slug")).status, 404);
    console.log(
      "SEO HTTP smoke passed: tenant isolation, SEO, selected-host enforcement, custom-domain dashboard entry, removal fallback, and blocked platform/internal APIs.",
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
