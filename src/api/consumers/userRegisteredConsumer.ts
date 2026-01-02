import { RabbitMQClient } from "../../Infrastructure/services/rabbitMQ";

export async function initUserRegisteredConsumer() {
    const rabbitMQ = RabbitMQClient.getInstance();

    await rabbitMQ.connect();

    await rabbitMQ.consume(
        "user-exchange",
        "user-registered-queue",
        "user.registered",
        (message) => {
            console.log("------------------------------------------");
            console.log("📢 RECEIVED EVENT: user.registered");
            console.log("User Email:", message.email);
            console.log("User Name:", message.name);
            console.log("Timestamp:", message.timestamp);
            console.log("------------------------------------------");

            // Here you could trigger other actions:
            // - Send welcome email
            // - Create default settings in DB
            // - Log to analytics
        }
    );
}
