function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

function readJson(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return {};
  }
}

module.exports = { json, readJson };
