"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaConfigSistemaRepository = void 0;
const client_1 = require("@prisma/client");
const encryption_service_1 = require("../services/encryption-service");
const prisma = new client_1.PrismaClient();
const encryptionService = new encryption_service_1.EncryptionService();
class PrismaConfigSistemaRepository {
    async obtenerTodas() {
        const configs = await prisma.configuracionSistema.findMany({
            orderBy: { clave: 'asc' }
        });
        // Decrypt ALL values (try-catch because some might be plain text)
        return configs.map(config => {
            try {
                return {
                    ...config,
                    valor: encryptionService.decrypt(config.valor)
                };
            }
            catch {
                // If decryption fails, assume it's plain text (e.g. URLs)
                return config;
            }
        });
    }
    async obtenerPorClave(clave) {
        const config = await prisma.configuracionSistema.findUnique({
            where: { clave }
        });
        if (!config)
            return null;
        return {
            ...config,
            valor: encryptionService.decrypt(config.valor)
        };
    }
    async crear(data) {
        // Encrypt ALL values
        const valorEncriptado = encryptionService.encrypt(data.valor);
        return await prisma.configuracionSistema.create({
            data: {
                clave: data.clave,
                valor: valorEncriptado,
                descripcion: data.descripcion,
                creadoPor: data.creadoPor
            }
        });
    }
    async actualizar(id, valor, actualizadoPor) {
        // Encrypt ALL values
        const valorEncriptado = encryptionService.encrypt(valor);
        return await prisma.configuracionSistema.update({
            where: { id },
            data: {
                valor: valorEncriptado,
                actualizadoPor
            }
        });
    }
    async eliminar(id) {
        return await prisma.configuracionSistema.delete({
            where: { id }
        });
    }
    // Helper method to get decrypted value by key (for internal use)
    async obtenerValor(clave) {
        const config = await this.obtenerPorClave(clave);
        return config?.valor || null;
    }
}
exports.PrismaConfigSistemaRepository = PrismaConfigSistemaRepository;
