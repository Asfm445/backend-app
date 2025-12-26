import { UserUseCase } from "../../usecase/user_usecase";
import { UserRegister } from "../../domain/models/user";

export interface GraphqlContext {
    userUseCase: UserUseCase;
    userId?: string;
    role?: string;
}

export const resolvers = {
    Query: {
        health: () => ({ status: "ok" }),
        me: async (_: any, __: any, context: GraphqlContext) => {
            // In a real app, you'd fetch the user profile here using context.userId
            return null;
        },
    },
    Mutation: {
        register: async (_: any, args: UserRegister, context: GraphqlContext) => {
            return await context.userUseCase.register(args);
        },
        login: async (_: any, { email, password }: any, context: GraphqlContext) => {
            return await context.userUseCase.login(email, password);
        },
        refreshToken: async (_: any, { token }: any, context: GraphqlContext) => {
            return await context.userUseCase.refreshToken(token);
        },
    },
};
