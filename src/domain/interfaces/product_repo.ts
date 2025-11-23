import { Product } from "../models/product";

export interface ProductRepository {
  create(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | undefined>;
  // allow price range filtering and text/category/owner filters
  findAll(
    filter?: Partial<Pick<Product, "name" | "category" | "ownerId">> & {
      minPrice?: number;
      maxPrice?: number;
    },
    skip?: number,
    limit?: number,
    sort?: Record<string, 1 | -1>
  ): Promise<Product[]>;
  update(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  delete(id: string): Promise<void>;
  count(filter?: Partial<Pick<Product, "name" | "category" | "ownerId">> & { minPrice?: number; maxPrice?: number }): Promise<number>;
}