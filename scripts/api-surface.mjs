#!/usr/bin/env node
/**
 * Generates a snapshot of this package's PUBLIC API surface.
 *
 * Why this exists
 * ---------------
 * Nothing else in CI can detect a breaking API change. `tsc` checks src against
 * src, Jest checks our code against our own tests, and publint checks packaging
 * mechanics — none of them holds a copy of the previously published version, and
 * compatibility is a property of a *pair* of versions.
 *
 * The consequence was real: 1.5.0 -> 1.6.0 removed four methods from the two
 * exported port interfaces and shipped as a MINOR release. Every gate was green.
 *
 * How it works
 * ------------
 * For every subpath in package.json `exports`, resolve its `types` entry, walk
 * the exported symbols, and print each declaration. The result is committed to
 * etc/api-surface.md. CI regenerates it and fails if it differs, so any change
 * to the public surface shows up as a reviewable diff and has to be acknowledged
 * on purpose.
 *
 * Usage:
 *   node scripts/api-surface.mjs           # write etc/api-surface.md
 *   node scripts/api-surface.mjs --check   # exit 1 if the committed file is stale
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, "etc", "api-surface.md");
const CHECK = process.argv.includes("--check");

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

/** Subpaths that expose types, in a stable order. */
const entries = Object.entries(pkg.exports)
  .filter(([, v]) => v && typeof v === "object" && v.types)
  .map(([subpath, v]) => ({ subpath, types: path.join(ROOT, v.types) }))
  .sort((a, b) => a.subpath.localeCompare(b.subpath));

const missing = entries.filter((e) => !fs.existsSync(e.types));
if (missing.length) {
  console.error("Declarations not found — run `npm run build` first:");
  for (const m of missing) console.error("  " + path.relative(ROOT, m.types));
  process.exit(1);
}

const program = ts.createProgram(
  entries.map((e) => e.types),
  {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  },
);
const checker = program.getTypeChecker();

/** Collapse insignificant whitespace so formatting churn is not a diff. */
function normalize(text) {
  return text
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();
}

/** Strip declaration-only noise that consumers never see. */
function clean(text) {
  return normalize(
    text
      .replace(/^\s*\/\/#\s*sourceMappingURL=.*$/gm, "")
      .replace(/^\s*declare\s+/, ""),
  );
}

function renderSymbol(symbol) {
  const target =
    symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const decl = target.declarations?.[0];
  if (!decl) return `// ${symbol.getName()}: <no declaration>`;

  // For a class/interface/type-alias the declaration text IS the contract.
  const text = decl.getText(decl.getSourceFile());
  return clean(text);
}

const sections = [];
for (const { subpath, types } of entries) {
  const source = program.getSourceFile(types);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  const exported = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];

  const rendered = exported
    .map((s) => ({ name: s.getName(), body: renderSymbol(s) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const specifier = `${pkg.name}${subpath.replace(/^\./, "")}`;
  sections.push(
    `## \`${specifier}\`\n\n` +
      (rendered.length === 0
        ? "_No exported symbols._\n"
        : "```ts\n" + rendered.map((r) => r.body).join("\n\n") + "\n```\n"),
  );
}

const report =
  `# Public API surface\n\n` +
  `<!-- GENERATED FILE — do not edit by hand.\n` +
  `     Regenerate with: npm run api:report\n` +
  `     CI fails if this file does not match the built declarations. A diff here\n` +
  `     means the public API changed: make sure the release is versioned to match. -->\n\n` +
  `Package: \`${pkg.name}\`\n\n` +
  `Only the subpaths below are public API. Everything else in \`dist\` is an\n` +
  `internal implementation detail and is not covered by semantic versioning.\n\n` +
  sections.join("\n");

if (CHECK) {
  const current = fs.existsSync(REPORT) ? fs.readFileSync(REPORT, "utf8") : "";
  if (normalize(current) !== normalize(report)) {
    console.error("✖ Public API surface has changed.\n");
    console.error("  etc/api-surface.md is out of date with the built declarations.\n");
    console.error("  1. Run `npm run api:report` and commit the result.");
    console.error("  2. Review the diff: if symbols were REMOVED or signatures");
    console.error("     changed, this is a BREAKING change — the commit must be");
    console.error("     `feat!:` (or carry a `BREAKING CHANGE:` footer) so the");
    console.error("     release is versioned as a major.\n");
    process.exit(1);
  }
  console.log("✔ Public API surface matches etc/api-surface.md");
} else {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, report);
  console.log(`Wrote ${path.relative(ROOT, REPORT)}`);
}
