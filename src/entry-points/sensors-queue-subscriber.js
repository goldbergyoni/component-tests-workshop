const MessageQueueClient = require('../libraries/message-queue/mq-client');
const { errorHandler, AppError } = require('../error-handling');
const SensorsService = require('../domain/sensors-service');

// This is message queue entry point. Like API routes but for message queues.
class QueueSubscriber {
  constructor(messageQueueClient, queueName, deadLetterQueue) {
    this.messageQueueClient = messageQueueClient;
    this.queueName = queueName;
    this.deadLetterQueue = deadLetterQueue;
  }

  async start() {
    await this.consumeNewSensorEventQueue();
  }

  async consumeNewSensorEventQueue() {
    // Let's now register to new delete messages from the queue
    return await this.messageQueueClient.consume(
      this.queueName,
      async (message) => {
        // Validate to ensure it is not a poisoned message (invalid) that will loop into the queue
        const newMessageAsObject = JSON.parse(message);

        // ️️️✅ Best Practice: Validate incoming MQ messages using your validator framework (simplistic implementation below)
        if (!newMessageAsObject.category) {
          throw new AppError('invalid-message', 'Unknown message schema');
        }

        const sensorsService = new SensorsService();
        const response = await sensorsService.addEvent(newMessageAsObject);
      },
    );
  }
}

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});

module.exports = { QueueSubscriber };
