"use strict";
const { createRequire } = require("node:module");
const RUNTIME_MODULES = [
  "libphonenumber-js/max",
  "libphonenumber-js/core",
  "libphonenumber-js/max/metadata",
];

/** Resolve from the owning workspace, never a globally installed dependency. */
function unavailableRuntimeModules(from = __filename) {
  const load = createRequire(from);
  return RUNTIME_MODULES.filter((specifier) => {
    try {
      load(specifier);
      return false;
    } catch {
      return true;
    }
  });
}

if (require.main === module) {
  const unavailable = unavailableRuntimeModules();
  if (unavailable.length) {
    console.error(
      `Shared workspace dependencies are missing or cannot load:\n${unavailable.map((name) => `  - ${name}`).join("\n")}\n\nFrom the repository root, run:\n  pnpm install --frozen-lockfile\nThen retry the build.`,
    );
    process.exitCode = 1;
  } else {
    console.log("Shared runtime dependencies verified.");
  }
}
module.exports = { unavailableRuntimeModules };
