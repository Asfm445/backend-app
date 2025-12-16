import { Request, Response, NextFunction } from "express";
import { ProductUseCase } from "../../usecase/product_usecase";
import { Product } from "../../domain/models/product";
import { enqueueImageJob } from "../queue/imageQueue";

/**
 * @openapi
 * /api/v1/products:
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
 *         description: Paginated products response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       price:
 *                         type: number
 *                       ownerId:
 *                         type: string
 *                       category:
 *                         type: string
 *                       description:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     skip:
 *                       type: integer
 */

/**
 * Product controller
 */
export class ProductController {
  private productUseCase: ProductUseCase;

  constructor(productUseCase: ProductUseCase) {
    this.productUseCase = productUseCase;
  }

  // Create a new product (owner is the authenticated user)
  /**
   * @openapi
   * /api/v1/products:
   *   post:
   *     security:
   *       - BearerAuth: []
   *     summary: Create a new product (authenticated)
   *     tags:
   *       - Products
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - price
   *             properties:
   *               name:
   *                 type: string
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: 'Image file to upload (field name: "image")'
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

      const product: Product = req.body as any;
      product.ownerId = req.user.userId;

      // Coerce numeric fields (Multer puts form fields in req.body as strings)
      if (req.body.price !== undefined) {
        const parsed = Number(req.body.price);
        product.price = Number.isNaN(parsed) ? parsed : parsed;
      }

      // Create product synchronously (no sync image upload)
      const createdProduct = await this.productUseCase.create(product);

      // Enqueue background job to upload image (only if we have an id and a file)
      if (createdProduct.id && req.file && req.file.buffer) {
        try {
          await enqueueImageJob({
            productId: createdProduct.id,
            buffer: req.file.buffer,
            originalName: req.file.originalname,
            folder: "products",
          });
          console.log("Enqueued image job for product:", createdProduct.id);
        } catch (e) {
          console.error("Failed to enqueue image job:", e);
          // Don't fail the request because of enqueue failure.
        }
      }

      res.status(201).json({ id: createdProduct.id });
    } catch (err) {
      next(err);
    }
  }

  // Get product by ID
  /**
   * @openapi
   * /api/v1/products/{id}:
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

  // List all products (returns paginated payload)
  /**
   * @openapi
   * /api/v1/products:
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
   *         description: Paginated products response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       imageUrl:
   *                         type: string
   *                       price:
   *                         type: number
   *                       ownerId:
   *                         type: string
   *                       category:
   *                         type: string
   *                       description:
   *                         type: string
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     skip:
   *                       type: integer
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

      const result = await this.productUseCase.list(
        filter,
        parsedSkip,
        parsedLimit,
        Object.keys(sortObj).length ? sortObj : undefined
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Analytics endpoint - aggregated stats for products
  /**
   * @openapi
   * /api/v1/products/analytics:
   *   get:
   *     security:
   *       - BearerAuth: []
   *     summary: Get aggregated product analytics (admin)
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
   *     responses:
   *       "200":
   *         description: Analytics result
   */
  async analytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });

      const { name, category, minPrice, maxPrice } = req.query as Record<string, string | undefined>;

      const filter: any = {};
      if (name) filter.name = String(name);
      if (category) filter.category = String(category);
      if (minPrice !== undefined) filter.minPrice = Number(minPrice);
      if (maxPrice !== undefined) filter.maxPrice = Number(maxPrice);

      const stats = await this.productUseCase.analytics(filter);
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
    // res.status(200).json({"respose":"something"})
  }

  // Update product by ID (must be owner or allowed role)
  /**
   * @openapi
   * /api/v1/products/{id}:
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
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: 'Optional image file to replace current image (field name: "image")'
   *               price:
   *                 type: number
   *               category:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       "200":
   *         description: Product updated successfully
   *       "401":
   *         description: Authentication required
   *       "404":
   *         description: Product not found
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });

      const updates: any = { ...req.body };

      // Coerce numeric fields coming from multipart/form-data
      if (req.body.price !== undefined) {
        const parsed = Number(req.body.price);
        updates.price = Number.isNaN(parsed) ? parsed : parsed;
      }

      const requesterId = req.user.userId;
      // Apply non-image updates immediately
      const updatedProduct = await this.productUseCase.update(req.params.id, updates, requesterId);

      // If there's an uploaded file, enqueue a background job to upload and patch the product
      if (req.file && req.file.buffer) {
        try {
          // req.params.id is a string (route param), so safe to pass
          await enqueueImageJob({
            productId: req.params.id,
            buffer: req.file.buffer,
            originalName: req.file.originalname,
            folder: "products",
          });
          console.log("Enqueued image update job for product:", req.params.id);
        } catch (e) {
          console.error("Failed to enqueue image update job:", e);
        }
      }

      res.status(200).json(updatedProduct);
    } catch (err) {
      next(err);
    }
  }

  // Delete product by ID (must be owner or allowed role)
  /**
   * @openapi
   * /api/v1/products/{id}:
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
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}