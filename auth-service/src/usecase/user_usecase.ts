// src/usecase/user_usecase.ts
import { UserRepository } from "../domain/interfaces/repo";
import { User, Payload, UserRegister, DecodedPayload } from "../domain/models/user";
import { BadRequestError, NotFoundError } from "../domain/interfaces/Exceptions";
import { IJwtService } from "../domain/interfaces/jwt_service";
import { PasswordHasher } from "../domain/interfaces/password_service";

export class UserUseCase {
    private repo: UserRepository;
    private jwtService: IJwtService;
    private passHasher: PasswordHasher;

    constructor(repo: UserRepository, jwtService: IJwtService, passHasher: PasswordHasher) {
        this.repo = repo;
        this.jwtService = jwtService;
        this.passHasher = passHasher;
    }

    // ✅ Register new user
    async register(user: UserRegister): Promise<string> {
        const existing = await this.repo.find(user.email);

        if (existing) {
            throw new BadRequestError("User already exists");
        }

        let role = "user"

        if (await this.repo.countUsers() == 0) {
            role = "superadmin"
        }
        user.password = await this.passHasher.hash(user.password)

        await this.repo.insert(user, role);
        return "User registered successfully!";
    }

    // ✅ Login user (with JWT)
    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.repo.find(email);

        if (!user) {
            throw new NotFoundError("User not found");
        }

        // 🔐 Compare password using bcrypt
        const isValidPassword = await this.passHasher.compare(password, user.password)
        if (!isValidPassword) {
            throw new BadRequestError("Invalid password");
        }

        // 🎟️ Generate tokens
        console.log(user.role)
        const payload: Payload = { userId: user.id, role: user.role };
        const accessToken = this.jwtService.signAccessToken(payload);
        const refresh = this.jwtService.signRefreshToken(payload);

        const refreshToken = refresh.token

        refresh.token = this.passHasher.hashRefreshToken(refreshToken)

        this.repo.storeToken(refresh)

        return { accessToken, refreshToken };
    }

    // ✅ Refresh token logic
    async refreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // 1️⃣ Verify old refresh token
        const payload = this.jwtService.verifyRefreshToken(oldToken);

        if (!payload || typeof payload === "string" || !payload.id || !payload.userId) {
            throw new BadRequestError("Invalid refresh token");
        }

        // 2️⃣ Check token existence in DB
        const dbToken = await this.repo.findTokenById(payload.id);
        if (!dbToken) {
            throw new BadRequestError("Refresh token not found or already rotated");
        }

        // 3️⃣ Check token expiry
        if (dbToken.expireAt.getTime() <= Date.now()) {
            throw new BadRequestError("Refresh token expired");
        }

        if (dbToken.token != this.passHasher.hashRefreshToken(oldToken)) {
            throw new BadRequestError("Invalid Token");
        }

        // 4️⃣ Delete or invalidate old token (rotation)
        await this.repo.deleteTokenById(dbToken.id);

        // 5️⃣ Generate new access + refresh tokens
        const newpayload: Payload = { userId: dbToken.userId, role: payload.role };
        const accessToken = this.jwtService.signAccessToken(newpayload);
        const refresh = this.jwtService.signRefreshToken(newpayload);

        const refreshToken = refresh.token
        refresh.token = this.passHasher.hashRefreshToken(refreshToken)
        this.repo.storeToken(refresh)


        return { accessToken, refreshToken };
    }
    // 🔹 Google OAuth login/register
    // user_usecase.ts
    async loginOrRegisterGoogleUser(email: string, name: string, googleId: string) {
        let user = await this.repo.findGoogleUserByEmail(email);

        if (!user) {
            // register new Google user
            const role = (await this.repo.countUsers()) === 0 ? "superadmin" : "user";

            await this.repo.insertGoogleUser({
                name,
                email,
                googleId,
                role,
            });

            user = await this.repo.findGoogleUserByEmail(email);
        }
        if (!user) {
            throw new BadRequestError("error")
        }

        // console.log(user.googleId, typeof(user.googleId))

        // generate JWT
        const payload: Payload = { userId: user.id, role: user.role };
        const accessToken = this.jwtService.signAccessToken(payload);
        const refresh = this.jwtService.signRefreshToken(payload);

        const refreshToken = refresh.token;
        refresh.token = this.passHasher.hashRefreshToken(refreshToken);
        // console.log(refresh,refresh.token)
        await this.repo.storeToken(refresh);


        return { accessToken, refreshToken };
    }

    // ✅ Verify access token
    verifyToken(token: string): DecodedPayload | null {
        return this.jwtService.verifyAccessToken(token);
    }
}
