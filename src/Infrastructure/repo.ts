import { User } from "../domain/models/user";
import { UserRepository } from "../domain/interfaces/repo";


export class InMemoryUserRepository implements UserRepository {
  private users: User[];

  constructor(users: User[]) {
    this.users = users; // injected dependency
  }

  insert(user: User): void {
    this.users.push(user);
  }

  find(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }
}
