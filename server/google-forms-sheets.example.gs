/**
 * Google Forms + Google Sheets registrace pro TJ Sokol.
 * Skript vlozte do Apps Script projektu navazaneho na SOUKROMOU tabulku
 * s odpovedmi Google Forms. Neposila zadne e-maily rodicum.
 */

const REGISTRATION_SETTINGS = {
  configSheet: "Nastaveni",
  logSheet: "Provozni log",
  configHeaders: ["event_id", "event_name", "capacity", "registration_open", "closes_at", "retention_review_date"],
  resultHeaders: ["Stav kontroly", "Duvod kontroly", "Kontrolni klic", "ID prijeti", "Zpracovano", "Kontrola vymazu"],
  acceptedStatuses: ["POTVRZENO", "NAHRADNIK"],
};

const FORM_FIELDS = {
  timestamp: ["Casove razitko", "Časové razítko", "Timestamp"],
  eventId: ["ID akce", "Akce"],
  participantName: ["Jmeno a prijmeni ucastnika", "Jméno a příjmení účastníka"],
  birthDate: ["Datum narozeni ucastnika", "Datum narození účastníka"],
  guardianName: ["Jmeno a prijmeni zakonneho zastupce", "Jméno a příjmení zákonného zástupce"],
  email: ["E-mail", "E-mailova adresa", "E-mailová adresa"],
  phone: ["Telefon", "Telefonni cislo", "Telefonní číslo"],
  privacy: ["Souhlas se zpracovanim udaju", "Souhlas se zpracováním údajů"],
};

function setupRegistrationAutomation() {
  const spreadsheet = SpreadsheetApp.getActive();
  if (!spreadsheet) throw new Error("Skript spustte poprve z Apps Script projektu navazaneho na registracni tabulku.");
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty("REGISTRATION_SPREADSHEET_ID", spreadsheet.getId());
  if (!properties.getProperty("DEDUPE_SECRET")) {
    properties.setProperty("DEDUPE_SECRET", Utilities.getUuid() + Utilities.getUuid());
  }
  let config = spreadsheet.getSheetByName(REGISTRATION_SETTINGS.configSheet);
  if (!config) config = spreadsheet.insertSheet(REGISTRATION_SETTINGS.configSheet);

  if (config.getLastRow() === 0) {
    config.getRange(1, 1, 1, REGISTRATION_SETTINGS.configHeaders.length).setValues([REGISTRATION_SETTINGS.configHeaders]);
    config.getRange(2, 1, 1, REGISTRATION_SETTINGS.configHeaders.length).setValues([[
      "ukazkova-akce-2026",
      "Ukazkova akce - pred pouzitim upravit",
      30,
      false,
      "2026-09-18T18:00:00+02:00",
      "2026-10-19",
    ]]);
  }

  config.setFrozenRows(1);
  config.getRange("A1:F1").setFontWeight("bold").setBackground("#e8eaed");
  config.getRange("C2:C").setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(1, 10000).build());
  config.getRange("D2:D").setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  ensureLogSheet_(spreadsheet);
}

function installRegistrationTriggers() {
  const spreadsheet = getRegistrationSpreadsheet_();
  const handlers = new Set(["onRegistrationFormSubmit", "monitorRegistrationProcessing", "runDailyMaintenance", "createPrivateBackup"]);
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (handlers.has(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger("onRegistrationFormSubmit").forSpreadsheet(spreadsheet).onFormSubmit().create();
  ScriptApp.newTrigger("monitorRegistrationProcessing").timeBased().everyHours(1).create();
  ScriptApp.newTrigger("runDailyMaintenance").timeBased().everyDays(1).atHour(4).inTimezone("Europe/Prague").create();
  ScriptApp.newTrigger("createPrivateBackup").timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(5).inTimezone("Europe/Prague").create();
}

function onRegistrationFormSubmit(event) {
  if (!event || !event.range || !event.namedValues) throw new Error("Funkci spousti pouze instalovany trigger Google Forms.");
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    const sheet = event.range.getSheet();
    if (sheet.getName() === REGISTRATION_SETTINGS.configSheet || sheet.getName() === REGISTRATION_SETTINGS.logSheet) {
      throw new Error("Trigger byl spusten nad neplatnym listem.");
    }
    if (!isRegistrationResponseSheet_(sheet)) throw new Error("Odpovedni list nema ocekavane sloupce registracniho formulare.");

    sanitizeSubmittedRow_(event.range);
    const columns = ensureResultColumns_(sheet);
    const values = readFormValues_(event.namedValues);
    const checked = validateSubmission_(values);
    const now = new Date();
    let status = "CHYBA";
    let reason = checked.errors.join("; ");
    let dedupeKey = "";
    let receiptId = "";
    let retentionDate = "";

    if (checked.errors.length === 0) {
      const config = findEventConfig_(values.eventId);
      if (!config) {
        reason = "Neznama nebo neaktivni akce.";
      } else if (!config.open) {
        reason = "Prihlasovani na akci je uzavrene.";
      } else if (config.closesAt.getTime() < now.getTime()) {
        reason = "Uzaverka prihlasovani jiz uplynula.";
      } else {
        dedupeKey = createDedupeKey_(values);
        retentionDate = config.retentionReviewDate;
        if (hasExistingRegistration_(sheet, columns, dedupeKey, event.range.getRow())) {
          status = "DUPLICITA";
          reason = "Stejny ucastnik je na tuto akci jiz evidovan.";
        } else {
          const confirmed = countConfirmed_(sheet, columns, values.eventId);
          status = confirmed >= config.capacity ? "NAHRADNIK" : "POTVRZENO";
          reason = status === "NAHRADNIK" ? "Kapacita je naplnena; zaznam je na seznamu nahradniku." : "Udaje prosly automatickou kontrolou.";
          receiptId = Utilities.getUuid();
        }
      }
    }

    sheet.getRange(event.range.getRow(), columns.status + 1, 1, REGISTRATION_SETTINGS.resultHeaders.length).setValues([[
      status,
      reason,
      dedupeKey,
      receiptId,
      now,
      retentionDate,
    ]]);
    appendLog_("FORM_SUBMIT", status, values.eventId || "neznamy-event");
  } finally {
    lock.releaseLock();
  }
}

function validateSubmission_(values) {
  const errors = [];
  const birthDate = parseFormDate_(values.birthDate);
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(values.eventId)) errors.push("Neplatne ID akce");
  if (values.participantName.length < 2 || values.participantName.length > 120) errors.push("Neplatne jmeno ucastnika");
  if (!birthDate) {
    errors.push("Neplatne datum narozeni");
  } else {
    const birth = new Date(`${birthDate}T12:00:00Z`);
    const today = new Date();
    const oldest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
    const eighteenthBirthday = new Date(birth);
    eighteenthBirthday.setUTCFullYear(eighteenthBirthday.getUTCFullYear() + 18);
    if (birth.getTime() > today.getTime() || birth.getTime() < oldest.getTime()) errors.push("Datum narozeni je mimo povoleny rozsah");
    if (eighteenthBirthday.getTime() > today.getTime() && values.guardianName.length < 2) errors.push("U nezletileho chybi zakonny zastupce");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(values.email)) errors.push("Neplatny e-mail");
  if (!/^(\+420\s?)?(\d\s?){9}$/.test(values.phone)) errors.push("Neplatny telefon");
  if (!/^(ano|souhlasim|true|yes)$/.test(normalizeIdentity_(values.privacy))) errors.push("Chybi povinny souhlas");
  return { errors: errors };
}

function readFormValues_(namedValues) {
  const eventLabel = normalize_(readNamedValue_(namedValues, FORM_FIELDS.eventId), 180).toLowerCase();
  const eventIdMatch = eventLabel.match(/^[a-z0-9][a-z0-9-]{2,79}/);
  return {
    eventId: eventIdMatch ? eventIdMatch[0] : "",
    participantName: normalize_(readNamedValue_(namedValues, FORM_FIELDS.participantName), 120),
    birthDate: normalize_(readNamedValue_(namedValues, FORM_FIELDS.birthDate), 30),
    guardianName: normalize_(readNamedValue_(namedValues, FORM_FIELDS.guardianName), 120),
    email: normalize_(readNamedValue_(namedValues, FORM_FIELDS.email), 160).toLowerCase(),
    phone: normalize_(readNamedValue_(namedValues, FORM_FIELDS.phone), 30),
    privacy: normalize_(readNamedValue_(namedValues, FORM_FIELDS.privacy), 80),
  };
}

function readNamedValue_(namedValues, aliases) {
  for (let index = 0; index < aliases.length; index += 1) {
    const value = namedValues[aliases[index]];
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
  }
  return "";
}

function findEventConfig_(eventId) {
  const sheet = getRegistrationSpreadsheet_().getSheetByName(REGISTRATION_SETTINGS.configSheet);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, REGISTRATION_SETTINGS.configHeaders.length).getValues();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (normalize_(row[0], 80).toLowerCase() !== eventId) continue;
    const closesAt = new Date(row[4]);
    const capacity = Number(row[2]);
    const retention = formatIsoDate_(row[5]);
    if (!Number.isInteger(capacity) || capacity < 1 || Number.isNaN(closesAt.getTime()) || !retention) return null;
    return { capacity: capacity, open: row[3] === true, closesAt: closesAt, retentionReviewDate: retention };
  }
  return null;
}

function ensureResultColumns_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  let headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const resultStart = headers.indexOf(REGISTRATION_SETTINGS.resultHeaders[0]);
  const resultBlockIsContiguous = resultStart >= 0 && REGISTRATION_SETTINGS.resultHeaders.every(function (header, index) {
    return headers[resultStart + index] === header;
  });
  if (!resultBlockIsContiguous) {
    const startColumn = sheet.getLastColumn() + 1;
    sheet.getRange(1, startColumn, 1, REGISTRATION_SETTINGS.resultHeaders.length)
      .setValues([REGISTRATION_SETTINGS.resultHeaders])
      .setFontWeight("bold")
      .setBackground("#e8eaed");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  }
  const statusColumn = headers.lastIndexOf(REGISTRATION_SETTINGS.resultHeaders[0]);
  return {
    headers: headers,
    timestamp: findHeader_(headers, FORM_FIELDS.timestamp),
    eventId: findHeader_(headers, FORM_FIELDS.eventId),
    status: statusColumn,
    reason: statusColumn + 1,
    dedupe: statusColumn + 2,
    receipt: statusColumn + 3,
    processed: statusColumn + 4,
    retention: statusColumn + 5,
  };
}

function findHeader_(headers, aliases) {
  for (let index = 0; index < aliases.length; index += 1) {
    const column = headers.indexOf(aliases[index]);
    if (column !== -1) return column;
  }
  return -1;
}

function hasExistingRegistration_(sheet, columns, dedupeKey, currentRow) {
  if (!dedupeKey || sheet.getLastRow() < 2) return false;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
  return rows.some(function (row, index) {
    const sheetRow = index + 2;
    return sheetRow !== currentRow
      && row[columns.dedupe] === dedupeKey
      && REGISTRATION_SETTINGS.acceptedStatuses.indexOf(row[columns.status]) !== -1;
  });
}

function countConfirmed_(sheet, columns, eventId) {
  if (sheet.getLastRow() < 2 || columns.eventId < 0) return 0;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
  return rows.filter(function (row) {
    return normalize_(row[columns.eventId], 80).toLowerCase() === eventId && row[columns.status] === "POTVRZENO";
  }).length;
}

function isRegistrationResponseSheet_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  return findHeader_(headers, FORM_FIELDS.eventId) >= 0
    && findHeader_(headers, FORM_FIELDS.participantName) >= 0
    && findHeader_(headers, FORM_FIELDS.birthDate) >= 0
    && findHeader_(headers, FORM_FIELDS.email) >= 0;
}

function createDedupeKey_(values, secret) {
  const birthDate = parseFormDate_(values.birthDate);
  const raw = [values.eventId, normalizeIdentity_(values.participantName), birthDate].join("|");
  const dedupeSecret = secret || PropertiesService.getScriptProperties().getProperty("DEDUPE_SECRET");
  if (!dedupeSecret || dedupeSecret.length < 32) throw new Error("Chybi bezpecny DEDUPE_SECRET. Spustte setupRegistrationAutomation().");
  const digest = Utilities.computeHmacSha256Signature(raw, dedupeSecret, Utilities.Charset.UTF_8);
  return digest.map(function (byte) { return (byte + 256).toString(16).slice(-2); }).join("");
}

function sanitizeSubmittedRow_(range) {
  const values = range.getValues()[0];
  values.forEach(function (value, index) {
    if (typeof value === "string" && /^[=+\-@]/.test(value.trim())) {
      range.getSheet().getRange(range.getRow(), range.getColumn() + index).setNumberFormat("@").setValue("'" + value);
    }
  });
}

function runDailyMaintenance() {
  const spreadsheet = getRegistrationSpreadsheet_();
  const autoDelete = PropertiesService.getScriptProperties().getProperty("AUTO_DELETE_EXPIRED") === "true";
  const today = formatIsoDate_(new Date());
  let flagged = 0;
  let deleted = 0;

  spreadsheet.getSheets().forEach(function (sheet) {
    if ([REGISTRATION_SETTINGS.configSheet, REGISTRATION_SETTINGS.logSheet].indexOf(sheet.getName()) !== -1
      || sheet.getLastRow() < 2
      || !isRegistrationResponseSheet_(sheet)) return;
    const columns = ensureResultColumns_(sheet);
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
    const rowsToDelete = [];
    rows.forEach(function (row, index) {
      const retention = formatIsoDate_(row[columns.retention]);
      if (!retention || retention > today || row[columns.status] === "VYMAZANO") return;
      const sheetRow = index + 2;
      flagged += 1;
      if (autoDelete) rowsToDelete.push(sheetRow);
      else if (row[columns.status] === "K VYMAZU") return;
      else sheet.getRange(sheetRow, columns.status + 1).setValue("K VYMAZU");
    });

    if (rowsToDelete.length > 0) {
      createPrivateBackup();
      rowsToDelete.reverse().forEach(function (row) { sheet.deleteRow(row); deleted += 1; });
    }
  });
  appendLog_("MAINTENANCE", `oznaceno:${flagged};vymazano:${deleted}`, "bez-osobnich-udaju");
}

function monitorRegistrationProcessing() {
  const spreadsheet = getRegistrationSpreadsheet_();
  const threshold = Date.now() - 15 * 60 * 1000;
  let marked = 0;

  spreadsheet.getSheets().forEach(function (sheet) {
    if (sheet.getLastRow() < 2 || !isRegistrationResponseSheet_(sheet)) return;
    const columns = ensureResultColumns_(sheet);
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    rows.forEach(function (row, index) {
      if (String(row[columns.status] || "").trim()) return;
      const submittedAt = columns.timestamp >= 0 ? new Date(row[columns.timestamp]) : null;
      if (submittedAt && !Number.isNaN(submittedAt.getTime()) && submittedAt.getTime() > threshold) return;
      const sheetRow = index + 2;
      sheet.getRange(sheetRow, columns.status + 1, 1, 2).setValues([[
        "CHYBA",
        "Automaticke zpracovani neprobehlo; zaznam vyzaduje rucni kontrolu.",
      ]]);
      marked += 1;
    });
  });

  appendLog_("PROCESSING_MONITOR", `oznaceno:${marked}`, "bez-osobnich-udaju");
}

function createPrivateBackup() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty("BACKUP_FOLDER_ID");
  if (!folderId) throw new Error("V Script Properties chybi BACKUP_FOLDER_ID soukrome slozky.");
  const retentionDays = Math.min(30, Math.max(1, Number(properties.getProperty("BACKUP_RETENTION_DAYS") || 7)));
  const sourceFile = DriveApp.getFileById(getRegistrationSpreadsheet_().getId());
  const folder = DriveApp.getFolderById(folderId);
  const prefix = `ZALOHA_PRIHLASEK_${Utilities.formatDate(new Date(), "Europe/Prague", "yyyy-MM-dd_HH-mm")}`;
  sourceFile.makeCopy(prefix, folder);

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf("ZALOHA_PRIHLASEK_") === 0 && file.getDateCreated().getTime() < cutoff) file.setTrashed(true);
  }
  appendLog_("BACKUP", "OK", "bez-osobnich-udaju");
}

function ensureLogSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(REGISTRATION_SETTINGS.logSheet);
  if (!sheet) sheet = spreadsheet.insertSheet(REGISTRATION_SETTINGS.logSheet);
  if (sheet.getLastRow() === 0) sheet.appendRow(["Cas", "Akce", "Vysledek", "Reference"]);
  return sheet;
}

function appendLog_(action, result, reference) {
  ensureLogSheet_(getRegistrationSpreadsheet_()).appendRow([new Date(), action, result, String(reference).slice(0, 80)]);
}

function getRegistrationSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("REGISTRATION_SPREADSHEET_ID");
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);
  const active = SpreadsheetApp.getActive();
  if (!active) throw new Error("Chybi REGISTRATION_SPREADSHEET_ID. Spustte setupRegistrationAutomation().");
  properties.setProperty("REGISTRATION_SPREADSHEET_ID", active.getId());
  return active;
}

function normalize_(value, maxLength) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeIdentity_(value) {
  return normalize_(value, 120).toLocaleLowerCase("cs-CZ").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function parseFormDate_(value) {
  const normalized = normalize_(value, 30);
  let match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) match = normalized.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  if (!match) return "";
  const iso = normalized.indexOf("-") !== -1
    ? `${match[1]}-${match[2]}-${match[3]}`
    : `${match[3]}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || !date.toISOString().startsWith(iso) ? "" : iso;
}

function formatIsoDate_(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return Utilities.formatDate(date, "Europe/Prague", "yyyy-MM-dd");
}
