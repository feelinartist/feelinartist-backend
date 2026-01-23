"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserRoleUseCase = void 0;
class UpdateUserRoleUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(email, roleName, artistProfileData, publicProfileData, venueProfileData, username, name) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        return this.userRepository.update(user.id, {
            role: roleName,
            artistProfile: artistProfileData,
            publicProfile: publicProfileData,
            venueProfile: venueProfileData,
            username: username,
            name: name
        });
    }
}
exports.UpdateUserRoleUseCase = UpdateUserRoleUseCase;
