// Security gate for CI and local use: `npm run check:advisories`.
// Fails when npm audit reports a critical issue anywhere, or a high issue in a
// production dependency, or when a framework package is below its patched floor.
// The floors exist because Next.js bundles React's server code, so a React
// Server Components advisory never appears as its own installed package.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const FILE = "check-advisories.mjs";

// Raise these when a new Next.js or React advisory names a patched version.
const VERSION_FLOORS = {
  next: "16.4.1", // 14 Oct 2026 advisories
  react: "19.3.1",
  "react-dom": "19.3.1",
};

function compareVersions(a, b) {
  const pa = a.split("-")[0].split(".").map(Number);
  const pb = b.split("-")[0].split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

function installedVersion(name) {
  try {
    const file = path.join(process.cwd(), "node_modules", name, "package.json");
    return JSON.parse(readFileSync(file, "utf8")).version;
  } catch (error) {
    console.error(`[${FILE}:installedVersion] Cannot read ${name}:`, error.message);
    return null;
  }
}

function checkFloors() {
  const problems = [];
  for (const [name, floor] of Object.entries(VERSION_FLOORS)) {
    const version = installedVersion(name);
    if (!version) problems.push(`${name} is not installed (need >= ${floor}).`);
    else if (compareVersions(version, floor) < 0) {
      problems.push(`${name} ${version} is below the patched floor ${floor}.`);
    }
  }
  return problems;
}

function runAudit(extraArgs) {
  // Fixed arguments only; nothing from user input reaches this command.
  const command = ["npm", "audit", "--json", ...extraArgs].join(" ");
  try {
    const out = execSync(command, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(out);
  } catch (error) {
    // npm audit exits non-zero when it finds issues; its JSON is still on stdout.
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (parseError) {
        console.error(`[${FILE}:runAudit] Unreadable audit output:`, parseError.message);
      }
    }
    throw new Error(`npm audit failed to run: ${error.message}`);
  }
}

function findings(report, severities) {
  return Object.entries(report.vulnerabilities || {})
    .filter(([, v]) => severities.includes(v.severity))
    .map(([name, v]) => {
      const titles = v.via.filter((x) => typeof x === "object").map((x) => `${x.title} (${x.url})`);
      return `${v.severity.toUpperCase()} ${name}${titles.length ? `: ${titles.join("; ")}` : ""}`;
    });
}

function main() {
  const problems = checkFloors();
  try {
    problems.push(...findings(runAudit([]), ["critical"]));
    problems.push(...findings(runAudit(["--omit=dev"]), ["high"]));
  } catch (error) {
    // Fail closed: an audit that cannot run must not pass the gate.
    console.error(`[${FILE}:main]`, error.message);
    process.exit(1);
  }
  const unique = [...new Set(problems)];
  if (unique.length) {
    console.error(`[${FILE}:main] Security gate failed:`);
    unique.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log(`[${FILE}] OK: no critical or production high advisories; framework floors met.`);
}

main();
