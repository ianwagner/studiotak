import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceDir = join(projectRoot, "src");

const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const ignoreDirectories = new Set(["node_modules", ".next", "out", "build", "dist", "scripts"]);

const checks = [
  {
    regex: /usePathname\s*\(/,
    reason: "Avoid route-based branching: usePathname is disallowed.",
  },
  {
    regex: /useRouter\s*\(/,
    reason: "Avoid route-based branching: useRouter is disallowed.",
  },
  {
    regex: /useSelectedLayoutSegments\s*\(/,
    reason: "Avoid route-based branching: useSelectedLayoutSegments is disallowed.",
  },
  {
    regex: /router\.(pathname|query)/,
    reason: "Avoid route-based branching: router pathname/query access detected.",
  },
  {
    regex: /(className|style|variant)[^\n]*\b(?:params|pathname|segment)s?\b/,
    reason: "Route parameters used inside styling props (className/style/variant).",
  },
];

async function gatherFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (ignoreDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await gatherFiles(fullPath)));
      continue;
    }

    if (!allowedExtensions.has(extname(entry.name))) {
      continue;
    }

    results.push(fullPath);
  }

  return results;
}

async function checkFile(filePath) {
  const content = await readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const localFindings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    for (const { regex, reason } of checks) {
      if (regex.test(line)) {
        localFindings.push({
          line: index + 1,
          reason,
          sample: line.trim(),
        });
      }
    }
  }

  return localFindings;
}

async function run() {
  try {
    await stat(sourceDir);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      process.exit(0);
    }

    throw error;
  }

  let hasFindings = false;
  const files = await gatherFiles(sourceDir);
  const report = [];

  for (const file of files) {
    const findings = await checkFile(file);

    if (findings.length === 0) {
      continue;
    }

    hasFindings = true;
    report.push({
      file: relative(projectRoot, file),
      findings,
    });
  }

  if (!hasFindings) {
    process.exit(0);
  }

  const lines = [
    "Route governance check failed — route-based styling or branching detected:",
  ];

  for (const { file, findings } of report) {
    for (const finding of findings) {
      lines.push(
        `  ${file}:${finding.line} → ${finding.reason} (\"${finding.sample}\")`,
      );
    }
  }

  console.error(lines.join("\n"));
  process.exit(1);
}

run().catch((error) => {
  console.error("Route governance check failed to run:", error);
  process.exit(1);
});
