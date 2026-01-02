import * as amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

export class RabbitMQClient {
    private static instance: RabbitMQClient;
    private connection?: any;
    private channel?: any;

    private constructor() { }

    public static getInstance(): RabbitMQClient {
        if (!RabbitMQClient.instance) {
            RabbitMQClient.instance = new RabbitMQClient();
        }
        return RabbitMQClient.instance;
    }

    async connect() {
        if (this.connection) return;
        const maxRetries = 10;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                this.connection = await amqp.connect(RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                console.log("✅ Connected to RabbitMQ");
                return;
            } catch (error) {
                retryCount++;
                console.error(`❌ RabbitMQ connection attempt ${retryCount} failed. Retrying in 5s...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        throw new Error("Failed to connect to RabbitMQ after multiple attempts");
    }

    async publish(exchange: string, routingKey: string, message: any) {
        if (!this.channel) await this.connect();

        await this.channel!.assertExchange(exchange, 'topic', { durable: true });
        this.channel!.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
        console.log(`Sent message to ${exchange}:${routingKey}`);
    }

    async close() {
        await this.channel?.close();
        await this.connection?.close();
    }
}
