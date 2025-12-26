import { Request, Response, NextFunction } from "express";
import { UserController } from "./controller";
import { UserUseCase } from "../../usecase/user_usecase";
import { ZodError } from "zod";

describe("UserController", () => {
    let controller: UserController;
    let mockUseCase: jest.Mocked<UserUseCase>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockUseCase = {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            loginOrRegisterGoogleUser: jest.fn(),
        } as unknown as jest.Mocked<UserUseCase>;

        controller = new UserController(mockUseCase);
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe("register", () => {
        it("should return 201 on successful registration", async () => {
            mockRequest.body = {
                name: "Test User",
                email: "test@example.com",
                password: "password123"
            };
            mockUseCase.register.mockResolvedValue("User registered successfully!");

            await controller.register(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith("User registered successfully!");
        });

        it("should return 400 on validation error", async () => {
            mockRequest.body = { name: "T" }; // Too short

            await controller.register(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: "Validation failed"
            }));
        });
    });

    describe("login", () => {
        it("should return 200 and tokens on successful login", async () => {
            mockRequest.body = {
                email: "test@example.com",
                password: "password123"
            };
            const tokens = { accessToken: "at", refreshToken: "rt" };
            mockUseCase.login.mockResolvedValue(tokens);

            await controller.login(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(tokens);
        });
    });

    describe("refreshToken", () => {
        it("should return 200 and new tokens", async () => {
            mockRequest.body = { refreshToken: "old-rt-1234567890" };
            const tokens = { accessToken: "new-at", refreshToken: "new-rt" };
            mockUseCase.refreshToken.mockResolvedValue(tokens);

            await controller.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(tokens);
        });
    });
});
