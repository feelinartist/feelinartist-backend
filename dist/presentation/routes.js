"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./controllers/auth-controller");
const user_controller_1 = require("./controllers/user-controller");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
const userController = new user_controller_1.UserController();
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
router.post('/auth/login', (req, res) => authController.login(req, res));
router.patch('/users/role', (req, res) => userController.updateRole(req, res));
// Placeholder routes
router.use('/users', (req, res) => res.json({ message: 'Users route' }));
router.use('/artists', (req, res) => res.json({ message: 'Artists route' }));
router.use('/events', (req, res) => res.json({ message: 'Events route' }));
exports.default = router;
