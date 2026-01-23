"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const prisma_1 = __importDefault(require("../database/prisma"));
class PrismaUserRepository {
    async create(data) {
        const user = await prisma_1.default.user.create({
            data: {
                email: data.email,
                role: data.role ? data.role : undefined,
            },
        });
        return this.mapToEntity(user);
    }
    async findByEmail(email) {
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user)
            return null;
        return this.mapToEntity(user);
    }
    async findById(id) {
        const user = await prisma_1.default.user.findUnique({
            where: { id },
        });
        if (!user)
            return null;
        return this.mapToEntity(user);
    }
    async update(id, data) {
        const user = await prisma_1.default.user.update({
            where: { id },
            data: {
                role: data.role ? data.role : undefined,
            },
        });
        return this.mapToEntity(user);
    }
    mapToEntity(prismaUser) {
        return {
            id: prismaUser.id,
            email: prismaUser.email,
            role: prismaUser.role ? prismaUser.role : null,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt,
        };
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
