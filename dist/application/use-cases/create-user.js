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
            return existingUser;
        }
        return this.userRepository.create(data);
    }
}
exports.CreateUserUseCase = CreateUserUseCase;
