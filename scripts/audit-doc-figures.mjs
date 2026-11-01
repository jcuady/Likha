#!/usr/bin/env node
/**
 * Do the numbers in the audit documents still match the code?
 *
 * THE DEFECT THIS GUARDS
 * ----------------------
 * This project shipped a **row census that was never right**. The document said
 *
 *   "**Row census** (counted from the tables, not estimated): 138 status rows ->
 *    128 `DONE`, 3 `DEFERRED`, 7 `N/A`, 0 `BLOCKED`."
 *
 * The word "counted" was the lie. That sentence had been produced by counting every
 * table row carrying an ID — which includes the RBAC capability matrix, a table whose
 * third column is a role set (`public`, `admin`, `investor,admin`, `all`, `app+admin`)
 * rather than a status. Those rows were counted as status rows.
 *
 * The damage is not the wrong number. It is that the sentence claimed to be **counted
 * from the tables** and was not, in a document whose whole purpose is to be the counted
 * record.
 *
 * The same class reached the audit's own documentation: a commit stamp that was not a
 * commit on this branch, a test count stated three ways, and a defect total quoted
 * without saying which defects it was counting.
 *
 * THIS COMMENT DELIBERATELY QUOTES NO CENSUS
 * ------------------------------------------
 * An earlier version of this file carried its own copy of the row census, and it was
 * wrong the moment the matrix moved: it quoted the output of a counter that dropped
 * every row whose ID prefix contains digits (`A11Y-01`), and presented that counter's
 * output as a fact about the matrix. **A number typed in a comment is a second copy of
 * the very thing this gate exists to protect, and it drifts silently.** The census has
 * one home: derived on every run, printed here, and written to
 * `docs/evidence/doc-figures.json`. Do not type it here.
 *
 * WHAT IT CHECKS
 * --------------
 *   1. The **row census** in `docs/FINISH_STATUS.md`, derived twice by two independent
 *      methods from the matrix's own status cells. This is the check that would have
 *      caught the 138.
 *   2. The **test count** in every document that quotes one, against a real
 *      `vitest run`.
 *   3. The **commit stamp** in `docs/FINISH_STATUS.md`, against this repository's own
 *      history.
 *   4. The **defect counts** — the register's rows, the rows per narrative section, the
 *      severity tally, and the changelog's severity-tagged tally — each counted from
 *      the source that owns it and checked against the document that quotes it.
 *
 * WHAT COUNTS AS A HISTORICAL CLAIM
 * ---------------------------------
 * A figure is allowed to differ when it is explicitly marked as the *old* value —
 * "was 138 rows", "previously 81 tests", "SUPERSEDED: 42". A figure that merely
 * carries a date is **not** historical: "(re-measured 2026-10-26)" says *when* the
 * current value was measured, and the current value still has to be right.
 *
 * This is the same distinction the BeepoBeepa copy of this gate had to learn the hard
 * way, and the reason this one says it out loud.
 *
 * USAGE
 * -----
 *   node scripts/audit-doc-figures.mjs                check the repository
 *   node scripts/audit-doc-figures.mjs --self-test    prove the gate can fail
 *
 * The self-test plants the old census in a temporary copy of the status document and
 * requires the gate to go red on it. It never touches the repository's own files. A
 * gate that has never been observed to fail is an assumption, not a check.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SELF_TEST_PATH = fileURLToPath(import.meta.url);

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const SELF_TEST = argv.includes("--self-test");
const DOC = opt("--doc") ?? "docs/FINISH_STATUS.md";
const EVIDENCE = opt("--evidence") ?? "docs/evidence/doc-figures.json";
const AUDIT = "docs/SYSTEM_AUDIT.md";
const REGISTER = "docs/AUDIT_FINDINGS.md";
const CHANGELOG = "docs/CHANGELOG.md";
const PLAN = "docs/FIX_PLAN.md";

/** A figure explicitly marked as the previous value is allowed to differ. */
const HISTORICAL = /\bwas\b|\bpreviously\b|\bused to\b|\bSUPERSEDED\b|\bformer(?:ly)?\b/i;

const checks = [];
const problems = [];
function check(label, ok, detail = "") {
  checks.push({ label, ok, detail });
  if (!ok) problems.push(`${label}${detail ? ` — ${detail}` : ""}`);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? `\n        ${detail}` : ""}`);
}

function writeEvidence(exitCode, verdict, verdictText, data = {}) {
  mkdirSync("docs/evidence", { recursive: true });
  writeFileSync(
    EVIDENCE,
    JSON.stringify(
      { check: "doc-figures", generatedAt: new Date().toISOString(), verdict, verdictText, ...data, exitCode },
      null,
      2,
    ) + "\n",
  );
  console.log(`wrote ${EVIDENCE}`);
}

if (!existsSync(DOC)) {
  writeEvidence(2, "unknown", `${DOC} not found; nothing was verified`);
  console.error(`${DOC} not found — the gate had no chance to fire`);
  process.exit(2);
}

const doc = readFileSync(DOC, "utf8");
const lines = doc.split(/\r?\n/);

// ---------------------------------------------------------------------------
// 0. Self-test: the gate has to be able to fail.
// ---------------------------------------------------------------------------
/**
 * A check that has never been observed to fail is an assumption. This plants the OLD
 * census — the figure that shipped — into a temporary copy of the status document and
 * requires the gate to go red on it, naming the mismatch.
 *
 * The repository's own files are never touched: the copy lives in the temp directory,
 * and the evidence file is written beside it.
 */
if (SELF_TEST) {
  const tmpDoc = join(tmpdir(), "likha-doc-figures-selftest.md");
  const tmpEvidence = join(tmpdir(), "likha-doc-figures-selftest.json");
  const PLANT_RE =
    /(\d+) status rows(\s*[^\n]*\r?\n\s*)(\d+) `DONE`,\s*(\d+) `DEFERRED`,\s*(\d+) `N\/A`,\s*(\d+) `BLOCKED`/;
  const planted = doc.replace(
    PLANT_RE,
    (_m, _t, mid) => `138 status rows${mid}128 \`DONE\`, 3 \`DEFERRED\`, 7 \`N/A\`, 0 \`BLOCKED\``,
  );

  if (planted === doc) {
    console.error("SELF-TEST FAILED: the old census could not be planted — the pattern no longer matches the document.");
    process.exit(1);
  }

  writeFileSync(tmpDoc, planted);
  const run = spawnSync(
    process.execPath,
    [SELF_TEST_PATH, "--doc", tmpDoc, "--evidence", tmpEvidence],
    { encoding: "utf8", shell: false },
  );
  const output = `${run.stdout || ""}${run.stderr || ""}`;

  const caughtTheCensus = /FAIL\s+the quoted row census equals the census counted from the matrix/.test(output);
  const namedTheMismatch = /total 138 != \d+/.test(output);
  const exitedRed = run.status === 1;

  rmSync(tmpDoc, { force: true });
  rmSync(tmpEvidence, { force: true });

  console.log("");
  if (caughtTheCensus && namedTheMismatch && exitedRed) {
    console.log(`✔ self-test: the gate went red on the planted census (exit ${run.status}) and named the mismatch`);
    console.log("  the gate can fail — a green run above it means something");
    process.exit(0);
  }
  console.error(`✖ self-test: the gate did NOT fail on the planted census (exit ${run.status})`);
  console.error(`  caught the census check : ${caughtTheCensus}`);
  console.error(`  named the mismatch      : ${namedTheMismatch}`);
  console.error(output.slice(-1500));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Derive the census from the matrix's own status cells.
// ---------------------------------------------------------------------------
/**
 * A coverage row is a table line whose FIRST cell is an ID and whose THIRD cell is a
 * terminal status. The RBAC capability rows have a role set in that position and are
 * deliberately not counted — which is the distinction the 138 got wrong.
 *
 * TWO PATTERN TRAPS, BOTH OF WHICH HAVE BITTEN THIS REPOSITORY
 * -----------------------------------------------------------
 *  1. The ID prefix may contain DIGITS — `A11Y-01` is a real coverage row. A pattern of
 *     `[A-Z]+-\d+` silently drops all of them, and the census comes out short with no
 *     error at all. That is not hypothetical: it is exactly what happened here, and
 *     the count it produced was quoted as fact before this gate existed.
 *  2. The status may be BOLDED — `**FAIL**`. A pattern that only matches a bare status
 *     drops every bolded row the same way.
 *
 * WHICH IS WHY THE CENSUS IS DERIVED TWICE
 * ---------------------------------------
 * The first derivation uses the ID+status pattern. The second counts TABLE ROWS by
 * shape — every line in a matrix table that is neither the header nor a separator —
 * with no pattern for what an ID looks like at all. If the ID pattern is wrong, the two
 * derivations disagree and the gate fails.
 *
 * This matters because a gate that derives its expectation from the same document it
 * checks can only ever find INCONSISTENCY, never ERROR. When the document and the gate
 * share a flawed counter they agree on a wrong number, and the gate is green. Two
 * independent derivations is the difference between "they agree" and "they are right".
 */
const CENSUS_BY_ID = { total: 0, DONE: 0, DEFERRED: 0, "N/A": 0, BLOCKED: 0, PARTIAL: 0, FAIL: 0, "NOT VERIFIED": 0 };
const idsSeen = [];
const rangeRows = [];
for (const line of lines) {
  // The ID may contain digits in the prefix (`A11Y-01`) and may be a RANGE
  // (`API-01..11`, `DB-01..11`) — a range row stands for several requirements.
  const m = line.match(/^\|\s*([A-Za-z0-9]+-\d+(?:\.\.\d+)?[a-z]?)\s*\|([^|]*)\|\s*\**\s*(DONE|DEFERRED|N\/A|BLOCKED|PARTIAL|FAIL|NOT VERIFIED)\s*\**\s*\|/);
  if (!m) continue;
  CENSUS_BY_ID.total += 1;
  idsSeen.push(m[1]);
  CENSUS_BY_ID[m[3]] = (CENSUS_BY_ID[m[3]] ?? 0) + 1;
  const range = m[1].match(/^([A-Za-z0-9]+)-(\d+)\.\.(\d+)$/);
  if (range) rangeRows.push({ id: m[1], prefix: range[1], from: Number(range[2]), to: Number(range[3]) });
}

/**
 * How many INDIVIDUAL requirements the matrix actually covers. A range row such as
 * `API-01..11` is one table line but eleven requirements, and a reader who counts
 * table lines and a reader who counts requirements get different numbers — which is
 * exactly how this document ended up claiming three different totals.
 */
const requirements =
  CENSUS_BY_ID.total - rangeRows.length + rangeRows.reduce((n, r) => n + (r.to - r.from + 1), 0);

/**
 * Second derivation: count matrix table rows by SHAPE. A matrix table's data rows all
 * have the same number of cells as its header, and are neither the header nor a
 * separator. No assumption is made about what an ID looks like.
 */
const matrixStart = lines.findIndex((l) => /^##\s+/i.test(l) && /matrix|coverage/i.test(l));
let censusByShape = 0;
if (matrixStart >= 0) {
  // The matrix tables are "| ID | Item | Status | Evidence |" — 5 cells, 4 pipes.
  const dataRows = lines.filter((l) => {
    if (!l.trim().startsWith("|")) return false;
    if (/^\|\s*-{2,}/.test(l.trim())) return false;          // separator
    if (/^\|\s*ID\s*\|/i.test(l.trim())) return false;         // header
    const cells = l.split("|").length - 2;                     // content cells
    return cells === 4;
  });
  censusByShape = dataRows.length;
}

const census = CENSUS_BY_ID;
console.log(
  `  derived by ID+status : ${census.total} rows -> ` +
    `DONE ${census.DONE}, DEFERRED ${census.DEFERRED}, N/A ${census["N/A"]}, BLOCKED ${census.BLOCKED}` +
    (census.PARTIAL ? `, PARTIAL ${census.PARTIAL}` : "") +
    (census.FAIL ? `, FAIL ${census.FAIL}` : "") +
    (census["NOT VERIFIED"] ? `, NOT VERIFIED ${census["NOT VERIFIED"]}` : ""),
);
console.log(`  derived by table shape: ${censusByShape} rows`);
console.log(
  `  range summaries        : ${rangeRows.length}` +
    (rangeRows.length ? ` (${rangeRows.map((r) => r.id).join(", ")})` : "") +
    `  =>  ${requirements} individual requirements`,
);

check(
  "the two independent derivations of the row count agree",
  census.total === censusByShape,
  `ID+status says ${census.total}, table shape says ${censusByShape} — a pattern is dropping rows`,
);

const dupIds = idsSeen.filter((id, i) => idsSeen.indexOf(id) !== i);
check(
  "every coverage row has a unique ID",
  dupIds.length === 0,
  `duplicate IDs: ${[...new Set(dupIds)].join(", ")}`,
);

// ---------------------------------------------------------------------------
// 2. The census sentence must agree with it.
// ---------------------------------------------------------------------------
const CENSUS_RE =
  /(\d+)\s+status rows\s*[^\n]*\r?\n\s*(\d+)\s*`DONE`,\s*(\d+)\s*`DEFERRED`,\s*(\d+)\s*`N\/A`,\s*(\d+)\s*`BLOCKED`/;
const censusMatch = doc.match(CENSUS_RE);

check(
  "the status document quotes a row census",
  censusMatch !== null,
  "no '<n> status rows' + DONE/DEFERRED/N-A/BLOCKED sentence found",
);
if (censusMatch) {
  const quoted = {
    total: Number(censusMatch[1]),
    DONE: Number(censusMatch[2]),
    DEFERRED: Number(censusMatch[3]),
    "N/A": Number(censusMatch[4]),
    BLOCKED: Number(censusMatch[5]),
  };
  const mismatches = [];
  if (quoted.total !== census.total) mismatches.push(`total ${quoted.total} != ${census.total}`);
  if (quoted.DONE !== census.DONE) mismatches.push(`DONE ${quoted.DONE} != ${census.DONE}`);
  if (quoted.DEFERRED !== census.DEFERRED) mismatches.push(`DEFERRED ${quoted.DEFERRED} != ${census.DEFERRED}`);
  if (quoted["N/A"] !== census["N/A"]) mismatches.push(`N/A ${quoted["N/A"]} != ${census["N/A"]}`);
  if (quoted.BLOCKED !== census.BLOCKED) mismatches.push(`BLOCKED ${quoted.BLOCKED} != ${census.BLOCKED}`);
  check(
    "the quoted row census equals the census counted from the matrix",
    mismatches.length === 0,
    mismatches.join("; "),
  );
}

// ---------------------------------------------------------------------------
// 3. The test count, from a real run.
// ---------------------------------------------------------------------------
console.log("running vitest to derive the test count...");
const vr = spawnSync("npx", ["vitest", "run"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  shell: true,
});
/** A spawned process on Windows can still be handed a colour-capable handle. */
const stripAnsi = (s) => s.replace(/\[[0-9;]*m/g, "");
const vitestOut = stripAnsi(`${vr.stdout || ""}${vr.stderr || ""}`);
const fileMatch = /Test Files\s+(\d+) passed \((\d+)\)/.exec(vitestOut);
const testMatch = /Tests\s+(\d+) passed \((\d+)\)/.exec(vitestOut);

if (!fileMatch || !testMatch) {
  writeEvidence(2, "unknown", "vitest did not report a parseable summary; nothing was verified", {
    vitestExitCode: vr.status,
    vitestOutputTail: vitestOut.slice(-1200),
  });
  console.error("could not parse the vitest summary — the gate had no chance to fire");
  console.error(vitestOut.slice(-600));
  process.exit(2);
}
const measuredFiles = Number(fileMatch[1]);
const measuredTests = Number(testMatch[1]);
console.log(`  measured: ${measuredTests} tests across ${measuredFiles} files\n`);

/**
 * The shapes a test count takes in these documents. Ordered, and the first shape that
 * matches a line wins — a line like "99 tests across 8 files" must be read once, not
 * once per pattern.
 */
const TEST_SHAPES = [
  { re: /(\d+)\s+files,\s*(\d+)\s+(?:tests|passed)\b/, tests: 2, files: 1 },
  { re: /(\d+)\s+tests\s+across\s+(\d+)\s+files\b/, tests: 1, files: 2 },
  { re: /(\d+)\s+across\s+(\d+)\s+files\b/, tests: 1, files: 2 },
  { re: /(\d+)\s+tests\b/, tests: 1, files: null },
];

/** Documents that quote a test count. Each one is checked against the same measurement. */
const TEST_DOCS = [
  { path: DOC, label: "the status document" },
  { path: AUDIT, label: "the narrative audit" },
  { path: REGISTER, label: "the defect register" },
  { path: PLAN, label: "the fix plan" },
];

const quotedTestCounts = [];
for (const { path, label } of TEST_DOCS) {
  if (!existsSync(path)) {
    check(`the ${label} exists`, false, `${path} not found`);
    continue;
  }
  const docLines = readFileSync(path, "utf8").split(/\r?\n/);
  const claims = [];
  for (const line of docLines) {
    if (HISTORICAL.test(line)) continue;
    for (const shape of TEST_SHAPES) {
      const m = shape.re.exec(line);
      if (!m) continue;
      claims.push({
        doc: path,
        tests: Number(m[shape.tests]),
        files: shape.files ? Number(m[shape.files]) : undefined,
        line: line.trim().slice(0, 160),
      });
      break;
    }
  }
  quotedTestCounts.push(...claims);

  const bad = claims.filter(
    (c) => c.tests !== measuredTests || (c.files !== undefined && c.files !== measuredFiles),
  );
  check(
    `every test count quoted in ${path} equals the measured ${measuredTests}`,
    bad.length === 0,
    bad.map((c) => `"${c.tests}"${c.files ? ` (${c.files} files)` : ""} in: ${c.line}`).join(" | "),
  );
  check(
    `${label} quotes a test count at all`,
    claims.length > 0,
    "no test count found — the check would have had nothing to compare",
  );
}

// ---------------------------------------------------------------------------
// 4. The expanded requirement count, when the document states one.
// ---------------------------------------------------------------------------
const REQ_RE = /(\d+)\s+individual requirements/;
const reqClaim = doc.match(REQ_RE);
if (reqClaim) {
  check(
    `the quoted individual-requirement count equals the derived ${requirements}`,
    Number(reqClaim[1]) === requirements,
    `${reqClaim[1]} != ${requirements}`,
  );
}

// ---------------------------------------------------------------------------
// 5. The commit stamp, against this repository's own history.
// ---------------------------------------------------------------------------
/**
 * The stamp is checked against history, not against `HEAD` itself. The gate's own
 * commit moves `HEAD`, so a check that demands the stamp equal `HEAD` is a check the
 * gate invalidates by running it. What must hold is that the stamped commit is a real
 * commit on this branch's history — otherwise the document points at a tree that never
 * existed here, which is the defect this closes. The document labels the stamp as the
 * code that was measured, so the line stays true as the branch moves on.
 */
const STAMP_RE = /\*\*Branch \/ code verified:\*\*\s*`main` at\s*`([0-9a-f]{7,40})`/;
const stampMatch = doc.match(STAMP_RE);
check(
  "the status document names the commit it verified",
  stampMatch !== null,
  "no '**Branch / code verified:** `main` at `<sha>`' line found",
);
if (stampMatch) {
  const sha = stampMatch[1];
  const type = spawnSync("git", ["cat-file", "-t", sha], { encoding: "utf8", shell: true });
  const exists = type.status === 0 && type.stdout.trim() === "commit";
  check(
    `the stamped commit ${sha} exists in this repository`,
    exists,
    exists ? "" : `git cat-file -t ${sha} did not report a commit`,
  );
  const anc = spawnSync("git", ["merge-base", "--is-ancestor", sha, "HEAD"], { encoding: "utf8", shell: true });
  const ancestor = anc.status === 0;
  check(
    `the stamped commit ${sha} is on this branch's history`,
    ancestor,
    `git merge-base --is-ancestor ${sha} HEAD exited ${anc.status}`,
  );
}

// ---------------------------------------------------------------------------
// 6. The defect counts, each derived from the source that owns it.
// ---------------------------------------------------------------------------
/**
 * Two different tallies of the same audit live in this repository, and they count
 * different things:
 *
 *   - the **register** (`docs/AUDIT_FINDINGS.md`) indexes the defect rows of the
 *     narrative audit's tables, each row tagged with the section it came from;
 *   - the **changelog** (`docs/CHANGELOG.md`) records the audit-closure run's
 *     severity-tagged entries, one entry per defect.
 *
 * Both documents quote a number. The gate derives each from its own source and checks
 * that the document quoting it agrees — which is what stops one number from being
 * quoted while calling it the other. That confusion was finding #30.
 */
const normSection = (s) => s.trim().toLowerCase().replace(/\s+issues$/, "");

if (!existsSync(REGISTER)) {
  check("the defect register exists", false, `${REGISTER} not found`);
} else {
  const registerLines = readFileSync(REGISTER, "utf8").split(/\r?\n/);
  const registerRows = [];
  for (const line of registerLines) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*\**(P\d)\**\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    registerRows.push({ n: Number(m[1]), sev: m[2], section: normSection(m[3]), area: m[4].trim() });
  }

  const bySection = new Map();
  const bySeverity = new Map();
  for (const r of registerRows) {
    bySection.set(r.section, (bySection.get(r.section) ?? 0) + 1);
    bySeverity.set(r.sev, (bySeverity.get(r.sev) ?? 0) + 1);
  }
  const registerTotal = registerRows.length;

  check(
    "the defect register has rows to count",
    registerTotal > 0,
    "no numbered register rows found — the checks below would have had nothing to compare",
  );

  // The register's own scope table: rows per narrative section, with severities.
  const scopeRows = new Map();
  for (const line of registerLines) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*\**(\d+)\**\s*\|\s*([^|]*?)\s*\|\s*$/);
    if (!m) continue;
    const name = normSection(m[1]);
    if (name === "total rows" || name === "total") continue;
    const sevs = {};
    for (const sm of m[3].matchAll(/(\d+)\s*[×x]\s*(P\d)/g)) sevs[sm[2]] = Number(sm[1]);
    scopeRows.set(name, { rows: Number(m[2]), sevs });
  }

  const scopeProblems = [];
  for (const [section, count] of bySection) {
    const claimed = scopeRows.get(section);
    if (!claimed) {
      scopeProblems.push(`no scope-table row for ${section}`);
      continue;
    }
    if (claimed.rows !== count) scopeProblems.push(`${section}: scope table says ${claimed.rows}, register has ${count}`);
    for (const sev of ["P0", "P1", "P2", "P3"]) {
      const actual = registerRows.filter((r) => r.section === section && r.sev === sev).length;
      const said = claimed.sevs[sev] ?? 0;
      if (actual !== said) scopeProblems.push(`${section} ${sev}: scope table says ${said}, register has ${actual}`);
    }
  }
  check(
    "the register's scope table counts its own rows",
    scopeProblems.length === 0,
    scopeProblems.join("; "),
  );

  // The register's severity tally, checked against its own counts table.
  const countsTable = new Map();
  let countsTotal = null;
  for (const line of registerLines) {
    const m = line.match(/^\|\s*\**(P\d)\**\s*\|\s*\**(\d+)\**\s*\|\s*\**(\d+)\**\s*\|\s*$/);
    if (m) {
      countsTable.set(m[1], { rows: Number(m[2]), open: Number(m[3]) });
      continue;
    }
    const t = line.match(/^\|\s*\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|\s*$/);
    if (t) countsTotal = { rows: Number(t[1]), open: Number(t[2]) };
  }
  const tallyProblems = [];
  for (const sev of ["P0", "P1", "P2", "P3"]) {
    const actual = bySeverity.get(sev) ?? 0;
    const claimed = countsTable.get(sev);
    if (!claimed) {
      tallyProblems.push(`no counts-table row for ${sev}`);
      continue;
    }
    if (claimed.rows !== actual) tallyProblems.push(`${sev}: counts table says ${claimed.rows}, register has ${actual}`);
  }
  if (!countsTotal) tallyProblems.push("no Total row in the counts table");
  else if (countsTotal.rows !== registerTotal) tallyProblems.push(`Total: counts table says ${countsTotal.rows}, register has ${registerTotal}`);
  check(
    "the register's severity counts table equals its own rows",
    tallyProblems.length === 0,
    tallyProblems.join("; "),
  );

  // The number the status document quotes for the register.
  const registerQuote = doc.match(/full\s+register is\s+(\d+)\s+defect rows/);
  check(
    "the status document quotes a register size",
    registerQuote !== null,
    "no 'full register is <n> defect rows' sentence found",
  );
  if (registerQuote) {
    check(
      `the quoted register size equals the register's ${registerTotal} rows`,
      Number(registerQuote[1]) === registerTotal,
      `${registerQuote[1]} != ${registerTotal}`,
    );
  }
}

// The changelog's severity-tagged tally, and the split the status document quotes.
if (!existsSync(CHANGELOG)) {
  check("the changelog exists", false, `${CHANGELOG} not found`);
} else {
  const changelog = readFileSync(CHANGELOG, "utf8");
  const sectionStart = changelog.indexOf("## 2026-10-16 — System audit closed");
  const sectionEnd = changelog.indexOf("\n## ", sectionStart + 10);
  const auditSection = sectionStart >= 0 ? changelog.slice(sectionStart, sectionEnd > 0 ? sectionEnd : undefined) : "";
  const changelogTally = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const line of auditSection.split(/\r?\n/)) {
    const m = line.match(/^-\s+\*\*(P\d)\*\*/);
    if (m) changelogTally[m[1]] += 1;
  }
  const tagged = changelogTally.P0 + changelogTally.P1 + changelogTally.P2;
  console.log(
    `  changelog tally       : ${tagged} severity-tagged defects -> ` +
      `P0 ${changelogTally.P0}, P1 ${changelogTally.P1}, P2 ${changelogTally.P2}` +
      ` (plus ${changelogTally.P3} P3 batch)`,
  );

  check(
    "the changelog's audit section carries severity-tagged entries",
    tagged > 0,
    "no '- **P0**' / '- **P1**' / '- **P2**' entries found in the audit section",
  );

  const sevQuote = doc.match(/(\d+)\s+severity-tagged defects closed\s*\(([^)]*)\)/);
  check(
    "the status document quotes the severity-tagged defect tally",
    sevQuote !== null,
    "no '<n> severity-tagged defects closed (...)' sentence found",
  );
  if (sevQuote) {
    const quotedTotal = Number(sevQuote[1]);
    const quoted = {};
    for (const m of sevQuote[2].matchAll(/(\d+)\s*(P\d)/g)) quoted[m[2]] = Number(m[1]);
    const problemsHere = [];
    if (quotedTotal !== tagged) problemsHere.push(`total ${quotedTotal} != ${tagged}`);
    for (const sev of ["P0", "P1", "P2"]) {
      if ((quoted[sev] ?? 0) !== changelogTally[sev]) {
        problemsHere.push(`${sev} ${quoted[sev] ?? 0} != ${changelogTally[sev]}`);
      }
    }
    check(
      "the quoted severity tally equals the changelog's own tally",
      problemsHere.length === 0,
      problemsHere.join("; "),
    );
  }
}

// ---------------------------------------------------------------------------
// 7. Verdict.
// ---------------------------------------------------------------------------
const verdict = problems.length === 0 ? "consistent" : "drift";
const verdictText =
  problems.length === 0
    ? `row census ${census.total} (DONE ${census.DONE}, DEFERRED ${census.DEFERRED}, N/A ${census["N/A"]}, BLOCKED ${census.BLOCKED}) and test count ${measuredTests}/${measuredFiles} both match the document`
    : `${problems.length} figure(s) disagree with their source`;

writeEvidence(problems.length === 0 ? 0 : 1, verdict, verdictText, {
  measured: { tests: measuredTests, files: measuredFiles },
  derivedCensus: census,
  derivedRequirements: requirements,
  quotedTestCounts,
  checks,
});

console.log("");
console.log(`${verdict === "consistent" ? "✔" : "✖"} doc-figures: ${checks.filter((c) => c.ok).length} passed, ${problems.length} failed`);
process.exit(problems.length === 0 ? 0 : 1);
