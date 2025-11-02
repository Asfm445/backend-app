import debug from "debug";

export const httpDebug = debug("app:http");
export const appDebug = debug("app:app");

/**
 * Small convenience wrapper. Use DEBUG=app:* to enable debug output.
 */
export const log = {
  info: (...args: any[]) => appDebug(args.join(" ")),
  error: (...args: any[]) => appDebug("ERROR", ...args),
  debug: (...args: any[]) => appDebug("DEBUG", ...args),
};