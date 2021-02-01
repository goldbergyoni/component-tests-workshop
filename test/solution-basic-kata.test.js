const request = require('supertest');
const nock = require('nock');
const {
  startWebServer,
  stopWebServer,
} = require('../src/entry-points/sensors-api');
const { getShortUnique, getSensorEvent } = require('./test-helper');

let expressApp;

beforeAll(async (done) => {
  expressApp = await startWebServer();
  done();
});

afterAll(async () => {
  await stopWebServer();
});

beforeEach(() => {
  nock('http://localhost')
    .post('/notification/default')
    .reply(200, {
      success: true,
    })
    .persist();
});

afterEach(() => {
  nock.cleanAll();
});

test('When category is not specified, should get http 400 error', async () => {
  // Arrange
  const eventToAdd = {
    temperature: 20,
    name: 'Thermostat-temperature', // This must be unique
    color: 'Green',
    weight: 80,
    status: 'active',
    // 💡 TIP: Consider explicitly specify that category is undefined
  };

  // Act
  // 💡 TIP: use any http client lib like Axios OR supertest
  const receivedResult = await request(expressApp)
    .post('/sensor-events')
    .send(eventToAdd);

  // Assert
  // 💡 TIP: verify that status is 400
  expect(receivedResult.status).toBe(400);
});

// ✅ TASK: Test that when a new event is posted to /sensor-events route, if category or temperature are not specified -> the event is NOT saved to the DB!
// 💡 TIP: Testing the response is not enough, the adequate state (e.g. DB) should also satisfy the expectation

describe('Order API #component', () => {
  describe('POST /event', () => {
    test('When temperature is not specified, should not save the event', async () => {
      // Arrange

      const eventToAdd = {
        temperature: undefined,
        reason: `Thermostat-temperature ${getShortUnique()}`, // This must be unique
        color: 'Green',
        weight: '80',
        status: 'active',
        category: 'no-temperature-test',
      };

      // Act
      await request(expressApp).post('/sensor-events').send(eventToAdd);

      // Assert
      const potentiallyExistingEvent = await request(expressApp).get(
        '/sensor-events/no-temperature-test/reason',
      );
      expect(potentiallyExistingEvent.body).toMatchObject([]);
    });

    test('When a temperature is above 50, then expects a notification to be sent', async () => {
      // Arrange
      const highTemperatureEvent = {
        category: 'kids-room',
        temperature: 70,
        longtitude: 80,
        latitude: 120,
        reason: `Thermostat ${getShortUnique()}`,
        notificationCategory: `kids-room-${getShortUnique()}`,
        weight: '80',
        status: 'active',
      };
      const listenerToNotification = nock('http://localhost')
        .post(`/notification/${highTemperatureEvent.notificationCategory}`)
        .reply(200, { success: true });

      // Act
      await request(expressApp)
        .post('/sensor-events')
        .send(highTemperatureEvent);

      // Assert
      expect(listenerToNotification.isDone()).toBe(true);
    });

    test('When sorting by event reason, then results are sorted properly', async () => {
      // Arrange
      const uniqueCategory = `unique-category-for-sort - ${getShortUnique()}`;
      const secondEvent = {
        category: uniqueCategory,
        temperature: 70,
        reason: `def-this-should-come-second ${getShortUnique()}`,
        weight: 80,
        status: 'active',
      };
      const firstEvent = {
        category: uniqueCategory,
        temperature: 70,
        reason: `abc-this-should-come-first ${getShortUnique()}`,
        weight: 80,
        status: 'active',
      };
      await request(expressApp).post('/sensor-events').send(secondEvent);
      await request(expressApp).post('/sensor-events').send(firstEvent);

      // Act
      const receivedResult = await request(expressApp).get(
        `/sensor-events/${uniqueCategory}/reason`,
      );

      // Assert
      expect(receivedResult.body).toMatchObject([firstEvent, secondEvent]);
    });
  });
});
