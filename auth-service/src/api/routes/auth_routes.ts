import { Router } from "express";
import { UserController } from "../controllers/user_controller";

export const createAuthRouter = (userController: UserController) => {
    const router = Router();

    /**
     * @swagger
     * tags:
     *   name: Auth
     *   description: Authentication endpoints
     */

    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - email
     *               - password
     *             properties:
     *               name:
     *                 type: string
     *                 minLength: 2
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 minLength: 6
     *     responses:
     *       201:
     *         description: User registered successfully
     *       400:
     *         description: Validation error
     */
    router.post("/register", userController.register);

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Login user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Login successful
     *       400:
     *         description: Validation error or invalid credentials
     */
    router.post("/login", userController.login);

    /**
     * @swagger
     * /auth/refresh:
     *   post:
     *     summary: Refresh access token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - refreshToken
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Tokens refreshed successfully
     *       400:
     *         description: Invalid or missing refresh token
     */
    router.post("/refresh", userController.refreshToken);

    /**
     * @swagger
     * /auth/verify:
     *   post:
     *     summary: Verify access token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - token
     *             properties:
     *               token:
     *                 type: string
     *     responses:
     *       200:
     *         description: Token is valid
     *       401:
     *         description: Token is invalid
     */
    router.post("/verify", userController.verify);

    return router;
};
