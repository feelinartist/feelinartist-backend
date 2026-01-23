"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const update_user_role_1 = require("../../application/use-cases/update-user-role");
const prisma_user_repository_1 = require("../../infrastructure/repositories/prisma-user-repository");
const check_username_availability_1 = require("../../application/use-cases/check-username-availability");
const userRepository = new prisma_user_repository_1.PrismaUserRepository();
const updateUserRoleUseCase = new update_user_role_1.UpdateUserRoleUseCase(userRepository);
const checkUsernameAvailabilityUseCase = new check_username_availability_1.CheckUsernameAvailabilityUseCase(userRepository);
class UserController {
    async updateRole(req, res) {
        try {
            const { email, role, ...profileData } = req.body;
            if (!email || !role) {
                return res.status(400).json({ message: 'Email and role are required' });
            }
            let artistData = undefined;
            let publicData = undefined;
            let venueData = undefined;
            let username = profileData.username;
            let name = undefined;
            if (role === 'ARTISTA') {
                artistData = profileData;
                name = profileData.nickname; // Artist name becomes User name
            }
            else if (role === 'PUBLICO') {
                publicData = profileData;
                name = profileData.name; // Full name becomes User name
            }
            else if (role === 'DISCOTECA') {
                venueData = profileData;
                name = profileData.name; // Venue name becomes User name
            }
            const user = await updateUserRoleUseCase.execute(email, role, artistData, publicData, venueData, username, name);
            return res.status(200).json(user);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async checkUsername(req, res) {
        try {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({ message: 'Username is required' });
            }
            const result = await checkUsernameAvailabilityUseCase.execute(username);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.UserController = UserController;
