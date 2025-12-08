import mongoose from "mongoose";
import { ProductRepository, ProductAnalytics } from "../../domain/interfaces/product_repo";
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

  // Aggregation for analytics/stats
  async aggregateStats(
    filter: Partial<Pick<Product, "name" | "category" | "ownerId">> & { minPrice?: number; maxPrice?: number } = {}
  ): Promise<ProductAnalytics> {
    const match: any = {};
    if (filter.name) match.name = { $regex: filter.name, $options: "i" };
    if (filter.category) match.category = filter.category;
    if (filter.ownerId && mongoose.Types.ObjectId.isValid(filter.ownerId)) match.owner = new mongoose.Types.ObjectId(filter.ownerId);

    if (typeof filter.minPrice === "number" || typeof filter.maxPrice === "number") {
      match.price = {};
      if (typeof filter.minPrice === "number") match.price.$gte = filter.minPrice;
      if (typeof filter.maxPrice === "number") match.price.$lte = filter.maxPrice;
      if (Object.keys(match.price).length === 0) delete match.price;
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $facet: {
          generalStats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
              },
            },
          ],
          perCategory: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
                avgPrice: { $avg: "$price" },
              },
            },
            { $project: { _id: 0, category: "$_id", count: 1, avgPrice: 1 } },
            { $sort: { count: -1 } },
          ],
          topOwners: [
            {
              $group: {
                _id: "$owner",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, ownerId: { $toString: "$_id" }, count: 1 } },
          ],
        },
      },
    ];

    const agg = await ProductModel.aggregate(pipeline).exec();
    const result = agg && agg[0] ? agg[0] : { generalStats: [], perCategory: [], topOwners: [] };

    const general = (result.generalStats && result.generalStats[0]) || null;

    return {
      total: general ? general.total : 0,
      avgPrice: general && general.avgPrice !== undefined ? general.avgPrice : null,
      minPrice: general && general.minPrice !== undefined ? general.minPrice : null,
      maxPrice: general && general.maxPrice !== undefined ? general.maxPrice : null,
      perCategory: (result.perCategory || []).map((c: any) => ({
        category: c.category ?? null,
        count: c.count ?? 0,
        avgPrice: c.avgPrice !== undefined ? c.avgPrice : null,
      })),
      topOwners: (result.topOwners || []).map((o: any) => ({
        ownerId: o.ownerId,
        count: o.count ?? 0,
      })),
    };
  }
}