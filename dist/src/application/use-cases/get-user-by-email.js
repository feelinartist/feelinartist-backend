"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserByEmailUseCase = void 0;
class GetUserByEmailUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(email) {
        return this.userRepository.findByEmail(email);
    }
}
exports.GetUserByEmailUseCase = GetUserByEmailUseCase;
