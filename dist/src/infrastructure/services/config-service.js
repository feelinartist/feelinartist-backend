"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = void 0;
const client_1 = require("@prisma/client");
const encryption_service_1 = require("./encryption-service");
const prisma = new client_1.PrismaClient();
const encryptionService = new encryption_service_1.EncryptionService();
class ConfigService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutos
        // Lista explícita de claves que están encriptadas
        this.CLAVES_ENCRIPTADAS = [
            'NEXTAUTH_SECRET',
            'GOOGLE_CLIENT_SECRET',
            'CLOUDINARY_API_SECRET',
            'INTERNAL_API_KEY',
            'SPOTIFY_CLIENT_ID',
            'SPOTIFY_CLIENT_SECRET'
            // ENCRYPTION_KEY se eliminó porque vive en .env
        ];
    }
    /**
     * Obtener una configuración desde la base de datos
     * @param clave - La clave de la configuración
     * @param defaultValue - Valor por defecto si no existe
     * @returns El valor desencriptado de la configuración
     */
    async get(clave, defaultValue) {
        // Verificar cache
        const cached = this.cache.get(clave);
        const expiry = this.cacheExpiry.get(clave);
        if (cached && expiry && Date.now() < expiry) {
            return cached;
        }
        try {
            const config = await prisma.configuracionSistema.findUnique({
                where: { clave }
            });
            if (!config) {
                if (defaultValue !== undefined) {
                    return defaultValue;
                }
                throw new Error(`Configuración '${clave}' no encontrada`);
            }
            let valor = config.valor;
            // Solo intentar desencriptar si la clave está en la lista de encriptadas
            if (this.CLAVES_ENCRIPTADAS.includes(clave)) {
                try {
                    valor = encryptionService.decrypt(config.valor);
                }
                catch (decryptError) {
                    console.error(`Error desencriptando clave '${clave}', usando valor crudo:`, decryptError);
                    // Si falla la desencriptación, usamos el valor original (mejor que crashear)
                }
            }
            else if (config.valor.includes(':') && !config.valor.startsWith('http')) {
                // Retro-compatibilidad: Si tiene ':' y NO parece una URL, intentamos desencriptar
                // por si se nos escapó alguna clave en la lista
                try {
                    valor = encryptionService.decrypt(config.valor);
                }
                catch {
                    // Ignorar error si no existe el archivor, asumimos que era texto plano con ':'
                }
            }
            // Guardar en cache
            this.cache.set(clave, valor);
            this.cacheExpiry.set(clave, Date.now() + this.CACHE_TTL);
            return valor;
        }
        catch (error) {
            console.error(`Error al obtener configuración '${clave}':`, error);
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw error;
        }
    }
    /**
     * Obtener múltiples configuraciones a la vez
     * @param claves - Array de claves a obtener
     * @returns Objeto con las configuraciones
     */
    async getMany(claves) {
        const configs = {};
        for (const clave of claves) {
            try {
                configs[clave] = await this.get(clave);
            }
            catch (error) {
                console.error(`Error al obtener '${clave}':`, error);
            }
        }
        return configs;
    }
    /**
     * Limpiar el cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }
    /**
     * Limpiar una clave específica del cache
     */
    clearCacheKey(clave) {
        this.cache.delete(clave);
        this.cacheExpiry.delete(clave);
    }
    /**
     * Actualizar una configuración
     * @param clave - Clave de la configuración
     * @param valor - Valor a guardar
     * @param descripcion - Descripción opcional
     * @param shouldEncrypt - Si debe encriptar el valor (por defecto true para secretos)
     */
    async set(clave, valor, descripcion, shouldEncrypt = true) {
        // Determinar si debe encriptar basado en el parámetro o si está en la lista
        const debeEncriptar = shouldEncrypt || this.CLAVES_ENCRIPTADAS.includes(clave);
        const valorFinal = debeEncriptar ? encryptionService.encrypt(valor) : valor;
        const existente = await prisma.configuracionSistema.findUnique({
            where: { clave }
        });
        if (existente) {
            await prisma.configuracionSistema.update({
                where: { clave },
                data: { valor: valorFinal }
            });
        }
        else {
            await prisma.configuracionSistema.create({
                data: {
                    clave,
                    valor: valorFinal,
                    descripcion
                }
            });
        }
        // Limpiar cache para esta clave
        this.clearCacheKey(clave);
    }
}
// Exportar una instancia singleton
exports.configService = new ConfigService();
