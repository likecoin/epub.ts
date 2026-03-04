import { isXml, parse, EpubError } from "./core";
import Path from "./path";

async function request(
  url: string,
  type?: string,
  withCredentials?: boolean,
  headers?: Record<string, string>,
): Promise<unknown> {
  // If type isn't set, determine it from the file extension
  if (!type) {
    type = new Path(url).extension;
  }

  const init: RequestInit = {};

  if (withCredentials) {
    init.credentials = "include";
  }

  if (headers || type === "json") {
    const h = new Headers(headers);
    if (type === "json") {
      h.set("Accept", "application/json");
    }
    init.headers = h;
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (e) {
    throw new EpubError((e as Error).message || "Network Error", 0);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new EpubError(body || response.statusText, response.status);
  }

  if (type === "blob") {
    const blob = await response.blob();
    // Re-wrap when the Blob doesn't match the current global (avoids
    // cross-realm instanceof failures when fetch runs in a different
    // context, e.g. Node native fetch inside jsdom).
    return blob instanceof Blob
      ? blob
      : new Blob([blob], { type: (blob as Blob).type });
  }

  if (type === "binary") {
    return response.arrayBuffer();
  }

  if (type === "json") {
    return response.json();
  }

  const text = await response.text();

  if (isXml(type)) {
    return parse(text, "text/xml");
  }

  if (type === "xhtml") {
    return parse(text, "application/xhtml+xml");
  }

  if (type === "html" || type === "htm") {
    return parse(text, "text/html");
  }

  return text;
}

export default request;
