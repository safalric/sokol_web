const COMMON_FIELDS = [
  ["receivedAt", "Přijato"],
  ["receiptId", "ID přihlášky"],
  ["eventName", "Akce"],
  ["participantName", "Účastník"],
  ["birthDate", "Datum narození"],
  ["guardianName", "Zákonný zástupce"],
  ["email", "E-mail"],
  ["phone", "Telefon"],
];

const FINAL_FIELDS = [
  ["additionalNote", "Poznámka"],
  ["privacyAcknowledged", "Seznámení se zásadami"],
  ["guardianDeclaration", "Prohlášení zástupce"],
  ["mediaConsent", "Souhlas foto/video"],
  ["consentVersion", "Verze právních informací"],
  ["retentionReviewDate", "Kontrola výmazu"],
];

const SCHEMAS = {
  trip: COMMON_FIELDS.concat(FINAL_FIELDS),
  camp: COMMON_FIELDS.concat([
    ["healthNote", "Zdravotní omezení"],
    ["healthConsent", "Souhlas zdravotní údaje"],
  ], FINAL_FIELDS),
};

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function safeCell_(value) {
  const text = String(value == null ? "" : value).slice(0, 2000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function doPost(event) {
  const properties = PropertiesService.getScriptProperties();
  const expectedSecret = properties.getProperty("WEBHOOK_SECRET");
  const sheetId = properties.getProperty("SHEET_ID");

  try {
    const rawBody = event && event.postData ? event.postData.contents || "" : "";
    if (!rawBody || rawBody.length > 20000) return jsonResponse_({ ok: false });
    const body = JSON.parse(rawBody);
    const schema = SCHEMAS[body.registrationType];
    if (!expectedSecret || body.secret !== expectedSecret || !sheetId || !schema) return jsonResponse_({ ok: false });
    if (body.action !== "reserve" || !body.receiptId || !body.eventName || !body.record) return jsonResponse_({ ok: false });
    if (!Number.isInteger(body.capacity) || body.capacity < 1 || body.capacity > 10000) return jsonResponse_({ ok: false });

    const allowedKeys = new Set(schema.map(function (field) { return field[0]; }));
    const unexpectedKeys = Object.keys(body.record).filter(function (key) { return !allowedKeys.has(key); });
    if (unexpectedKeys.length > 0) return jsonResponse_({ ok: false });
    if (body.record.receiptId !== body.receiptId || body.record.eventName !== body.eventName) return jsonResponse_({ ok: false });

    const safeRow = schema.map(function (field) { return safeCell_(body.record[field[0]]); });
    const headers = schema.map(function (field) { return field[1]; });
    const receiptColumn = schema.findIndex(function (field) { return field[0] === "receiptId"; }) + 1;
    const eventColumn = schema.findIndex(function (field) { return field[0] === "eventName"; }) + 1;
    const sheetName = body.registrationType === "camp"
      ? properties.getProperty("CAMP_SHEET_NAME") || "Tábory"
      : properties.getProperty("TRIP_SHEET_NAME") || "Výlety";

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
      if (sheet.getLastRow() === 0) sheet.appendRow(headers);
      if (sheet.getLastColumn() !== headers.length) return jsonResponse_({ ok: false });
      const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
      if (existingHeaders.some(function (header, index) { return header !== headers[index]; })) {
        return jsonResponse_({ ok: false });
      }

      const rowCount = Math.max(0, sheet.getLastRow() - 1);
      const receiptValues = rowCount > 0 ? sheet.getRange(2, receiptColumn, rowCount, 1).getDisplayValues() : [];
      const eventValues = rowCount > 0 ? sheet.getRange(2, eventColumn, rowCount, 1).getDisplayValues() : [];
      const existing = receiptValues.some(function (row) { return row[0] === body.receiptId; });
      const registeredCount = eventValues.filter(function (row) { return row[0] === body.eventName; }).length;

      if (existing) {
        return jsonResponse_({ ok: true, status: "duplicate", capacityRemaining: Math.max(0, body.capacity - registeredCount) });
      }
      if (registeredCount >= body.capacity) {
        return jsonResponse_({ ok: true, status: "full", capacityRemaining: 0 });
      }

      sheet.appendRow(safeRow);
      return jsonResponse_({
        ok: true,
        status: "created",
        capacityRemaining: Math.max(0, body.capacity - registeredCount - 1),
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false });
  }
}
