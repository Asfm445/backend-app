import { Request, Response } from "express";
import { UserUseCase } from "../usecase/user_usecase";
// import { In}

export class UserController {
  private userUseCase: UserUseCase;

  constructor(userUseCase: UserUseCase) {
    this.userUseCase = userUseCase;
  }

  register = (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const message = this.userUseCase.register({ name, email, password });
    res.json({ message });
  };

  login = (req: Request, res: Response) => {
    const { email, password } = req.body;
    const message = this.userUseCase.login(email, password);
    res.json({ message });
  };
}
