 
const LEVELS = ["error", "warn", "info", "debug"];
const levelFromEnv = String(process.env.LOG_LEVEL || "info").toLowerCase();
const activeLevel = LEVELS.includes(levelFromEnv) ? levelFromEnv : "info";

const shouldLog = (level) =>
  LEVELS.indexOf(level) <= LEVELS.indexOf(activeLevel);

const formatMessage = (level, message) => {
  const ts = new Date().toISOString();
  return `[${level.toUpperCase()}] ${ts} - ${message}`;
};

const log = (level, message, meta) => {
  if (!shouldLog(level)) return;
  const line = formatMessage(level, message);
  if (meta !== undefined && meta !== "") {
    // Keep meta as separate arg for better console inspectability
    // eslint-disable-next-line no-console
    console[level](line, meta);
    return;
  }
  // eslint-disable-next-line no-console
  console[level](line);
};

const logger = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
  debug: (message, meta) => log("debug", message, meta),
};

module.exports = logger;
