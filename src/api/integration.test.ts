import request from "supertest";
import { app } from "./app";

describe("E2E Integration Tests", () => {
    const API_PREFIX = "/api/v1";
    let adminToken: string;

    const testUser = {
        name: "Admin User",
        email: "admin_e2e@example.com",
        password: "password123"
    };

    // Helper to ensure user exists and is logged in for tests that need it
    const setupAuth = async () => {
        // We attempt to register but ignore "User already exists" if it happens 
        // (though global beforeEach in jest.setup.ts should clear it anyway)
        await request(app).post(`${API_PREFIX}/users`).send(testUser);
        const res = await request(app).post(`${API_PREFIX}/auth/login`).send({
            email: testUser.email,
            password: testUser.password
        });
        return res.body.accessToken;
    };

    describe("User Flow", () => {
        it("should register a new user as superadmin", async () => {
            const res = await request(app)
                .post(`${API_PREFIX}/users`)
                .send({
                    name: "Register Test",
                    email: "register_test@example.com",
                    password: "password123"
                });

            expect(res.status).toBe(201);
            expect(res.body).toBe("User registered successfully!");
        });

        it("should login and return tokens", async () => {
            // Must register first in the SAME test because global beforeEach clears the DB
            await request(app).post(`${API_PREFIX}/users`).send(testUser);

            const res = await request(app)
                .post(`${API_PREFIX}/auth/login`)
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body).toHaveProperty("refreshToken");
        });
    });

    describe("Product Flow", () => {
        let productId: string;

        beforeEach(async () => {
            adminToken = await setupAuth();
        });

        it("should create a product with valid token", async () => {
            const res = await request(app)
                .post(`${API_PREFIX}/products`)
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "E2E Product")
                .field("price", "299.99")
                .field("category", "Gadgets")
                .field("description", "An E2E test product");

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("id");
            productId = res.body.id;
        });

        it("should return 401 when creating product without token", async () => {
            const res = await request(app)
                .post(`${API_PREFIX}/products`)
                .field("name", "Unauthorized Product");

            expect(res.status).toBe(401);
        });

        it("should list products", async () => {
            // Need to create a product first because the DB was cleared before this test
            const createRes = await request(app)
                .post(`${API_PREFIX}/products`)
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "List Test Product")
                .field("price", "100.00");

            const res = await request(app)
                .get(`${API_PREFIX}/products`)
                .query({ name: "List Test Product" });

            expect(res.status).toBe(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it("should get product by ID", async () => {
            // Create product
            const createRes = await request(app)
                .post(`${API_PREFIX}/products`)
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "Get Test Product")
                .field("price", "100.00");
            const tid = createRes.body.id;

            const res = await request(app)
                .get(`${API_PREFIX}/products/${tid}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(tid);
            expect(res.body.name).toBe("Get Test Product");
        });

        it("should return product analytics for admin", async () => {
            const res = await request(app)
                .get(`${API_PREFIX}/products/analytics`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("total");
        });

        it("should delete product", async () => {
            // Create product
            const createRes = await request(app)
                .post(`${API_PREFIX}/products`)
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "Delete Test Product")
                .field("price", "100.00");
            const did = createRes.body.id;

            const res = await request(app)
                .delete(`${API_PREFIX}/products/${did}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(204);
        });
    });
});
