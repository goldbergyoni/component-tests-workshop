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

// ✅ TASK: Test that putting a sensor event in the queue, results in a new event in the DB
// 💡 TIP: Use the public API to fetch the event and ensure it exists
test('Whenever a new sensor event arrives, then its retrievable', async () => {
  // Arrange
  const eventToPublish = testHelpers.getSensorEvent({category: `category-${testHelpers.getShortUnique()}`});
  // 💡 TIP: Assign unique value to the category field, so you can query later for this unique event

  const messageQueueClient = await testHelpers.startMQSubscriber(
    'fake',
    'events.new',
  );

  // Act
  // 💡 TIP: The message queue client has a publish function for new messages. This will go into a fake
  // in-memory queue because this is what was instructed on the statement above

  await messageQueueClient.publish(
      'sensor.events',
      'events.new',
      eventToPublish,
  );

  // Assert
  // 💡 TIP: Use waitFor 👇 to ensure the transaction has finished it's the right time to assert
  // Here is the syntax: 'messageQueueClient.waitFor('ack', 1);'
  // 💡 TIP: Verify the expectations here
  await messageQueueClient.waitFor('ack', 1);
  const potentiallyExistingEvent = await request(expressApp).get(
      `/sensor-events/${eventToPublish.category}/category`);
  expect(potentiallyExistingEvent).toMatchObject({
    status: 200,
    body: [eventToPublish],
  });
});

// ✅ TASK: Test that when an invalid event is put in the queue, then its rejected
// 💡 TIP: Assign an invalid value to some field to make the system reject this new event
// 💡 TIP: Use the messageQueueClient.waitFor function to wait for the reject event
test('Whenever an invalid events arrives, then its being rejected', async () => {

});

// ✅ TASK: Test the same scenario like above 👆 (invalid message), only this time ensure that the event was not saved to DB

// ✅ TASK: Test that when adding a new valid event through the API, then a message is put in the analytical queue
// 💡 TIP: The message is published in SensorsEventService.addEvent function, you may note there the publishing details

test('When a new event is posted via API, then a message is put in the analytics queue', async () => {
  // Arrange
  // 💡 TIP: Use your favorite mocking lib to listen to the function MessageQueueClient.publish
  // This is a good way to ensure that the code indeed tried to publish the right thing
  // Act
  // 💡 TIP: Add a valid event using the API. See other missions to learn about how to interact with the API
  // Assert
  // 💡 TIP: Ensure that not only the 'publish' function was called but also with the right params
});
