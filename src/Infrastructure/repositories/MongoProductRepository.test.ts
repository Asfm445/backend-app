import mongoose from "mongoose";
import { MongoProductRepository } from "./MongoProductRepository";
import { ProductModel } from "../models/ProductModel";
import { Product } from "../../domain/models/product";

jest.mock("../models/ProductModel");

describe("MongoProductRepository", () => {
    let repo: MongoProductRepository;
    const mockProduct: Product = {
        id: "60d5ecb8b392d40015f8e5d1",
        name: "Test Product",
        price: 100,
        imageUrl: "http://example.com/image.jpg",
        ownerId: "60d5ecb8b392d40015f8e5d2",
        category: "Electronics",
        description: "A test product",
    };

    beforeEach(() => {
        repo = new MongoProductRepository();
        jest.clearAllMocks();
    });

    describe("create", () => {
        it("should create and return a product", async () => {
            const saveMock = jest.fn().mockResolvedValue({
                ...mockProduct,
                id: mockProduct.id,
                owner: new mongoose.Types.ObjectId(mockProduct.ownerId),
                toObject: jest.fn().mockReturnValue(mockProduct),
            });

            (ProductModel as unknown as jest.Mock).mockImplementation(() => ({
                save: saveMock,
            }));

            const result = await repo.create(mockProduct);

            expect(ProductModel).toHaveBeenCalledWith(expect.objectContaining({
                name: mockProduct.name,
                price: mockProduct.price,
            }));
            expect(saveMock).toHaveBeenCalled();
            expect(result.name).toBe(mockProduct.name);
        });
    });

    describe("findById", () => {
        it("should return a product if found", async () => {
            const mockDoc = {
                ...mockProduct,
                id: mockProduct.id,
                owner: new mongoose.Types.ObjectId(mockProduct.ownerId),
                exec: jest.fn().mockResolvedValue({
                    id: mockProduct.id,
                    name: mockProduct.name,
                    price: mockProduct.price,
                    owner: new mongoose.Types.ObjectId(mockProduct.ownerId),
                    category: mockProduct.category,
                    description: mockProduct.description,
                    imageUrl: mockProduct.imageUrl,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            };

            (ProductModel.findById as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDoc),
            });

            const result = await repo.findById(mockProduct.id!);

            expect(ProductModel.findById).toHaveBeenCalledWith(mockProduct.id);
            expect(result?.name).toBe(mockProduct.name);
        });

        it("should return undefined if not found", async () => {
            (ProductModel.findById as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await repo.findById(mockProduct.id!);
            expect(result).toBeUndefined();
        });
    });

    describe("findAll", () => {
        it("should return a list of products", async () => {
            const mockDocs = [
                {
                    id: "1",
                    name: "P1",
                    price: 10,
                    owner: new mongoose.Types.ObjectId(),
                    toObject: jest.fn(),
                },
            ];

            (ProductModel.find as jest.Mock).mockReturnValue({
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockDocs),
            });

            const result = await repo.findAll();
            expect(result.length).toBe(1);
            expect(ProductModel.find).toHaveBeenCalledWith({});
        });
    });

    describe("update", () => {
        it("should update and return the product", async () => {
            const updatedDoc = {
                ...mockProduct,
                name: "Updated Name",
                owner: new mongoose.Types.ObjectId(mockProduct.ownerId),
            };

            (ProductModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedDoc),
            });

            const result = await repo.update(mockProduct.id!, { name: "Updated Name" });
            expect(result?.name).toBe("Updated Name");
        });
    });

    describe("delete", () => {
        it("should delete the product", async () => {
            (ProductModel.deleteOne as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            });

            await repo.delete(mockProduct.id!);
            expect(ProductModel.deleteOne).toHaveBeenCalledWith({ _id: mockProduct.id });
        });
    });

    describe("count", () => {
        it("should return the count of products", async () => {
            (ProductModel.countDocuments as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(5),
            });

            const result = await repo.count();
            expect(result).toBe(5);
        });
    });

    describe("aggregateStats", () => {
        it("should return aggregated stats", async () => {
            const mockAggResult = [{
                generalStats: [{ total: 10, avgPrice: 50, minPrice: 10, maxPrice: 90 }],
                perCategory: [{ category: "C1", count: 5, avgPrice: 40 }],
                topOwners: [{ _id: new mongoose.Types.ObjectId(), count: 3 }],
            }];

            (ProductModel.aggregate as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAggResult),
            });

            const result = await repo.aggregateStats();
            expect(result.total).toBe(10);
            expect(result.perCategory[0].category).toBe("C1");
        });
    });
});
