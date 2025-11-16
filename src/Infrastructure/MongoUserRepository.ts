import { UserRepository } from "../domain/interfaces/repo";
import { UserModel, DbUser } from "../Infrastructure/models/UserModel";
import { User, Token, UserRegister, GoogleUserInput,GoogleUser } from "../domain/models/user";
import { TokenModel } from "../Infrastructure/models/token_model";
import { GoogleUserModel, DbGoogleUser } from "./models/GoogleUserModel";
import mongoose from "mongoose";

export class MongoUserRepository implements UserRepository {
  async insert(user: UserRegister, role: string): Promise<void> {
    try {
      // Convert domain model → DB model

      const newUser = new UserModel({
        name: user.name,
        email: user.email,
        password: user.password,
        role:role,
      });
      await newUser.save();
    } catch (err: any) {
      if (err.name === "ValidationError") {
        throw new Error(`User validation failed: ${err.message}`);
      }
      if (err.code === 11000) {
        throw new Error("Email already exists");
      }
      throw err;
    }
  }

  async find(email: string): Promise<User | undefined> {
    const dbUser = await UserModel.findOne({ email }).exec();
    if (!dbUser) return undefined;

    // Convert DB model → domain model
    const user: User = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      role: dbUser.role,
    };

    return user;
  }

    // ✅ New method: store refresh token
    async storeToken(token: Token): Promise<void> {
    // Save the token in TokenModel only
    const tokenDoc = new TokenModel({
      id: token.id,
      user_id: new mongoose.Types.ObjectId(token.userId),
      token: token.token,
      createdAt: token.createdAt || new Date(),
      expireAt: token.expireAt,
    });

    await tokenDoc.save(); // only store token document
  }


  // Inside MongoUserRepository
  async countUsers(): Promise<number> {
    try {
      const count = await UserModel.countDocuments().exec();
      return count;
    } catch (err) {
      throw new Error(`Failed to count users: ${err}`);
    }
  }

  async findTokenById(id: string): Promise<Token | undefined> {
    const tokenDoc = await TokenModel.findOne({ id }).exec();
    if (!tokenDoc) return undefined;

    const token: Token = {
      id: tokenDoc.id,
      userId: tokenDoc.user_id.toString(),
      token: tokenDoc.token,
      createdAt: tokenDoc.createdAt,
      expireAt: tokenDoc.expireAt,
    };

    return token;
  }

  async deleteTokenById(id: string): Promise<void> {
    await TokenModel.deleteOne({ id }).exec();
  }
async insertGoogleUser(user: GoogleUserInput): Promise<void> {
    const role = user.role || "user";
    const newUser = new GoogleUserModel({ ...user, role });
    await newUser.save();
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleUser | undefined> {
    const goolgleUser=await GoogleUserModel.findOne({ email }).exec();
    if (!goolgleUser) return undefined;


    const user: GoogleUser={
      name: goolgleUser.name,
      email: goolgleUser.email,
      googleId: goolgleUser.googleId,
      role: goolgleUser.role,
      id:goolgleUser.id

    }
    return user
  }

  async findGoogleUserById(googleId: string) {
    return GoogleUserModel.findOne({ googleId }).exec();
  }
}

