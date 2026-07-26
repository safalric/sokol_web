const HEADERS = [
  "Přijato", "ID přihlášky", "Akce", "Účastník", "Datum narození",
  "Zákonný zástupce", "E-mail", "Telefon", "Zdravotní omezení", "Poznámka",
  "Seznámení se zásadami", "Prohlášení zástupce", "Souhlas zdravotní údaje",
  "Souhlas foto/video", "Verze právních informací", "Kontrola výmazu",
];

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
  const sheetName = properties.getProperty("SHEET_NAME") || "Přihlášky";

  try {
    const rawBody = event && event.postData ? event.postData.contents || "" : "";
    if (!rawBody || rawBody.length > 20000) return jsonResponse_({ ok: false });
    const body = JSON.parse(rawBody);
    if (!expectedSecret || body.secret !== expectedSecret || !sheetId) return jsonResponse_({ ok: false });
    if (!body.receiptId || !Array.isArray(body.row) || body.row.length !== HEADERS.length) return jsonResponse_({ ok: false });
    const safeRow = body.row.map(safeCell_);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
      if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

      const receiptIds = sheet.getLastRow() > 1
        ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues().flat()
        : [];
      if (!receiptIds.includes(body.receiptId)) sheet.appendRow(safeRow);
    } finally {
      lock.releaseLock();
    }
    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false });
  }
}
