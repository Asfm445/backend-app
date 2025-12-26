import { ProductUseCase } from "./product_usecase";
import { ProductRepository, ProductAnalytics } from "../domain/interfaces/product_repo";
import { Product } from "../domain/models/product";
import { BadRequestError, NotFoundError } from "../domain/interfaces/Exceptions";

describe("ProductUseCase", () => {
    let usecase: ProductUseCase;
    let mockRepo: jest.Mocked<ProductRepository>;

    const mockProduct: Product = {
        id: "p1",
        name: "Test Product",
        price: 100,
        ownerId: "u1",
        category: "Electronics",
        description: "A description"
    };

    beforeEach(() => {
        mockRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            aggregateStats: jest.fn(),
        } as unknown as jest.Mocked<ProductRepository>;

        usecase = new ProductUseCase(mockRepo);
    });

    describe("create", () => {
        it("should create a product successfully", async () => {
            mockRepo.create.mockResolvedValue(mockProduct);

            const result = await usecase.create({ ...mockProduct, id: undefined });

            expect(result).toEqual(mockProduct);
            expect(mockRepo.create).toHaveBeenCalled();
        });

        it("should throw BadRequestError if name is missing", async () => {
            await expect(usecase.create({ ...mockProduct, name: "" })).rejects.toThrow(BadRequestError);
        });

        it("should throw BadRequestError if price is negative", async () => {
            await expect(usecase.create({ ...mockProduct, price: -10 })).rejects.toThrow(BadRequestError);
        });

        it("should throw BadRequestError if ownerId is missing", async () => {
            await expect(usecase.create({ ...mockProduct, ownerId: "" })).rejects.toThrow(BadRequestError);
        });
    });

    describe("getById", () => {
        it("should return a product", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);

            const result = await usecase.getById("p1");

            expect(result).toEqual(mockProduct);
            expect(mockRepo.findById).toHaveBeenCalledWith("p1");
        });

        it("should throw NotFoundError if product does not exist", async () => {
            mockRepo.findById.mockResolvedValue(undefined);

            await expect(usecase.getById("unknown")).rejects.toThrow(NotFoundError);
        });
    });

    describe("list", () => {
        it("should return paginated products", async () => {
            mockRepo.findAll.mockResolvedValue([mockProduct]);
            mockRepo.count.mockResolvedValue(1);

            const result = await usecase.list({ category: "Electronics" }, 0, 10);

            expect(result.data).toEqual([mockProduct]);
            expect(result.pagination.total).toBe(1);
            expect(mockRepo.findAll).toHaveBeenCalledWith({ category: "Electronics" }, 0, 10, expect.any(Object));
        });

        it("should throw BadRequestError if skip is negative", async () => {
            await expect(usecase.list({}, -1)).rejects.toThrow(BadRequestError);
        });

        it("should throw BadRequestError if limit is zero or negative", async () => {
            await expect(usecase.list({}, 0, 0)).rejects.toThrow(BadRequestError);
        });
    });

    describe("update", () => {
        it("should update a product successfully", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);
            mockRepo.update.mockResolvedValue({ ...mockProduct, name: "Updated" });

            const result = await usecase.update("p1", { name: "Updated" }, "u1");

            expect(result.name).toBe("Updated");
            expect(mockRepo.update).toHaveBeenCalledWith("p1", { name: "Updated" });
        });

        it("should throw BadRequestError if unauthorized", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);

            await expect(usecase.update("p1", { name: "Updated" }, "u2")).rejects.toThrow(BadRequestError);
        });

        it("should throw BadRequestError if name is empty", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);

            await expect(usecase.update("p1", { name: "" }, "u1")).rejects.toThrow(BadRequestError);
        });

        it("should throw BadRequestError if price is negative", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);

            await expect(usecase.update("p1", { price: -1 }, "u1")).rejects.toThrow(BadRequestError);
        });

        it("should throw NotFoundError if product not found after update", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);
            mockRepo.update.mockResolvedValue(undefined);

            await expect(usecase.update("p1", { name: "Updated" }, "u1")).rejects.toThrow(NotFoundError);
        });
    });

    describe("delete", () => {
        it("should delete a product successfully", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);

            await usecase.delete("p1", "u1");

            expect(mockRepo.delete).toHaveBeenCalledWith("p1");
        });

        it("should throw BadRequestError if unauthorized", async () => {
            mockRepo.findById.mockResolvedValue(mockProduct);

            await expect(usecase.delete("p1", "u2")).rejects.toThrow(BadRequestError);
        });

        it("should throw NotFoundError if product not found", async () => {
            mockRepo.findById.mockResolvedValue(undefined);

            await expect(usecase.delete("unknown", "u1")).rejects.toThrow(NotFoundError);
        });
    });

    describe("count", () => {
        it("should return product count", async () => {
            mockRepo.count.mockResolvedValue(5);

            const result = await usecase.count({ category: "Electronics" });

            expect(result).toBe(5);
            expect(mockRepo.count).toHaveBeenCalledWith({ category: "Electronics" });
        });
    });

    describe("analytics", () => {
        it("should return aggregated stats if supported", async () => {
            const stats: ProductAnalytics = {
                total: 10,
                avgPrice: 50,
                minPrice: 10,
                maxPrice: 90,
                perCategory: [],
                topOwners: []
            };
            (mockRepo.aggregateStats as jest.Mock).mockResolvedValue(stats);

            const result = await usecase.analytics();

            expect(result).toEqual(stats);
            expect(mockRepo.aggregateStats).toHaveBeenCalled();
        });

        it("should return basic stats if aggregateStats is not implemented", async () => {
            const basicRepo = {
                count: jest.fn().mockResolvedValue(10),
            } as unknown as ProductRepository;
            const basicUseCase = new ProductUseCase(basicRepo);

            const result = await basicUseCase.analytics();

            expect(result.total).toBe(10);
            expect(result.avgPrice).toBeNull();
            expect(basicRepo.count).toHaveBeenCalled();
        });
    });
});
