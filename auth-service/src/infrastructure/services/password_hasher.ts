import bcrypt from "bcrypt";
import { PasswordHasher } from "../../domain/interfaces/password_service";
import crypto from "crypto";

export class BcryptPasswordHasher implements PasswordHasher {
    private readonly saltRounds = 10;

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    async compare(password: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(password, hashed);
    }

    hashRefreshToken(token: string): string {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
}
