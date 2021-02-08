const request = require('supertest');
const nock = require('nock');
const sinon = require('sinon');
const SensorsRepository = require('../src/data-access/sensors-repository');

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
  sinon.restore();
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
        category: `category-${getShortUnique()}}`,
      };

      // Act
      await request(expressApp).post('/sensor-events').send(eventToAdd);

      // Assert
      const potentiallyExistingEvent = await request(expressApp).get(
        `/sensor-events/${eventToAdd.category}/reason`,
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

    test('when getting all sensor events with the GET:/sensor-events route, it should retrieve events from DB including new added', async () => {
      // Arrange
      const uniqueCategory = `unique-category-${getShortUnique()}`;
      const eventToAdd = getSensorEvent({ category: uniqueCategory });
      const eventToAdd2 = getSensorEvent({ category: uniqueCategory });
      await request(expressApp).post('/sensor-events').send(eventToAdd);
      await request(expressApp).post('/sensor-events').send(eventToAdd2);

      // Act
      const receivedResponse = await request(expressApp)
        .get(`/sensor-events/${uniqueCategory}/reason`)
        .send();

      // Assert
      expect(receivedResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining(eventToAdd),
          expect.objectContaining(eventToAdd2),
        ]),
      );
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

    // ✅ TASK: Code the following test below
    test('When an internal unknown error occurs during request, Then get back 500 error', async () => {
      // Arrange
      const eventToAdd = getSensorEvent();
      sinon
        .stub(SensorsRepository.prototype, 'addSensorsEvent')
        .rejects(new Error('foo'));

      // Act
      const receivedResult = await request(expressApp)
        .post('/sensor-events')
        .send(eventToAdd);

      // Assert
      expect(receivedResult.status).toBe(500);
    });

    // ✅🚀  TASK: Let's ensure that two new events can be added at the same time - This ensure there are no concurrency and unique-key issues
    // Check that when adding two events at the same time, both are saved successfully
    // 💡 TIP: To check something was indeed saved, it's not enough to rely on the response - Ensure that it is retrievable
    // 💡 TIP: Promise.all function might be helpful to parallelize the requests
    test('when two new events are added at the same time, it should add both without problems', async () => {
      // Arrange
      const eventToAdd1 = getSensorEvent();
      const eventToAdd2 = getSensorEvent();

      // Act
      const addEvent1ResponseAsPromise = request(expressApp)
        .post('/sensor-events')
        .send(eventToAdd1);
      const addEvent2ResponseAsPromise = request(expressApp)
        .post('/sensor-events')
        .send(eventToAdd2);
      const [addEvent1Response, addEvent2Response] = await Promise.all([
        addEvent1ResponseAsPromise,
        addEvent2ResponseAsPromise,
      ]);

      // Assert
      expect(addEvent1Response.status).toBe(200);
      expect(addEvent2Response.status).toBe(200);
    });
  });
});
