import { Request, Response, NextFunction } from "express";
import { ProductUseCase } from "../../usecase/product_usecase";
import { Product } from "../../domain/models/product";
import { BadRequestError } from "../../domain/interfaces/Exceptions";

export class ProductController {
  private productUseCase: ProductUseCase;

  constructor(productUseCase: ProductUseCase) {
    this.productUseCase = productUseCase;
  }

  // Create a new product (owner is the authenticated user)
  /**
   * @openapi
   * /products:
   *   post:
   *     security:
   *       - BearerAuth: []
   *     summary: Create a new product (authenticated)
   *     tags:
   *       - Products
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - price
   *             properties:
   *               name:
   *                 type: string
   *               imageUrl:
   *                 type: string
   *               price:
   *                 type: number
   *               category:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       "201":
   *         description: Product created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: The ID of the created product
   *       "401":
   *         description: Authentication required
   *       "400":
   *         description: Bad request
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });

      const product: Product = req.body;
      product.ownerId = req.user.userId;

      const createdProduct = await this.productUseCase.create(product);
      res.status(201).json({ id: createdProduct.id });
    } catch (err) {
      next(err);
    }
  }

  // Get product by ID
  /**
   * @openapi
   * /products/{id}:
   *   get:
   *     summary: Get a product by ID
   *     tags:
   *       - Products
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the product to retrieve
   *         schema:
   *           type: string
   *     responses:
   *       "200":
   *         description: Product found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 name:
   *                   type: string
   *                 imageUrl:
   *                   type: string
   *                 price:
   *                   type: number
   *                 ownerId:
   *                   type: string
   *                 category:
   *                   type: string
   *                 description:
   *                   type: string
   *       "404":
   *         description: Product not found
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await this.productUseCase.getById(req.params.id);
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  // List all products
  /**
   * @openapi
   * /products:
   *   get:
   *     summary: List all products with filtering, pagination and sorting
   *     tags:
   *       - Products
   *     parameters:
   *       - name: name
   *         in: query
   *         schema:
   *           type: string
   *         description: partial match on product name
   *       - name: category
   *         in: query
   *         schema:
   *           type: string
   *       - name: minPrice
   *         in: query
   *         schema:
   *           type: number
   *       - name: maxPrice
   *         in: query
   *         schema:
   *           type: number
   *       - name: skip
   *         in: query
   *         schema:
   *           type: integer
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *       - name: sort
   *         in: query
   *         schema:
   *           type: string
   *         description: Sort spec, e.g. "price:asc,createdAt:desc"
   *     responses:
   *       "200":
   *         description: A list of products
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        category,
        minPrice,
        maxPrice,
        skip = "0",
        limit = "20",
        sort,
      } = req.query as Record<string, string | undefined>;

      const parsedSkip = Math.max(0, Number(skip) || 0);
      const parsedLimit = Math.max(1, Number(limit) || 20);

      const filter: any = {};
      if (name) filter.name = String(name);
      if (category) filter.category = String(category);
      if (minPrice !== undefined) filter.minPrice = Number(minPrice);
      if (maxPrice !== undefined) filter.maxPrice = Number(maxPrice);

      // parse sort param (format: "field:asc,other:desc")
      const sortObj: Record<string, 1 | -1> = {};
      if (sort) {
        const parts = String(sort).split(",").map((s) => s.trim()).filter(Boolean);
        for (const p of parts) {
          const [field, dir] = p.split(":").map((s) => s.trim());
          sortObj[field] = dir && dir.toLowerCase() === "desc" ? -1 : 1;
        }
      }

      const products = await this.productUseCase.list(
        filter,
        parsedSkip,
        parsedLimit,
        Object.keys(sortObj).length ? sortObj : undefined
      );
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  // Update product by ID (must be owner or allowed role)
  /**
   * @openapi
   * /products/{id}:
   *   put:
   *     security:
   *       - BearerAuth: []
   *     summary: Update a product by ID (authenticated)
   *     tags:
   *       - Products
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the product to update
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               imageUrl:
   *                 type: string
   *               price:
   *                 type: number
   *               category:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       "200":
   *         description: Product updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: The ID of the updated product
   *       "401":
   *         description: Authentication required
   *       "404":
   *         description: Product not found
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });

      const requesterId = req.user.userId;
      const updatedProduct = await this.productUseCase.update(req.params.id, req.body, requesterId);
      res.status(200).json(updatedProduct);
    } catch (err) {
      next(err);
    }
  }

  // Delete product by ID (must be owner or allowed role)
  /**
   * @openapi
   * /products/{id}:
   *   delete:
   *     security:
   *       - BearerAuth: []
   *     summary: Delete a product by ID (authenticated)
   *     tags:
   *       - Products
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the product to delete
   *         schema:
   *           type: string
   *     responses:
   *       "204":
   *         description: Product deleted successfully
   *       "401":
   *         description: Authentication required
   *       "404":
   *         description: Product not found
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });

      const requesterId = req.user.userId;
      await this.productUseCase.delete(req.params.id, requesterId);
      res.status(204).send(); // No content to return on successful deletion
    } catch (err) {
      next(err);
    }
  }
}