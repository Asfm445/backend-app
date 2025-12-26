import { Request, Response, NextFunction } from "express";
import { ProductController } from "./product_controller";
import { ProductUseCase } from "../../usecase/product_usecase";
import { Product } from "../../domain/models/product";

describe("ProductController", () => {
    let controller: ProductController;
    let mockUseCase: jest.Mocked<ProductUseCase>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    const mockProduct: Product = {
        id: "p1",
        name: "Test Product",
        price: 100,
        ownerId: "u1",
        category: "Electronics",
        description: "A description"
    };

    beforeEach(() => {
        mockUseCase = {
            create: jest.fn(),
            getById: jest.fn(),
            list: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            analytics: jest.fn(),
        } as unknown as jest.Mocked<ProductUseCase>;

        controller = new ProductController(mockUseCase);
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe("create", () => {
        it("should return 201 on success", async () => {
            mockRequest.user = { userId: "u1", role: "user" };
            mockRequest.body = { name: "Test", price: "100" };
            mockUseCase.create.mockResolvedValue(mockProduct);

            await controller.create(mockRequest as any, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ id: "p1" });
        });

        it("should return 401 if no user", async () => {
            await controller.create(mockRequest as any, mockResponse as Response, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
    });

    describe("getById", () => {
        it("should return product on success", async () => {
            mockRequest.params = { id: "p1" };
            mockUseCase.getById.mockResolvedValue(mockProduct);

            await controller.getById(mockRequest as any, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockProduct);
        });
    });

    describe("list", () => {
        it("should return paginated products", async () => {
            const paginated = {
                data: [mockProduct],
                pagination: { total: 1, limit: 20, skip: 0 }
            };
            mockRequest.query = {};
            mockUseCase.list.mockResolvedValue(paginated);

            await controller.list(mockRequest as any, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(paginated);
        });
    });

    describe("analytics", () => {
        it("should return analytics", async () => {
            mockRequest.user = { userId: "u1", role: "admin" };
            mockRequest.query = {};
            const stats = { total: 1 } as any;
            mockUseCase.analytics.mockResolvedValue(stats);

            await controller.analytics(mockRequest as any, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(stats);
        });
    });

    describe("delete", () => {
        it("should return 204 on success", async () => {
            mockRequest.user = { userId: "u1", role: "user" };
            mockRequest.params = { id: "p1" };
            mockUseCase.delete.mockResolvedValue(undefined);

            await controller.delete(mockRequest as any, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(204);
        });
    });
});
