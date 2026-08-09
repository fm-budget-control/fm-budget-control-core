#!/usr/bin/env node
/**
 * Verifies the package AS A CONSUMER RECEIVES IT.
 *
 * Every other check runs against `src` or the repo working tree. This one packs
 * the tarball, installs it into a throwaway project, and then imports it — which
 * is the only way to catch problems that live in the gap between "the code is
 * fine" and "the published thing works":
 *
 *   - an entry point that does not resolve (export map wrong, file not shipped)
 *   - a subpath that resolves but should not (accidental deep-import surface)
 *   - declarations that do not resolve for a consumer's moduleResolution
 *   - a runtime file missing from `files`
 *
 * The "must resolve" list is derived from package.json `exports`, so adding a
 * subpath is automatically covered. The "must NOT resolve" list is explicit:
 * these are the boundaries we promise to keep closed.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

const MUST_RESOLVE = Object.keys(pkg.exports)
  // `./package.json` is metadata, not an entry point. Wildcards are not a
  // concrete specifier we can import — and a wildcard appearing here at all is
  // itself a problem, caught by the MUST_NOT_RESOLVE list below.
  .filter((s) => s !== "./package.json" && !s.includes("*"))
  .map((s) => `${pkg.name}${s.replace(/^\./, "")}`);

const MUST_NOT_RESOLVE = [
  pkg.name, // no root export by design
  `${pkg.name}/kernel/domain`,
  `${pkg.name}/kernel/domain/value-objects`,
  `${pkg.name}/user/domain`,
  `${pkg.name}/dist/kernel/domain/value-objects/index.js`,
  `${pkg.name}/dist/user/application/use-cases/index.js`,
];

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
let failures = 0;
const fail = (m) => { console.error(`  ✖ ${m}`); failures++; };
const pass = (m) => console.log(`  ✔ ${m}`);

try {
  console.log("Packing…");
  const packDir = path.join(tmp, "pack");
  fs.mkdirSync(packDir);
  const tarball = path
    .join(packDir, run("npm", ["pack", "--pack-destination", packDir, "--silent"], ROOT).trim()
      .split("\n").pop().trim());

  console.log("Installing into a clean consumer…");
  const consumer = path.join(tmp, "consumer");
  fs.mkdirSync(consumer);
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify({ name: "artifact-verify", version: "1.0.0", type: "module", private: true }),
  );
  run("npm", ["install", tarball, "--no-audit", "--no-fund", "--silent"], consumer);

  // ---- runtime resolution -------------------------------------------------
  console.log("\nEntry points that MUST resolve:");
  const probe = `
    const must = ${JSON.stringify(MUST_RESOLVE)};
    const mustNot = ${JSON.stringify(MUST_NOT_RESOLVE)};
    const out = { ok: [], badResolve: [], badRefuse: [] };
    for (const s of must) {
      try { const m = await import(s); out.ok.push([s, Object.keys(m).filter(k => k !== "default").sort()]); }
      catch (e) { out.badResolve.push([s, e.code || e.message]); }
    }
    for (const s of mustNot) {
      try { await import(s); out.badRefuse.push(s); } catch { /* expected */ }
    }
    console.log(JSON.stringify(out));
  `;
  fs.writeFileSync(path.join(consumer, "probe.mjs"), probe);
  const result = JSON.parse(run("node", ["probe.mjs"], consumer).trim());

  for (const [s, names] of result.ok) pass(`${s}  →  ${names.join(", ") || "(types only)"}`);
  for (const [s, code] of result.badResolve) fail(`${s} did not resolve (${code})`);

  console.log("\nSpecifiers that MUST NOT resolve:");
  if (result.badRefuse.length === 0) pass(`all ${MUST_NOT_RESOLVE.length} correctly refused`);
  for (const s of result.badRefuse) fail(`${s} resolved but should be private`);

  // ---- type resolution ----------------------------------------------------
  console.log("\nDeclarations resolve for a consumer:");
  // A bare `import type` is enough: if the declarations do not resolve for this
  // moduleResolution, tsc reports TS2307 and the check fails. Nothing needs to
  // *use* the imports.
  const imports = MUST_RESOLVE.map((s, i) => `import type * as M${i} from "${s}";`).join("\n");
  fs.writeFileSync(path.join(consumer, "main.ts"), `${imports}\nexport {};\n`);
  for (const mr of ["nodenext", "bundler"]) {
    fs.writeFileSync(
      path.join(consumer, `tsconfig.${mr}.json`),
      JSON.stringify({
        compilerOptions: {
          strict: true, noEmit: true, target: "ES2022",
          module: mr === "nodenext" ? "NodeNext" : "ESNext",
          moduleResolution: mr, skipLibCheck: true,
        },
        files: ["main.ts"],
      }),
    );
    try {
      run(process.execPath, [path.join(ROOT, "node_modules/typescript/bin/tsc"), "-p", `tsconfig.${mr}.json`], consumer);
      pass(`moduleResolution: ${mr}`);
    } catch (e) {
      fail(`moduleResolution: ${mr}\n${(e.stdout || e.message).toString().trim()}`);
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log();
if (failures) {
  console.error(`✖ Artifact verification failed (${failures} problem${failures > 1 ? "s" : ""}).`);
  process.exit(1);
}
console.log("✔ Packed artifact behaves correctly for consumers.");
