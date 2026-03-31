/**
 * MirraSync Logger
 * Writes logs to the database (Log table) and console.
 * Usage: logger.info('source', 'message', { optional meta })
 */

const prisma = require('./prisma');

async function writeLog(level, source, message, meta = null) {
  // Always console output
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  const prefix = { info: '📘', warn: '⚠️', error: '❌' }[level] || '📝';
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `${prefix} [${ts}] [${level.toUpperCase()}] [${source}] ${message}${metaStr}`
  );

  // Write to DB (fire-and-forget, don't crash if DB is down)
  try {
    await prisma.log.create({
      data: {
        level,
        source,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        meta: meta || undefined,
      }
    });
  } catch (err) {
    console.error('Failed to write log to DB:', err.message);
  }
}

const logger = {
  info: (source, message, meta) => writeLog('info', source, message, meta),
  warn: (source, message, meta) => writeLog('warn', source, message, meta),
  error: (source, message, meta) => writeLog('error', source, message, meta),
};

module.exports = logger;
