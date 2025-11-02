import { User } from "../models/user";
export interface UserRepository {
  insert(user: User): void;
  find(email: string): User | undefined;
}
