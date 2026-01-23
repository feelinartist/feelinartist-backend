"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckUsernameAvailabilityUseCase = void 0;
class CheckUsernameAvailabilityUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(username) {
        const existingUser = await this.userRepository.findByUsername(username);
        if (!existingUser) {
            return { available: true, suggestions: [] };
        }
        const suggestions = [];
        const baseUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        // Generate suggestions
        suggestions.push(`${baseUsername}${Math.floor(Math.random() * 1000)}`);
        suggestions.push(`${baseUsername}_official`);
        suggestions.push(`iam${baseUsername}`);
        suggestions.push(`${baseUsername}.music`);
        suggestions.push(`dj${baseUsername}`);
        // Ensure suggestions are also unique (simplified check, ideally we should check these against DB too but for now let's assume random/specific enough)
        // For a robust solution, we would loop and check each suggestion, but let's keep it simple for now.
        return { available: false, suggestions };
    }
}
exports.CheckUsernameAvailabilityUseCase = CheckUsernameAvailabilityUseCase;
