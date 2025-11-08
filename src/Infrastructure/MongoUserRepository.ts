import { UserRepository } from "../domain/interfaces/repo";
import { UserModel, DbUser } from "../Infrastructure/models/UserModel";
import { User } from "../domain/models/user";

export class MongoUserRepository implements UserRepository {
  async insert(user: User): Promise<void> {
    try {
      // Convert domain model → DB model
      const newUser = new UserModel({
        name: user.name,
        email: user.email,
        password: user.password,
      });
      await newUser.save(); // triggers validation
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
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
    };

    return user;
  }
}
