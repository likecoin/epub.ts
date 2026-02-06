/**
 * Minimal POSIX path utilities for browser use.
 * Replaces the path-webpack dependency.
 */
import type { ParsedPath } from "../types";

function assertPath(path: any): void {
	if (typeof path !== "string") {
		throw new TypeError("Path must be a string. Received " + path);
	}
}

function normalizeStringPosix(path: string, allowAboveRoot: boolean): string {
	var res = "";
	var lastSlash = -1;
	var dots = 0;
	var code;
	for (var i = 0; i <= path.length; ++i) {
		if (i < path.length)
			code = path.charCodeAt(i);
		else if (code === 47)
			break;
		else
			code = 47;
		if (code === 47) {
			if (lastSlash === i - 1 || dots === 1) {
				// NOOP
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (res.length < 2 ||
					res.charCodeAt(res.length - 1) !== 46 ||
					res.charCodeAt(res.length - 2) !== 46) {
					if (res.length > 2) {
						var start = res.length - 1;
						var j = start;
						for (; j >= 0; --j) {
							if (res.charCodeAt(j) === 47)
								break;
						}
						if (j !== start) {
							if (j === -1)
								res = "";
							else
								res = res.slice(0, j);
							lastSlash = i;
							dots = 0;
							continue;
						}
					} else if (res.length === 2 || res.length === 1) {
						res = "";
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0)
						res += "/..";
					else
						res = "..";
				}
			} else {
				if (res.length > 0)
					res += "/" + path.slice(lastSlash + 1, i);
				else
					res = path.slice(lastSlash + 1, i);
			}
			lastSlash = i;
			dots = 0;
		} else if (code === 46 && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
}

export function resolve(..._args: string[]): string {
	var resolvedPath = "";
	var resolvedAbsolute = false;

	for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
		var path;
		if (i >= 0)
			path = arguments[i];
		else {
			path = "/";
		}

		assertPath(path);

		if (path.length === 0) {
			continue;
		}

		resolvedPath = path + "/" + resolvedPath;
		resolvedAbsolute = path.charCodeAt(0) === 47;
	}

	resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

	if (resolvedAbsolute) {
		if (resolvedPath.length > 0)
			return "/" + resolvedPath;
		else
			return "/";
	} else if (resolvedPath.length > 0) {
		return resolvedPath;
	} else {
		return ".";
	}
}

export function relative(from: string, to: string): string {
	assertPath(from);
	assertPath(to);

	if (from === to)
		return "";

	from = resolve(from);
	to = resolve(to);

	if (from === to)
		return "";

	var fromStart = 1;
	for (; fromStart < from.length; ++fromStart) {
		if (from.charCodeAt(fromStart) !== 47)
			break;
	}
	var fromEnd = from.length;
	var fromLen = (fromEnd - fromStart);

	var toStart = 1;
	for (; toStart < to.length; ++toStart) {
		if (to.charCodeAt(toStart) !== 47)
			break;
	}
	var toEnd = to.length;
	var toLen = (toEnd - toStart);

	var length = (fromLen < toLen ? fromLen : toLen);
	var lastCommonSep = -1;
	var i = 0;
	for (; i <= length; ++i) {
		if (i === length) {
			if (toLen > length) {
				if (to.charCodeAt(toStart + i) === 47) {
					return to.slice(toStart + i + 1);
				} else if (i === 0) {
					return to.slice(toStart + i);
				}
			} else if (fromLen > length) {
				if (from.charCodeAt(fromStart + i) === 47) {
					lastCommonSep = i;
				} else if (i === 0) {
					lastCommonSep = 0;
				}
			}
			break;
		}
		var fromCode = from.charCodeAt(fromStart + i);
		var toCode = to.charCodeAt(toStart + i);
		if (fromCode !== toCode)
			break;
		else if (fromCode === 47)
			lastCommonSep = i;
	}

	var out = "";
	for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
		if (i === fromEnd || from.charCodeAt(i) === 47) {
			if (out.length === 0)
				out += "..";
			else
				out += "/..";
		}
	}

	if (out.length > 0)
		return out + to.slice(toStart + lastCommonSep);
	else {
		toStart += lastCommonSep;
		if (to.charCodeAt(toStart) === 47)
			++toStart;
		return to.slice(toStart);
	}
}

export function dirname(path: string): string {
	assertPath(path);
	if (path.length === 0)
		return ".";
	var code = path.charCodeAt(0);
	var hasRoot = (code === 47);
	var end = -1;
	var matchedSlash = true;
	for (var i = path.length - 1; i >= 1; --i) {
		code = path.charCodeAt(i);
		if (code === 47) {
			if (!matchedSlash) {
				end = i;
				break;
			}
		} else {
			matchedSlash = false;
		}
	}

	if (end === -1)
		return hasRoot ? "/" : ".";
	if (hasRoot && end === 1)
		return "//";
	return path.slice(0, end);
}

export function isAbsolute(path: string): boolean {
	assertPath(path);
	return path.length > 0 && path.charCodeAt(0) === 47;
}

export function parse(path: string): ParsedPath {
	assertPath(path);

	var ret = { root: "", dir: "", base: "", ext: "", name: "" };
	if (path.length === 0)
		return ret;
	var code = path.charCodeAt(0);
	var isAbs = (code === 47);
	var start;
	if (isAbs) {
		ret.root = "/";
		start = 1;
	} else {
		start = 0;
	}
	var startDot = -1;
	var startPart = 0;
	var end = -1;
	var matchedSlash = true;
	var i = path.length - 1;
	var preDotState = 0;

	for (; i >= start; --i) {
		code = path.charCodeAt(i);
		if (code === 47) {
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46) {
			if (startDot === -1)
				startDot = i;
			else if (preDotState !== 1)
				preDotState = 1;
		} else if (startDot !== -1) {
			preDotState = -1;
		}
	}

	if (startDot === -1 ||
		end === -1 ||
		preDotState === 0 ||
		(preDotState === 1 &&
			startDot === end - 1 &&
			startDot === startPart + 1)) {
		if (end !== -1) {
			if (startPart === 0 && isAbs)
				ret.base = ret.name = path.slice(1, end);
			else
				ret.base = ret.name = path.slice(startPart, end);
		}
	} else {
		if (startPart === 0 && isAbs) {
			ret.name = path.slice(1, startDot);
			ret.base = path.slice(1, end);
		} else {
			ret.name = path.slice(startPart, startDot);
			ret.base = path.slice(startPart, end);
		}
		ret.ext = path.slice(startDot, end);
	}

	if (startPart > 0)
		ret.dir = path.slice(0, startPart - 1);
	else if (isAbs)
		ret.dir = "/";

	return ret;
}

var pathUtils = { resolve, relative, dirname, isAbsolute, parse };
export default pathUtils;
