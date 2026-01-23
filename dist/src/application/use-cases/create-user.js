"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserUseCase = void 0;
class CreateUserUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(data) {
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            // If user exists but doesn't have name/image, update them
            if ((!existingUser.name && data.name) || (!existingUser.image && data.image)) {
                return this.userRepository.update(existingUser.id, {
                    name: data.name,
                    image: data.image
                });
            }
            return existingUser;
        }
        return this.userRepository.create(data);
    }
}
exports.CreateUserUseCase = CreateUserUseCase;
