import { Product } from "../domain/models/product";
import { ProductRepository, ProductAnalytics } from "../domain/interfaces/product_repo";
import { BadRequestError, NotFoundError } from "../domain/interfaces/Exceptions";

export type PaginatedProducts = {
  data: Product[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
  };
};

export class ProductUseCase {
  private repo: ProductRepository;

  constructor(repo: ProductRepository) {
    this.repo = repo;
  }

  // Create a new product (validates minimal fields)
  async create(product: Product): Promise<Product> {
    if (!product.name || !product.name.trim()) {
      throw new BadRequestError("Product name is required");
    }
    if (typeof product.price !== "number" || Number.isNaN(product.price) || product.price < 0) {
      throw new BadRequestError("Product price must be a non-negative number");
    }
    if (!product.ownerId) {
      throw new BadRequestError("ownerId is required");
    }

    const created = await this.repo.create(product);
    return created;
  }

  // Get product by id
  async getById(id: string): Promise<Product> {
    const p = await this.repo.findById(id);
    if (!p) throw new NotFoundError("Product not found");
    return p;
  }

  // List products with optional filters/pagination/sort (adds price range)
  // Now returns paginated result
  async list(
    filter?: Partial<Pick<Product, "name" | "category">> & { minPrice?: number; maxPrice?: number },
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<PaginatedProducts> {
    // basic validation of pagination
    if (skip < 0) throw new BadRequestError("skip must be >= 0");
    if (limit <= 0) throw new BadRequestError("limit must be > 0");

    const [data, total] = await Promise.all([
      this.repo.findAll(filter, skip, limit, sort),
      this.repo.count(filter as any),
    ]);

    return {
      data,
      pagination: {
        total,
        limit,
        skip,
      },
    };
  }

  // Update product (optionally enforce owner check by passing requesterId)
  async update(id: string, updates: Partial<Product>, requesterId?: string): Promise<Product> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Product not found");

    if (requesterId && existing.ownerId !== requesterId) {
      throw new BadRequestError("Not permitted to update this product");
    }

    // Basic validation if price or name provided
    if (updates.name !== undefined && !updates.name?.trim()) {
      throw new BadRequestError("Product name cannot be empty");
    }
    if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price < 0)) {
      throw new BadRequestError("Product price must be a non-negative number");
    }

    const updated = await this.repo.update(id, updates);
    if (!updated) throw new NotFoundError("Product not found after update");
    return updated;
  }

  // Delete product (optionally enforce owner check by passing requesterId)
  async delete(id: string, requesterId?: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Product not found");

    if (requesterId && existing.ownerId !== requesterId) {
      throw new BadRequestError("Not permitted to delete this product");
    }

    await this.repo.delete(id);
  }

  // Count products matching optional filter
  async count(filter?: Partial<Pick<Product, "name" | "category" | "ownerId">>): Promise<number> {
    return this.repo.count(filter);
  }

  // Analytics / aggregated statistics
  async analytics(
    filter?: Partial<Pick<Product, "name" | "category" | "ownerId">> & { minPrice?: number; maxPrice?: number }
  ): Promise<ProductAnalytics> {
    if (!this.repo.aggregateStats) {
      // repository doesn't implement aggregation, fall back to basic computations
      const total = await this.repo.count(filter as any);
      return {
        total,
        avgPrice: null,
        minPrice: null,
        maxPrice: null,
        perCategory: [],
        topOwners: [],
      };
    }
    return this.repo.aggregateStats(filter as any);
  }
}