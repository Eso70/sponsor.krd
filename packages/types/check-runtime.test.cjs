"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, copyFileSync, realpathSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve, sep } = require("node:path");
const { spawnSync } = require("node:child_process");
const { unavailableRuntimeModules } = require("./check-runtime.cjs");

test("the installed workspace loads every shared phone module", () => {
  assert.deepEqual(unavailableRuntimeModules(), []);
  const result = spawnSync(
    process.execPath,
    [join(__dirname, "check-runtime.cjs")],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("a missing workspace install fails early with the repair command", () => {
  const parent = realpathSync(tmpdir());
  const fixture = mkdtempSync(join(parent, "sponsor-dependencies-"));
  try {
    for (const file of ["package.json", "check-runtime.cjs"])
      copyFileSync(join(__dirname, file), join(fixture, file));
    assert.deepEqual(unavailableRuntimeModules(join(fixture, "package.json")), [
      "libphonenumber-js/max",
      "libphonenumber-js/core",
      "libphonenumber-js/max/metadata",
    ]);
    const result = spawnSync(
      process.execPath,
      [join(fixture, "check-runtime.cjs")],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /pnpm install --frozen-lockfile/);
    assert.match(result.stderr, /libphonenumber-js\/max\/metadata/);
  } finally {
    assert.ok(resolve(fixture).startsWith(parent + sep));
    rmSync(fixture, { recursive: true, force: true });
  }
});
