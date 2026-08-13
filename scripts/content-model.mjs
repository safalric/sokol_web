const ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,79}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_PATTERN = /^(\+420\s?)?(\d\s?){9}$/;
const ICONS = new Set(["baby", "calendar", "dumbbell", "goal", "mail", "map-pin", "shield", "sparkles", "users"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function validGoogleFormUrl(value) {
  if (value === null) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "forms.gle"
      || (url.hostname === "docs.google.com" && url.pathname.startsWith("/forms/"))
    );
  } catch {
    return false;
  }
}

function stringField(errors, value, path, { max = 2_000, optional = false } = {}) {
  if (optional && (value === undefined || value === "")) return;
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    errors.push(`${path} musí být neprázdný text do ${max} znaků.`);
  }
}

function exactKeys(errors, value, path, allowed) {
  if (!isObject(value)) {
    errors.push(`${path} musí být objekt.`);
    return false;
  }
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) errors.push(`${path} obsahuje nepovolená pole: ${unexpected.join(", ")}.`);
  return true;
}

function uniqueIds(errors, items, path) {
  const ids = new Set();
  items.forEach((item, index) => {
    if (!ID_PATTERN.test(item?.id || "")) errors.push(`${path}[${index}].id nemá bezpečný stabilní formát.`);
    if (ids.has(item?.id)) errors.push(`${path} obsahuje duplicitní ID ${item.id}.`);
    ids.add(item?.id);
  });
}

function validateContacts(errors, items, path, roleRequired = false) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`${path} musí být neprázdné pole.`);
    return;
  }
  items.forEach((person, index) => {
    const allowed = roleRequired ? ["role", "name", "phone", "email"] : ["name", "focus", "phone", "email"];
    if (!exactKeys(errors, person, `${path}[${index}]`, allowed)) return;
    if (roleRequired) stringField(errors, person.role, `${path}[${index}].role`, { max: 80 });
    stringField(errors, person.name, `${path}[${index}].name`, { max: 120 });
    if (!PHONE_PATTERN.test(person.phone || "")) errors.push(`${path}[${index}].phone není platný český telefon.`);
    if (person.email !== undefined && !EMAIL_PATTERN.test(person.email)) errors.push(`${path}[${index}].email není platný e-mail.`);
    if (!roleRequired) stringField(errors, person.focus, `${path}[${index}].focus`, { max: 100, optional: true });
  });
}

export function validateSiteContent(content) {
  const errors = [];
  const topLevel = [
    "contentVersion",
    "quickLinks",
    "notices",
    "departments",
    "events",
    "calendarFallback",
    "leadership",
    "coachContacts",
    "contactDetails",
  ];
  if (!exactKeys(errors, content, "site-content", topLevel)) return errors;
  if (!validIsoDate(content.contentVersion)) errors.push("contentVersion musí být platné datum YYYY-MM-DD.");

  if (!Array.isArray(content.quickLinks) || content.quickLinks.length === 0) {
    errors.push("quickLinks musí být neprázdné pole.");
  } else {
    content.quickLinks.forEach((item, index) => {
      if (!exactKeys(errors, item, `quickLinks[${index}]`, ["label", "href", "icon"])) return;
      stringField(errors, item.label, `quickLinks[${index}].label`, { max: 80 });
      if (typeof item.href !== "string" || !item.href.startsWith("/")) errors.push(`quickLinks[${index}].href musí být interní cesta.`);
      if (!ICONS.has(item.icon)) errors.push(`quickLinks[${index}].icon není podporovaná ikona.`);
    });
  }

  if (!Array.isArray(content.notices)) {
    errors.push("notices musí být pole.");
  } else {
    uniqueIds(errors, content.notices, "notices");
    content.notices.forEach((notice, index) => {
      if (!exactKeys(errors, notice, `notices[${index}]`, ["id", "title", "date", "type", "label", "text"])) return;
      ["title", "date", "label", "text"].forEach((field) => stringField(errors, notice[field], `notices[${index}].${field}`));
      if (!["info", "alert", "event"].includes(notice.type)) errors.push(`notices[${index}].type není podporovaný typ.`);
    });
  }

  if (!Array.isArray(content.departments) || content.departments.length === 0) {
    errors.push("departments musí být neprázdné pole.");
  } else {
    uniqueIds(errors, content.departments, "departments");
    content.departments.forEach((department, index) => {
      const path = `departments[${index}]`;
      if (!exactKeys(errors, department, path, ["id", "title", "age", "day", "time", "place", "contactName", "contactPhone", "description", "icon", "demo"])) return;
      ["title", "age", "day", "time", "place", "contactName", "description"].forEach((field) => stringField(errors, department[field], `${path}.${field}`));
      if (department.contactPhone !== undefined && !PHONE_PATTERN.test(department.contactPhone)) errors.push(`${path}.contactPhone není platný český telefon.`);
      if (!ICONS.has(department.icon)) errors.push(`${path}.icon není podporovaná ikona.`);
      if (typeof department.demo !== "boolean") errors.push(`${path}.demo musí být true nebo false.`);
    });
  }

  if (!Array.isArray(content.events) || content.events.length === 0) {
    errors.push("events musí být neprázdné pole.");
  } else {
    uniqueIds(errors, content.events, "events");
    content.events.forEach((event, index) => {
      const path = `events[${index}]`;
      if (!exactKeys(errors, event, path, ["id", "title", "date", "time", "place", "capacityLabel", "category", "status", "description", "registration"])) return;
      ["title", "date", "time", "place", "capacityLabel", "category", "status", "description"].forEach((field) => stringField(errors, event[field], `${path}.${field}`));
      if (event.registration === null) return;
      const policyPath = `${path}.registration`;
      if (!exactKeys(errors, event.registration, policyPath, ["provider", "formUrl", "type", "open", "eventDate", "closesAt", "capacity", "retentionReviewDate"])) return;
      if (event.registration.provider !== "google_forms") errors.push(`${policyPath}.provider musí být google_forms.`);
      if (event.registration.formUrl !== null && !validGoogleFormUrl(event.registration.formUrl)) {
        errors.push(`${policyPath}.formUrl musí být HTTPS odkaz na Google Forms nebo null.`);
      }
      if (event.registration.open === true && !validGoogleFormUrl(event.registration.formUrl)) {
        errors.push(`${policyPath}.formUrl je povinný, když je přihlašování otevřené.`);
      }
      if (!["trip", "camp"].includes(event.registration.type)) errors.push(`${policyPath}.type musí být trip nebo camp.`);
      if (typeof event.registration.open !== "boolean") errors.push(`${policyPath}.open musí být true nebo false.`);
      if (!validIsoDate(event.registration.eventDate)) errors.push(`${policyPath}.eventDate není platné datum.`);
      if (!validIsoDate(event.registration.retentionReviewDate)) errors.push(`${policyPath}.retentionReviewDate není platné datum.`);
      const closesAt = new Date(event.registration.closesAt);
      if (Number.isNaN(closesAt.getTime())) errors.push(`${policyPath}.closesAt není platné datum a čas.`);
      if (!Number.isInteger(event.registration.capacity) || event.registration.capacity < 1 || event.registration.capacity > 10_000) {
        errors.push(`${policyPath}.capacity musí být celé číslo od 1 do 10000.`);
      }
      if (validIsoDate(event.registration.eventDate) && !Number.isNaN(closesAt.getTime())) {
        const eventEnd = new Date(`${event.registration.eventDate}T23:59:59Z`);
        if (closesAt > eventEnd) errors.push(`${policyPath}.closesAt nesmí být po skončení akce.`);
      }
      if (validIsoDate(event.registration.eventDate) && validIsoDate(event.registration.retentionReviewDate)
        && event.registration.retentionReviewDate < event.registration.eventDate) {
        errors.push(`${policyPath}.retentionReviewDate nesmí být před akcí.`);
      }
    });
  }

  if (!Array.isArray(content.calendarFallback)) {
    errors.push("calendarFallback musí být pole.");
  } else {
    uniqueIds(errors, content.calendarFallback, "calendarFallback");
    content.calendarFallback.forEach((event, index) => {
      const path = `calendarFallback[${index}]`;
      if (!exactKeys(errors, event, path, ["id", "date", "title", "time", "category", "place"])) return;
      if (!validIsoDate(event.date)) errors.push(`${path}.date není platné datum.`);
      ["title", "time", "place"].forEach((field) => stringField(errors, event[field], `${path}.${field}`));
      if (!["training", "event"].includes(event.category)) errors.push(`${path}.category musí být training nebo event.`);
    });
  }

  validateContacts(errors, content.leadership, "leadership", true);
  validateContacts(errors, content.coachContacts, "coachContacts", false);

  if (!Array.isArray(content.contactDetails) || content.contactDetails.length === 0) {
    errors.push("contactDetails musí být neprázdné pole.");
  } else {
    const labels = new Set();
    content.contactDetails.forEach((detail, index) => {
      const path = `contactDetails[${index}]`;
      if (!exactKeys(errors, detail, path, ["label", "value", "icon"])) return;
      stringField(errors, detail.label, `${path}.label`, { max: 80 });
      stringField(errors, detail.value, `${path}.value`, { max: 300 });
      if (!ICONS.has(detail.icon)) errors.push(`${path}.icon není podporovaná ikona.`);
      if (labels.has(detail.label)) errors.push(`contactDetails obsahuje duplicitní položku ${detail.label}.`);
      labels.add(detail.label);
    });
  }

  return errors;
}

export function deriveContentData(content) {
  return {
    calendarEvents: content.calendarFallback,
  };
}
