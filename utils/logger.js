const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  if (meta.error && meta.error instanceof Error) {
    logEntry.error = {
      message: meta.error.message,
      stack: isProduction ? undefined : meta.error.stack,
      name: meta.error.name,
    };
    delete meta.error;
  }

  if (Object.keys(meta).length > 0) {
    logEntry.meta = meta;
  }

  return JSON.stringify(logEntry);
};

const shouldLog = (level) => {
  if (isTest) return false;

  if (isProduction) {
    return level !== LOG_LEVELS.DEBUG;
  }

  return true;
};

export const logger = {
  error: (message, meta = {}) => {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;
    console.error(formatMessage(LOG_LEVELS.ERROR, message, meta));
  },

  warn: (message, meta = {}) => {
    if (!shouldLog(LOG_LEVELS.WARN)) return;
    console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
  },

  info: (message, meta = {}) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    console.log(formatMessage(LOG_LEVELS.INFO, message, meta));
  },

  debug: (message, meta = {}) => {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;
    console.log(formatMessage(LOG_LEVELS.DEBUG, message, meta));
  },

  log: (message, meta = {}) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    console.log(formatMessage(LOG_LEVELS.INFO, message, meta));
  },
};

export const logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
};

export const logError = (error, context = {}) => {
  logger.error(error.message || 'Unknown error', {
    ...context,
    error,
    stack: error.stack,
  });
};

export const logAuth = (action, result, meta = {}) => {
  const level = result === 'success' ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
  logger.log(`${action}: ${result}`, { action, result, ...meta });
};

export default logger;
