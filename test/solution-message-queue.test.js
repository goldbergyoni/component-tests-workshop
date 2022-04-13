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

beforeAll(async (done) => {
  expressApp = await startWebServer();
  done();
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

test('Whenever a new sensor event arrives, then its saved successfully', async () => {
  // Arrange
  const eventToPublish = testHelpers.getSensorEvent({
    category: `category-${testHelpers.getShortUnique()}`,
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
  const potentiallyExistingEvent = await request(expressApp).get(
    `/sensor-events/${eventToPublish.category}/category`,
  );
  expect(potentiallyExistingEvent).toMatchObject({
    status: 200,
    body: [eventToPublish],
  });
});

test('Whenever an invalid events arrives, then its NOT saved and rejected', async () => {
  // Arrange
  const invalidEvent = testHelpers.getSensorEvent({
    category: `category-${testHelpers.getShortUnique()}`,
    temperature: undefined,
  });
  const messageQueueClient = await testHelpers.startMQSubscriber(
    'fake',
    'events.new',
  );

  // Act
  await messageQueueClient.publish('sensor.events', 'events.new', invalidEvent);

  // Assert
  await messageQueueClient.waitFor('nack', 1);
  const potentiallyExistingEvent = await request(expressApp).get(
    `/sensor-events/${invalidEvent.category}/category`,
  );
  expect(potentiallyExistingEvent).toMatchObject({ body: [] });
});

test('When a new event is posted via API, then a message is put in the analytics queue', async () => {
  // Arrange
  const eventToAdd = testHelpers.getSensorEvent();
  const spyOnSendMessage = sinon.spy(MessageQueueClient.prototype, 'publish');

  // Act
  await request(expressApp).post('/sensor-events').send(eventToAdd);

  // Assert
  expect(spyOnSendMessage.lastCall.args).toMatchObject([
    'analytics.events',
    'analytics.new',
    eventToAdd,
  ]);
});

// // ️️️✅ Best Practice: Verify that messages are put in queue whenever the requirements state so
// test('When a valid order is added, then a message is emitted to the new-order queue', async () => {
//   //Arrange
//   const orderToAdd = {
//     userId: 1,
//     productId: 2,
//     mode: 'approved',
//   };
//   const spyOnSendMessage = sinon.spy(MessageQueueClient.prototype, 'publish');

//   //Act
//   await axiosAPIClient.post('/order', orderToAdd);

//   // Assert
//   expect(spyOnSendMessage.lastCall.args[0]).toBe('order.events');
//   expect(spyOnSendMessage.lastCall.args[1]).toBe('order.events.new');
// });

// test.todo('When an error occurs, then the message is not acknowledged');
// test.todo(
//   'When a new valid user-deletion message is processes, then the message is acknowledged',
// );
// test.todo(
//   'When two identical create-order messages arrives, then the app is idempotent and only one is created',
// );
// test.todo(
//   'When occasional failure occur during message processing , then the error is handled appropriately',
// );
// test.todo(
//   'When multiple user deletion message arrives, then all the user orders are deleted',
// );
// test.todo(
//   'When multiple user deletion message arrives and one fails, then only the failed message is not acknowledged',
// );
