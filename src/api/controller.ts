import { Request, Response, NextFunction } from "express";
import { UserUseCase } from "../usecase/user_usecase";

export class UserController {
  private userUseCase: UserUseCase;

  constructor(userUseCase: UserUseCase) {
    this.userUseCase = userUseCase;
  }

  // Register user
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const message = await this.userUseCase.register({ name, email, password });
      res.status(201).json({ message });
    } catch (err) {
      next(err); // pass error to centralized error handler
    }
  };

  // Login user
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const message = await this.userUseCase.login(email, password);
      res.status(200).json({ message });
    } catch (err) {
      next(err);
    }
  };
}
