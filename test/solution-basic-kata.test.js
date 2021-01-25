const request = require('supertest');
const nock = require('nock');
const { initializeAPI } = require('../src/entry-points/sensors-api');
const { getShortUnique } = require('./test-helper');

let expressApp;

beforeAll(() => {
  expressApp = initializeAPI();
});

beforeEach(() => {
  nock('http://localhost')
    .get('/notification')
    .reply(200, {
      success: true,
    })
    .persist();
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

    test('When a temperature is beyond 50, then expects a notification to be sent', async () => {
      // Arrange
      const highTemperatureEvent = {
        category: 'kids-room',
        temperature: 70,
        longtitude: 80,
        latitude: 120,
        reason: `Thermostat ${getShortUnique()}`,
        weight: '80',
        status: 'active',
      };

      // Act
      await request(expressApp)
        .post('/sensor-events')
        .send(highTemperatureEvent);

      // Assert
      // expect(nockRecord.isDone()).toBe(true);
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
