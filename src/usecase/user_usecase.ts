// ...existing code...
import { UserRepository } from "../domain/interfaces/repo";
import { User } from "../domain/models/user";
import { BadRequestError, NotFoundError } from "../domain/interfaces/Exceptions";

export class UserUseCase {
  private repo: UserRepository;

  constructor(repo: UserRepository) {
    this.repo = repo; // injected repository
  }

  register(user: User): string {
    const existing = this.repo.find(user.email);
    if (existing) {
      throw new BadRequestError("User already exists");
    }
    this.repo.insert(user);
    return "User registered successfully!";
  }

  login(email: string, password: string): string {
    const user = this.repo.find(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    // const t = 6 / 0;
    // if (!Number.isFinite(t)) throw new Error("Division by zero");
    if (user.password !== password) {
      throw new BadRequestError("Invalid password");
    }
    return `Welcome ${user.name}!`;
  }
}
// ...existing code...