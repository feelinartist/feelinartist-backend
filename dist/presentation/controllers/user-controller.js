"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const update_user_role_1 = require("../../application/use-cases/update-user-role");
const prisma_user_repository_1 = require("../../infrastructure/repositories/prisma-user-repository");
const user_1 = require("../../domain/entities/user");
const userRepository = new prisma_user_repository_1.PrismaUserRepository();
const updateUserRoleUseCase = new update_user_role_1.UpdateUserRoleUseCase(userRepository);
class UserController {
    async updateRole(req, res) {
        try {
            const { email, role } = req.body;
            if (!email || !role) {
                return res.status(400).json({ message: 'Email and role are required' });
            }
            if (!Object.values(user_1.Role).includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }
            const user = await updateUserRoleUseCase.execute(email, role);
            return res.status(200).json(user);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.UserController = UserController;
