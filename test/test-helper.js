const {
  FakeMessageQueueProvider,
} = require('../src/libraries/message-queue/fake-mq-provider');
const {
  QueueSubscriber,
} = require('../src/entry-points/sensors-queue-subscriber');
const MessageQueueClient = require('../src/libraries/message-queue/mq-client');
const request = require('supertest');

module.exports.startMQSubscriber = async (
  fakeOrReal,
  queueName,
  deadLetterQueueName = undefined,
  messageQueueClient = undefined,
) => {
  if (!messageQueueClient) {
    const messageQueueProvider =
      fakeOrReal === 'fake' ? new FakeMessageQueueProvider() : amqplib;
    messageQueueClient = new MessageQueueClient(messageQueueProvider);
  }

  await new QueueSubscriber(
    messageQueueClient,
    queueName,
    deadLetterQueueName,
  ).start();

  return messageQueueClient;
};

// This returns a numerical value that is 99.99% unique in a multi-process test runner where the state/DB
// is clean-up at least once a day

function getShortUnique() {
  const now = new Date();
  // We add this weak random just to cover the case where two test started at the very same millisecond
  const aBitOfMoreSalt = Math.ceil(Math.random() * 999);
  return `${process.pid}${aBitOfMoreSalt}${now.getMilliseconds()}`;
}

function getSensorEvent(overrides) {
  const defaultSensorEvent = {
    category: `Home equipment ${getShortUnique()}`,
    temperature: 20,
    reason: `Thermostat-failed-${getShortUnique()}`, // This must be unique
    color: 'Green',
    weight: 80,
    status: 'active',
    notificationCategory: 'default',
  };
  const result = Object.assign(defaultSensorEvent, overrides);

  return result;
}

async function assertSensorEvent(expressApp, id, expected) {
  const response = await request(expressApp).get(`/sensor-events/${id}`);

  expect(response.status).toBe(200);
  expect(JSON.parse(response.text)).toMatchObject(expected);
}

module.exports.getShortUnique = getShortUnique;
module.exports.getSensorEvent = getSensorEvent;
module.exports.assertSensorEvent = assertSensorEvent;
