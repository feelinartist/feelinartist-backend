"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const create_user_1 = require("../../application/use-cases/create-user");
const prisma_user_repository_1 = require("../../infrastructure/repositories/prisma-user-repository");
const userRepository = new prisma_user_repository_1.PrismaUserRepository();
const createUserUseCase = new create_user_1.CreateUserUseCase(userRepository);
class AuthController {
    async login(req, res) {
        try {
            const { email, name, image } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }
            // In a real scenario, we would verify the Google token here.
            // For now, we trust the NextAuth session data sent from frontend.
            const user = await createUserUseCase.execute({ email });
            return res.status(200).json(user);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.AuthController = AuthController;
