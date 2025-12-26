import mongoose from "mongoose";
import { MongoUserRepository } from "./MongoUserRepository";
import { UserModel } from "../models/UserModel";
import { TokenModel } from "../models/token_model";
import { GoogleUserModel } from "../models/GoogleUserModel";
import { User, Token, UserRegister, GoogleUserInput } from "../../domain/models/user";

jest.mock("../models/UserModel");
jest.mock("../models/token_model");
jest.mock("../models/GoogleUserModel");

describe("MongoUserRepository", () => {
    let repo: MongoUserRepository;

    beforeEach(() => {
        repo = new MongoUserRepository();
        jest.clearAllMocks();
    });

    describe("insert", () => {
        it("should insert a new user", async () => {
            const user: UserRegister = { name: "Test", email: "test@test.com", password: "password" };
            const saveMock = jest.fn().mockResolvedValue({});

            (UserModel as unknown as jest.Mock).mockImplementation(() => ({
                save: saveMock,
            }));

            await repo.insert(user, "user");

            expect(UserModel).toHaveBeenCalledWith(expect.objectContaining({
                email: user.email,
                role: "user",
            }));
            expect(saveMock).toHaveBeenCalled();
        });

        it("should throw error if email exists", async () => {
            const user: UserRegister = { name: "Test", email: "test@test.com", password: "password" };
            const saveMock = jest.fn().mockRejectedValue({ code: 11000 });

            (UserModel as unknown as jest.Mock).mockImplementation(() => ({
                save: saveMock,
            }));

            await expect(repo.insert(user, "user")).rejects.toThrow("Email already exists");
        });
    });

    describe("find", () => {
        it("should return a user if found", async () => {
            const mockDoc = {
                id: "123",
                name: "Test",
                email: "test@test.com",
                password: "hashed",
                role: "user",
            };

            (UserModel.findOne as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDoc),
            });

            const result = await repo.find("test@test.com");
            expect(result?.email).toBe("test@test.com");
        });
    });

    describe("storeToken", () => {
        it("should store a token", async () => {
            const token: Token = { id: "t1", userId: "60d5ecb8b392d40015f8e5d1", token: "secret", expireAt: new Date() };
            const saveMock = jest.fn().mockResolvedValue({});

            (TokenModel as unknown as jest.Mock).mockImplementation(() => ({
                save: saveMock,
            }));

            await repo.storeToken(token);
            expect(TokenModel).toHaveBeenCalled();
            expect(saveMock).toHaveBeenCalled();
        });
    });

    describe("countUsers", () => {
        it("should return the user count", async () => {
            (UserModel.countDocuments as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(10),
            });

            const result = await repo.countUsers();
            expect(result).toBe(10);
        });
    });

    describe("findTokenById", () => {
        it("should return a token if found", async () => {
            const mockTokenDoc = {
                id: "t1",
                user_id: new mongoose.Types.ObjectId(),
                token: "secret",
                createdAt: new Date(),
                expireAt: new Date(),
            };

            (TokenModel.findOne as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockTokenDoc),
            });

            const result = await repo.findTokenById("t1");
            expect(result?.token).toBe("secret");
        });
    });

    describe("deleteTokenById", () => {
        it("should delete the token", async () => {
            (TokenModel.deleteOne as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            });

            await repo.deleteTokenById("t1");
            expect(TokenModel.deleteOne).toHaveBeenCalledWith({ id: "t1" });
        });
    });

    describe("insertGoogleUser", () => {
        it("should insert a google user", async () => {
            const googleUser: GoogleUserInput = { name: "G", email: "g@g.com", googleId: "g123", role: "user" };
            const saveMock = jest.fn().mockResolvedValue({});

            (GoogleUserModel as unknown as jest.Mock).mockImplementation(() => ({
                save: saveMock,
            }));

            await repo.insertGoogleUser(googleUser);
            expect(GoogleUserModel).toHaveBeenCalled();
            expect(saveMock).toHaveBeenCalled();
        });
    });

    describe("findGoogleUserByEmail", () => {
        it("should return a google user if found", async () => {
            const mockDoc = { id: "1", name: "G", email: "g@g.com", googleId: "g123", role: "user" };

            (GoogleUserModel.findOne as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDoc),
            });

            const result = await repo.findGoogleUserByEmail("g@g.com");
            expect(result?.email).toBe("g@g.com");
        });
    });
});
