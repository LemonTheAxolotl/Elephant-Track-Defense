#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_OUTPUT = "docs/update-tracker.pdf";
const MAX_COMMITS = 40;

const args = process.argv.slice(2);
const outputArg = valueAfter("--output") || DEFAULT_OUTPUT;
const outputPath = resolve(process.cwd(), outputArg);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/update-tracker.mjs [--output docs/update-tracker.pdf]

Generates a PDF update tracker from the current Git repository.
The report includes branch, HEAD, working-tree status, changed files, and recent commits.`);
  process.exit(0);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function git(commandArgs, fallback = "") {
  try {
    return execFileSync("git", commandArgs, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return fallback;
  }
}

function sanitize(value) {
  return String(value || "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(text, maxChars) {
  const words = sanitize(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word.slice(0, maxChars);
      continue;
    }
    if (`${line} ${word}`.length <= maxChars) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word.slice(0, maxChars);
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function parseCommits(raw) {
  if (!raw) return [];
  return raw.split("\n").map((line) => {
    const [hash, date, author, ...subjectParts] = line.split("|");
    return {
      hash: sanitize(hash),
      date: sanitize(date),
      author: sanitize(author),
      subject: sanitize(subjectParts.join("|")),
    };
  });
}

function pdfEscape(text) {
  return sanitize(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function collectUpdateData() {
  const branch = git(["branch", "--show-current"], "(detached)");
  const head = git(["rev-parse", "--short", "HEAD"], "unknown");
  const fullHead = git(["rev-parse", "HEAD"], "unknown");
  const remote = git(["remote", "get-url", "origin"], "No origin remote configured");
  const status = git(["status", "--short"], "");
  const diffStat = git(["diff", "--stat"], "");
  const commitRaw = git(
    ["log", `-${MAX_COMMITS}`, "--date=short", "--pretty=format:%h|%ad|%an|%s"],
    ""
  );

  return {
    generatedAt: new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC"),
    branch,
    head,
    fullHead,
    remote,
    statusLines: status ? status.split("\n").map(sanitize) : ["Working tree clean"],
    diffLines: diffStat ? diffStat.split("\n").map(sanitize) : ["No uncommitted diff"],
    commits: parseCommits(commitRaw),
  };
}

function makeReportLines(data) {
  const lines = [];
  lines.push({ text: "Elephant Track Defense Update Tracker", size: 20, bold: true, gapAfter: 14 });
  lines.push({ text: `Generated: ${data.generatedAt}`, size: 10 });
  lines.push({ text: `Branch: ${data.branch}`, size: 10 });
  lines.push({ text: `HEAD: ${data.head} (${data.fullHead})`, size: 10 });
  lines.push({ text: `Remote: ${data.remote}`, size: 10, gapAfter: 12 });

  lines.push({ text: "Current Working Tree", size: 14, bold: true, gapAfter: 6 });
  for (const statusLine of data.statusLines) {
    lines.push({ text: statusLine, size: 9, indent: 14 });
  }
  lines.push({ text: "", size: 9, gapAfter: 5 });

  lines.push({ text: "Uncommitted Diff Summary", size: 14, bold: true, gapAfter: 6 });
  for (const diffLine of data.diffLines) {
    lines.push({ text: diffLine, size: 9, indent: 14 });
  }
  lines.push({ text: "", size: 9, gapAfter: 5 });

  lines.push({ text: `Recent Commits (${data.commits.length})`, size: 14, bold: true, gapAfter: 6 });
  if (!data.commits.length) {
    lines.push({ text: "No commits found.", size: 9, indent: 14 });
  }

  for (const commit of data.commits) {
    const heading = `${commit.date}  ${commit.hash}  ${commit.subject}`;
    lines.push({ text: heading, size: 9, bold: true, indent: 14 });
    lines.push({ text: `Author: ${commit.author}`, size: 8, indent: 28, gapAfter: 4 });
  }

  lines.push({ text: "", size: 9, gapAfter: 8 });
  lines.push({
    text: "Refresh this PDF after meaningful updates with: node scripts/update-tracker.mjs",
    size: 9,
    bold: true,
  });
  lines.push({
    text: "Optional automation: git config core.hooksPath .githooks",
    size: 9,
  });
  return lines;
}

function paginate(lines) {
  const pages = [];
  let page = [];
  let y = 720;

  for (const item of lines) {
    const maxChars = item.size >= 14 ? 62 : item.indent ? 94 : 108;
    const wrapped = wrapText(item.text, maxChars);
    const lineHeight = Math.max(11, item.size + 3);
    const requiredHeight = wrapped.length * lineHeight + (item.gapAfter || 0);

    if (y - requiredHeight < 72 && page.length) {
      pages.push(page);
      page = [];
      y = 720;
    }

    for (const text of wrapped) {
      page.push({ ...item, text, y });
      y -= lineHeight;
    }
    y -= item.gapAfter || 0;
  }

  if (page.length) pages.push(page);
  return pages;
}

function buildPdf(pages) {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageObjectIds = [];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const content = renderPageContent(pages[pageIndex], pageIndex + 1, pages.length);
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content, "binary")} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageObjectIds.push(pageId);
  }

  const pagesId = addObject(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`
  );
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  for (const pageId of pageObjectIds) {
    objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

function renderPageContent(lines, pageNumber, pageCount) {
  const commands = [
    "q",
    "0.93 0.95 0.93 rg",
    "0 760 612 32 re f",
    "0.29 0.44 0.36 rg",
    "0 756 612 4 re f",
    "Q",
  ];

  for (const line of lines) {
    const font = line.bold ? "F2" : "F1";
    const x = 54 + (line.indent || 0);
    commands.push("BT");
    commands.push(`/${font} ${line.size} Tf`);
    commands.push("0.14 0.19 0.23 rg");
    commands.push(`${x} ${line.y} Td`);
    commands.push(`(${pdfEscape(line.text)}) Tj`);
    commands.push("ET");
  }

  commands.push("BT");
  commands.push("/F1 8 Tf");
  commands.push("0.36 0.42 0.45 rg");
  commands.push("54 36 Td");
  commands.push("(Elephant Track Defense update tracker) Tj");
  commands.push("ET");
  commands.push("BT");
  commands.push("/F1 8 Tf");
  commands.push("0.36 0.42 0.45 rg");
  commands.push("500 36 Td");
  commands.push(`(Page ${pageNumber} of ${pageCount}) Tj`);
  commands.push("ET");

  return commands.join("\n");
}

const data = collectUpdateData();
const pages = paginate(makeReportLines(data));
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, buildPdf(pages), "binary");
console.log(`Updated ${outputArg} with ${pages.length} page${pages.length === 1 ? "" : "s"}.`);
