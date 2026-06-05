import sanitizeHtml from "sanitize-html";

export function sanitizeInput(value: any): any {
  if (typeof value === "string") {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: "discard",
    }).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeInput);
  }

  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, any> = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(value[key]);
      }
    }
    return sanitized;
  }

  return value;
}
