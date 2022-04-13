const nock = require('nock');
const testHelpers = require('./test-helper');
const request = require('supertest');

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
  const eventToPublish = {
    temperature: 30,
    reason: `Thermostat-temperature ${testHelpers.getShortUnique()}`, // This must be unique
    color: 'Green',
    weight: 80,
    status: 'active',
    category: `category-${testHelpers.getShortUnique()}}`,
  };
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
  const potentiallyExistingEvent = await request(expressApp).get(
    `/sensor-events/${eventToPublish.category}/category`,
  );
  expect(potentiallyExistingEvent).toMatchObject({
    status: 200,
    body: [eventToPublish],
  });
});

// test('When a poisoned message arrives, then it is being rejected back', async () => {
//   // Arrange
//   const messageWithInvalidSchema = { nonExistingProperty: 'invalid❌' };
//   const messageQueueClient = await testHelpers.startMQSubscriber(
//     'fake',
//     'user.deleted',
//   );

//   // Act
//   await messageQueueClient.publish(
//     'user.events',
//     'user.deleted',
//     messageWithInvalidSchema,
//   );

//   // Assert
//   await messageQueueClient.waitFor('nack', 1);
// });

// test('When user deleted message arrives, then all corresponding orders are deleted', async () => {
//   // Arrange
//   const orderToAdd = { userId: 1, productId: 2, status: 'approved' };
//   const addedOrderId = (await axiosAPIClient.post('/order', orderToAdd)).data
//     .id;
//   const messageQueueClient = new MessageQueueClient(
//     new FakeMessageQueueProvider(),
//   );
//   await new QueueSubscriber(messageQueueClient, 'user.deleted').start();

//   // Act
//   await messageQueueClient.publish('user.events', 'user.deleted', {
//     id: addedOrderId,
//   });

//   // Assert
//   await messageQueueClient.waitFor('ack', 1);
//   const aQueryForDeletedOrder = await axiosAPIClient.get(
//     `/order/${addedOrderId}`,
//   );
//   expect(aQueryForDeletedOrder.status).toBe(404);
// });

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
