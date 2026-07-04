import { EpubError, handleResponse, createBlob } from "./core";
import Path from "./path";

// fetch() cannot load the `file:` scheme (WebKit/Fetch spec disallow it), so
// reading a local .epub from a react-native-webview or a file:// deployment
// fails. XMLHttpRequest can read file:// when the host grants file access, so
// we route those requests (and any environment without fetch) through XHR,
// mirroring epubjs's default requester.
function isFileUrl(url: string): boolean {
  return /^file:/i.test(url);
}

function requestXhr(
  url: string,
  type?: string,
  withCredentials?: boolean,
  headers?: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // This is the fallback for file:// URLs and fetch-less runtimes; if the
    // runtime also lacks XMLHttpRequest (e.g. Node without a polyfill), fail
    // clearly instead of throwing a cryptic "XMLHttpRequest is not a constructor".
    if (typeof XMLHttpRequest === "undefined") {
      reject(new EpubError("XMLHttpRequest is unavailable in this environment"));
      return;
    }

    if (signal && signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();

    if (type === "blob") {
      xhr.responseType = "blob";
    } else if (type === "binary") {
      xhr.responseType = "arraybuffer";
    }

    let onAbort: (() => void) | undefined;
    const cleanup = (): void => {
      if (signal && onAbort) {
        signal.removeEventListener("abort", onAbort);
      }
    };
    if (signal) {
      onAbort = (): void => {
        xhr.abort();
      };
      signal.addEventListener("abort", onAbort);
    }

    xhr.onreadystatechange = (): void => {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        return;
      }
      // abort() also drives readyState to DONE with status 0; let onabort
      // reject with AbortError rather than resolving an empty body here.
      if (signal && signal.aborted) {
        return;
      }
      cleanup();

      // file:// requests report status 0 on success; treat that as ok, but
      // only for file: URLs — for other schemes status 0 signals failure.
      const ok =
        (xhr.status >= 200 && xhr.status < 300) ||
        (xhr.status === 0 && isFileUrl(url));
      if (!ok) {
        reject(new EpubError(xhr.statusText || "Network Error", xhr.status));
        return;
      }

      if (type === "blob") {
        const blob = xhr.response as Blob;
        // Re-wrap when the Blob doesn't match the current global (cross-realm).
        resolve(blob instanceof Blob ? blob : createBlob(blob, (blob as Blob).type));
        return;
      }

      if (type === "binary") {
        resolve(xhr.response as ArrayBuffer);
        return;
      }

      // handleResponse can throw (JSON.parse / XML parse); reject rather than
      // letting the exception escape this callback and hang the promise.
      try {
        resolve(handleResponse(xhr.responseText, type));
      } catch (e) {
        reject(e);
      }
    };

    xhr.onerror = (): void => {
      cleanup();
      reject(new EpubError("Network Error", xhr.status || 0));
    };

    xhr.onabort = (): void => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    xhr.open("GET", url, true);

    if (withCredentials) {
      xhr.withCredentials = true;
    }

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }
    }

    if (type === "json") {
      xhr.setRequestHeader("Accept", "application/json");
    }

    xhr.send();
  });
}

async function request(
  url: string,
  type?: string,
  withCredentials?: boolean,
  headers?: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  // If type isn't set, determine it from the file extension
  if (!type) {
    type = new Path(url).extension;
  }

  // fetch can't read file:// (and may be absent in some WebView/embedded
  // runtimes) — fall back to XMLHttpRequest, which can.
  if (typeof fetch === "undefined" || isFileUrl(url)) {
    if (typeof XMLHttpRequest === "undefined") {
      // e.g. the Node build: fetch exists but can't read file: and there is
      // no XHR. Fail with a clear error instead of a ReferenceError.
      throw new EpubError(
        "XMLHttpRequest is unavailable in this environment; pass an ArrayBuffer or Blob instead of a file:// URL.",
        0,
      );
    }
    return requestXhr(url, type, withCredentials, headers, signal);
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

  if (signal) {
    init.signal = signal;
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (e) {
    // Preserve AbortError verbatim so callers can detect intentional cancellation.
    if ((e as Error).name === "AbortError") {
      throw e;
    }
    throw new EpubError((e as Error).message || "Network Error", 0, e);
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
    return blob instanceof Blob ? blob : createBlob(blob, (blob as Blob).type);
  }

  if (type === "binary") {
    return response.arrayBuffer();
  }

  if (type === "json") {
    return response.json();
  }

  const text = await response.text();

  return handleResponse(text, type);
}

export default request;
