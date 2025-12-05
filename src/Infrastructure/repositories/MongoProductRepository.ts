import mongoose from "mongoose";
import { ProductRepository } from "../../domain/interfaces/product_repo";
import { Product } from "../../domain/models/product";
import { ProductModel, DbProduct } from "../models/ProductModel";

export class MongoProductRepository implements ProductRepository {
  private toDomain(doc: DbProduct): Product {
    return {
      id: doc.id,
      name: doc.name,
      imageUrl: doc.imageUrl,
      price: doc.price,
      ownerId: doc.owner.toString(),
      category: doc.category,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(product: Product): Promise<Product> {
    const doc = new ProductModel({
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      owner: new mongoose.Types.ObjectId(product.ownerId),
      category: product.category,
      description: product.description,
    });
    const saved = await doc.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Product | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const doc = await ProductModel.findById(id).exec();
    if (!doc) return undefined;
    return this.toDomain(doc);
  }

  async findAll(
    filter: Partial<Pick<Product, "name" | "category" | "ownerId">> & { minPrice?: number; maxPrice?: number } = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<Product[]> {
    const q: any = {};
    if (filter.name) q.name = { $regex: filter.name, $options: "i" };
    if (filter.category) q.category = filter.category;
    if (filter.ownerId && mongoose.Types.ObjectId.isValid(filter.ownerId)) q.owner = new mongoose.Types.ObjectId(filter.ownerId);

    // price range
    if (typeof filter.minPrice === "number" || typeof filter.maxPrice === "number") {
      q.price = {};
      if (typeof filter.minPrice === "number") q.price.$gte = filter.minPrice;
      if (typeof filter.maxPrice === "number") q.price.$lte = filter.maxPrice;
      // if price ended up empty object, delete
      if (Object.keys(q.price).length === 0) delete q.price;
    }

    const docs = await ProductModel.find(q).skip(skip).limit(limit).sort(sort).exec();
    return docs.map((d: DbProduct) => this.toDomain(d));
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;

    const up: any = { ...updates };
    if (updates.ownerId) up.owner = new mongoose.Types.ObjectId(updates.ownerId);
    delete up.id;

    const doc = await ProductModel.findByIdAndUpdate(id, up, { new: true }).exec();
    if (!doc) return undefined;
    return this.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await ProductModel.deleteOne({ _id: id }).exec();
  }

  async count(filter: Partial<Pick<Product, "name" | "category" | "ownerId">> & { minPrice?: number; maxPrice?: number } = {}): Promise<number> {
    const q: any = {};
    if (filter.name) q.name = { $regex: filter.name, $options: "i" };
    if (filter.category) q.category = filter.category;
    if (filter.ownerId && mongoose.Types.ObjectId.isValid(filter.ownerId)) q.owner = new mongoose.Types.ObjectId(filter.ownerId);

    if (typeof filter.minPrice === "number" || typeof filter.maxPrice === "number") {
      q.price = {};
      if (typeof filter.minPrice === "number") q.price.$gte = filter.minPrice;
      if (typeof filter.maxPrice === "number") q.price.$lte = filter.maxPrice;
      if (Object.keys(q.price).length === 0) delete q.price;
    }

    return ProductModel.countDocuments(q).exec();
  }
}