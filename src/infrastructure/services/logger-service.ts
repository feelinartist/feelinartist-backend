import winston from 'winston';

const { createLogger, format, transports } = winston;
const { combine, timestamp, json, colorize, printf } = format;

// Formato personalizado para desarrollo
const devFormat = printf(({ level, message, timestamp, context }) => {
    const contextStr = context ? ` [${context}]` : '';
    return `${timestamp} ${level}:${contextStr} ${message}`;
});

const isProduction = process.env.NODE_ENV === 'production';

export const logger = createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        isProduction ? json() : combine(colorize(), devFormat)
    ),
    transports: [
        new transports.Console()
    ]
});

// Wrapper de la clase LoggerService para NestJS e infraestructura
export class LoggerService {
    private readonly context?: string;

    constructor(context?: string) {
        this.context = context;
    }

    log(message: string, context?: string) {
        logger.info(message, { context: context || this.context });
    }

    error(message: string, trace?: string, context?: string) {
        logger.error(message, { trace, context: context || this.context });
    }

    warn(message: string, context?: string) {
        logger.warn(message, { context: context || this.context });
    }

    debug(message: string, context?: string) {
        logger.debug(message, { context: context || this.context });
    }
}
