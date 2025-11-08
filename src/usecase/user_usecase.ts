// ...existing code...
import { UserRepository } from "../domain/interfaces/repo";
import { User } from "../domain/models/user";
import { BadRequestError, NotFoundError } from "../domain/interfaces/Exceptions";

export class UserUseCase {
  private repo: UserRepository;

  constructor(repo: UserRepository) {
    this.repo = repo; // injected repository
  }

  // Register new user
  async register(user: User): Promise<string> {
    const existing = await this.repo.find(user.email);

    if (existing) {
      throw new BadRequestError("User already exists");
    }

    await this.repo.insert(user);
    return "User registered successfully!";
  }

  // Login user
  async login(email: string, password: string): Promise<string> {
    const user = await this.repo.find(email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.password !== password) {
      throw new BadRequestError("Invalid password");
    }

    return `Welcome ${user.name}!`;
  }
}
// ...existing code...
