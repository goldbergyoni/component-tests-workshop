// 🏅 Your mission is to create your first integration tests here 💜
// ✅ Whenever you see this icon, there's a TASK for you
// ✅🚀 This symbol represents an advanced task
// 💡 - This is an ADVICE symbol, it will appear nearby most tasks and help you in fulfilling the tasks

const nock = require('nock');
const sinon = require('sinon');
const testHelpers = require('./test-helper');
const request = require('supertest');
const MessageQueueClient = require('../src/libraries/message-queue/mq-client');
const {
  startWebServer,
  stopWebServer,
} = require('../src/entry-points/sensors-api');
const {
  QueueSubscriber,
} = require('../src/entry-points/sensors-queue-subscriber');
const {getShortUnique, getSensorEvent} = require("./test-helper");

let expressApp;

beforeAll(async () => {
  expressApp = await startWebServer();
});

afterAll(async () => {
  await stopWebServer();
});

beforeEach(() => {
  // 📗 Reading exercise: Why is this needed 👇? Read about npm/nock
  nock('http://localhost').get('/notification').reply(200, {
    success: true,
  });
});

// ✅ TASK: Test that putting a sensor event in the queue, results in in a new event in the DB
// 💡 TIP: Use the public API to fetch the event and ensure it exists
test('Whenever a new sensor event arrives, then its retrievable', async () => {
  // Arrange
  const eventToPublish = testHelpers.getSensorEvent({
    category: 'test-category-' + getShortUnique()
  });
  const messageQueueClient = await testHelpers.startMQSubscriber(
    'fake',
    'events.new',
  );

  // Act
  await messageQueueClient.publish(
      'sensor.events',
      'events.new',
      eventToPublish,
  );

  // Assert
  await messageQueueClient.waitFor('ack', 1);

  const getEventResult = await request(expressApp).get(
      `/sensor-events/${eventToPublish.category}/category`,
  );

  expect(getEventResult).toMatchObject({
    status: 200,
    body: [eventToPublish],
  });
});

// ✅ TASK: Test that when an invalid event is put in the queue, then its rejected
// 💡 TIP: Assign an invalid value to some field to make the system reject this new event
// 💡 TIP: Use the messageQueueClient.waitFor function to wait for the reject event

test('Whenever an invalid events arrives, then its being rejected', async () => {
  const eventToPublish = testHelpers.getSensorEvent({
    category: 'test-category-' + getShortUnique(),
    temperature: undefined
  });
  const messageQueueClient = await testHelpers.startMQSubscriber(
      'fake',
      'events.new',
  );

  // Act
  await messageQueueClient.publish(
      'sensor.events',
      'events.new',
      eventToPublish,
  );

  // Assert
  await messageQueueClient.waitFor('nack', 1);

});


// ✅ TASK: Test the same scenario like above 👆 (invalid message), only this time ensure that the event was not saved to DB
test('Whenever an invalid events arrives, then its not saved to DB', async () => {
  const eventToPublish = testHelpers.getSensorEvent({
    category: 'test-category-' + getShortUnique(),
    temperature: undefined
  });
  const messageQueueClient = await testHelpers.startMQSubscriber(
      'fake',
      'events.new',
  );

  // Act
  await messageQueueClient.publish(
      'sensor.events',
      'events.new',
      eventToPublish,
  );

  // Assert
  await messageQueueClient.waitFor('nack', 1);

  const getResult = await request(expressApp).get(
      `/sensor-events/${eventToPublish.category}/category`,
  );

  expect(getResult).toMatchObject({
    status: 200,
    body: [],
  });
});


// ✅ TASK: Test that when adding a new valid event through the API, then a message is put in the analytical queue
// 💡 TIP: The message is published in SensorsEventService.addEvent function, you may note there the publishing details

test('When a new event is posted via API, then a message is put in the analytics queue', async () => {
  // Arrange
  const eventToAdd = getSensorEvent({
    temperature: 80, //💡 TIP: We need high temperature to trigger notification
  });

  const spyOnPublish = sinon.spy(MessageQueueClient.prototype, 'publish');

  // Act
  const addResult = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

  // Assert
  expect(spyOnPublish.lastCall.args).toMatchObject([
    'analytics.events',
    'analytics.new',
    eventToAdd,
  ]);
});
