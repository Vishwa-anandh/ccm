/**
 * invoiceFileParser — turns an uploaded PDF or spreadsheet (Excel/CSV) into
 * the {columns, rows, meta} shape UploadInvoicePage/LineItemsEditor already
 * understand, so a parsed file lands on the exact same editable table used
 * for manual entry. Parsing an arbitrary invoice layout can never be
 * perfectly reliable — this is deliberately a best-effort extraction, not
 * a claim of accuracy; the whole point of landing on an editable preview
 * afterward is that Finance reviews and fixes anything it got wrong before
 * saving.
 *
 * Returns: {
 *   meta: { customerNameGuess, invoiceDateGuess, dueDateGuess, totalGuess },
 *   columns: [{ id, label }],       // extra, non-standard columns found
 *   rows: [{ id, description, quantity, unitPrice, discountPct, extra }],
 * }
 */

const genId = () => (crypto.randomUUID ? crypto.randomUUID() : `row-${Math.random().toString(36).slice(2)}`);

const STANDARD_HEADER_ALIASES = {
  description: ["description", "item", "item description", "line item", "service", "product"],
  quantity: ["qty", "quantity", "units"],
  unitPrice: ["unit price", "price", "rate", "unit cost", "unitprice"],
  discountPct: ["discount", "discount %", "discount pct", "discountpct"],
  amount: ["amount", "total", "charges", "line total", "charges/credits"],
};

const normalizeHeader = (h) => String(h ?? "").trim().toLowerCase();

const matchStandardField = (header) => {
  const norm = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(STANDARD_HEADER_ALIASES)) {
    if (aliases.includes(norm)) return field;
  }
  return null;
};

const toNumber = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/* ── Spreadsheet (.xlsx/.xls/.csv) — reliably structured, so this is the
   more trustworthy of the two paths. Every column that isn't one of the
   recognized standard fields becomes its own custom column (LineItemsEditor
   already supports arbitrary extra columns), so "every row and column"
   really is preserved, not silently dropped. */
async function parseSpreadsheet(file) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });

  if (grid.length === 0) {
    throw new Error("This spreadsheet appears to be empty.");
  }

  const headerRow = grid[0].map((h) => String(h ?? "").trim());
  const dataRows = grid.slice(1).filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""));

  const fieldByColIndex = headerRow.map((h) => matchStandardField(h));
  const extraColumns = headerRow
    .map((label, i) => ({ label, i }))
    .filter(({ i }) => !fieldByColIndex[i] && headerRow[i])
    .map(({ label }) => ({ id: genId(), label }));

  const rows = dataRows.map((cells) => {
    const row = { id: genId(), description: "", quantity: 1, unitPrice: 0, discountPct: 0, extra: {} };
    let amountFallback = null;
    headerRow.forEach((label, i) => {
      const field = fieldByColIndex[i];
      const cell = cells[i] ?? "";
      if (field === "description") row.description = String(cell);
      else if (field === "quantity") row.quantity = toNumber(cell) || 1;
      else if (field === "unitPrice") row.unitPrice = toNumber(cell);
      else if (field === "discountPct") row.discountPct = toNumber(cell);
      else if (field === "amount") amountFallback = toNumber(cell);
      else if (label) {
        const col = extraColumns.find((c) => c.label === label);
        if (col) row.extra[col.id] = String(cell);
      }
    });
    // No explicit Unit Price column, but there was an Amount/Total column —
    // treat it as a flat per-line price (qty stays 1) so Amount still
    // computes correctly from qty × unitPrice.
    if (!row.unitPrice && amountFallback) row.unitPrice = amountFallback;
    if (!row.description) row.description = "Line item";
    return row;
  });

  return {
    meta: { customerNameGuess: null, invoiceDateGuess: null, dueDateGuess: null, totalGuess: null },
    columns: extraColumns,
    rows: rows.length ? rows : [{ id: genId(), description: "", quantity: 1, unitPrice: 0, discountPct: 0, extra: {} }],
  };
}

/* ── PDF — reconstructs visual lines from pdfjs's text items (grouped by
   y-position, ordered left-to-right within a line) rather than flattening
   a whole page into one string, so line-shaped regexes below actually see
   one invoice row per line like the source document does. */
async function extractPdfLines(file) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const byY = new Map();
    for (const item of content.items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y).push(item);
    }
    const ys = [...byY.keys()].sort((a, b) => b - a); // top of page first
    for (const y of ys) {
      const line = byY
        .get(y)
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) lines.push(line);
    }
  }
  return lines;
}

const LABELED_FIELD_PATTERNS = {
  invoiceNumber: /invoice number\s*:?\s*(\S+)/i,
  invoiceDate: /invoice date(?:\s*in\s*utc)?\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  dueDate: /due (?:on|date)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  paymentTerms: /payment terms?\s*:?\s*([A-Za-z0-9 ]+?days?)/i,
  poNumber: /PO Number\s*:?\s*(\S+)/i,
  total: /total(?: \(including tax\))?\s*(?:usd|amount due)?\s*:?\s*\$?\s*([\d,]+\.\d{2})/i,
};

// A line that's just a description followed by 4 trailing amounts:
// "<date range or text> <unitPrice> <qty> <charges> <total>"
const FOUR_NUMBER_ROW = /^(.*?)\s+([\d,]+\.\d{2})\s+(\d+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/;
// A simpler "<description> <amount> --- --- <total>" shape (the sample
// PDF's own "Usage Charges" section — no unit price/qty breakdown).
const TWO_NUMBER_ROW = /^(.+?)\s+([\d,]+\.\d{2})\s+(?:-{1,3}|[\d,]+\.\d{2}|\d{1,2}\.\d{2}%)\s+(?:-{1,3}|[\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/;

function extractHeaderMeta(lines) {
  const text = lines.join("\n");
  const meta = {};
  for (const [key, pattern] of Object.entries(LABELED_FIELD_PATTERNS)) {
    const m = text.match(pattern);
    if (m) meta[key] = m[1].trim();
  }
  // "Bill To" — the next non-empty line(s) after a line that is exactly
  // "Bill To" are the customer name + address block.
  const billToIdx = lines.findIndex((l) => /^bill to$/i.test(l.trim()));
  if (billToIdx !== -1) {
    meta.customerNameGuess = lines[billToIdx + 1]?.trim() || null;
  }
  return meta;
}

function toIsoDate(dateStr) {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!m) return null;
  let [, a, b, year] = m;
  if (year.length === 2) year = `20${year}`;
  // The sample documents use MM/DD/YYYY; treat ambiguous cases the same way.
  const month = a.padStart(2, "0");
  const day = b.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function parsePdf(file) {
  const lines = await extractPdfLines(file);
  if (lines.length === 0) {
    throw new Error("Couldn't read any text from this PDF — it may be a scanned image rather than a text PDF.");
  }
  const headerMeta = extractHeaderMeta(lines);

  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const four = line.match(FOUR_NUMBER_ROW);
    if (four) {
      // Capture groups: [full, description-lookahead(unused), unitPrice, qty,
      // charges(unused), total(unused)] — Amount is always derived from
      // qty × unitPrice via calcLine downstream, same as every other row
      // source in this app, rather than trusting the PDF's own printed total.
      const [, , unitPrice, qty] = four;
      // Description is the nearest preceding non-numeric, non-empty line
      // that isn't itself a table header ("Purchases", column labels…).
      let desc = "";
      for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
        const cand = lines[j].trim();
        if (!cand || /^(purchases|charge start date|po number)/i.test(cand)) continue;
        desc = cand;
        break;
      }
      rows.push({
        id: genId(),
        description: desc || "Line item",
        quantity: toNumber(qty) || 1,
        unitPrice: toNumber(unitPrice),
        discountPct: 0,
        extra: {},
      });
      continue;
    }
    const two = line.match(TWO_NUMBER_ROW);
    if (two) {
      const [, desc, amount] = two;
      if (/^(subtotal|total|tax|charges|sales tax)/i.test(desc.trim())) continue;
      rows.push({
        id: genId(),
        description: desc.trim(),
        quantity: 1,
        unitPrice: toNumber(amount),
        discountPct: 0,
        extra: {},
      });
    }
  }

  return {
    meta: {
      customerNameGuess: headerMeta.customerNameGuess ?? null,
      invoiceDateGuess: toIsoDate(headerMeta.invoiceDate),
      dueDateGuess: toIsoDate(headerMeta.dueDate),
      totalGuess: headerMeta.total ? toNumber(headerMeta.total) : null,
    },
    columns: [],
    rows: rows.length ? rows : [{ id: genId(), description: "", quantity: 1, unitPrice: 0, discountPct: 0, extra: {} }],
  };
}

export async function parseInvoiceFile(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return parsePdf(file);
  if (["xlsx", "xls", "csv"].includes(ext)) return parseSpreadsheet(file);
  throw new Error("Unsupported file type — upload a PDF, .xlsx, .xls, or .csv file.");
}

/**
 * mergeParsedInvoiceResults — combines N parseInvoiceFile() results (one
 * per uploaded file) into a single {columns, rows, meta}, so multiple
 * invoices uploaded together land on one combined, editable line-item
 * list rather than requiring one at a time. Columns are matched across
 * files by label (case-insensitive) rather than kept separate per file —
 * two files both carrying a "Notes" column fold into one shared column,
 * not duplicate it once per file. Every row keeps its own genId()'d id
 * from the parser (already unique), so rows from different files never
 * collide. `meta` takes the first non-null guess found across the files
 * for each field.
 */
export function mergeParsedInvoiceResults(parsedList) {
  const columns = [];
  const sharedIdByLabel = new Map();
  const rows = [];
  const meta = { customerNameGuess: null, invoiceDateGuess: null, dueDateGuess: null, totalGuess: null };

  for (const parsed of parsedList) {
    const idMap = new Map();
    for (const col of parsed.columns) {
      const key = col.label.trim().toLowerCase();
      let sharedId = sharedIdByLabel.get(key);
      if (!sharedId) {
        sharedId = col.id;
        sharedIdByLabel.set(key, sharedId);
        columns.push({ id: sharedId, label: col.label });
      }
      idMap.set(col.id, sharedId);
    }
    for (const row of parsed.rows) {
      const extra = {};
      for (const [colId, val] of Object.entries(row.extra ?? {})) {
        extra[idMap.get(colId) ?? colId] = val;
      }
      rows.push({ ...row, extra });
    }
    for (const key of ["customerNameGuess", "invoiceDateGuess", "dueDateGuess", "totalGuess"]) {
      if (!meta[key] && parsed.meta[key]) meta[key] = parsed.meta[key];
    }
  }
  return { columns, rows, meta };
}
