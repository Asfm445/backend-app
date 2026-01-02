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

    async consume(exchange: string, queue: string, routingKey: string, onMessage: (msg: any) => void) {
        if (!this.channel) await this.connect();

        await this.channel!.assertExchange(exchange, 'topic', { durable: true });
        const q = await this.channel!.assertQueue(queue, { durable: true });

        await this.channel!.bindQueue(q.queue, exchange, routingKey);

        this.channel!.consume(q.queue, (msg: any) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                onMessage(content);
                this.channel!.ack(msg);
            }
        });
        console.log(`Started consuming from ${queue}`);
    }

    async close() {
        await this.channel?.close();
        await this.connection?.close();
    }
}
