// 🏅 Your mission is to create your first integration tests here 💜
// 🏝 Response island
// ✅ Whenever you see this icon, there's a TASK for you
// ✅🚀 This symbol represents an advanced task
// 💡 - This is an ADVICE symbol, it will appear nearby most tasks and help you in fulfilling the tasks

const request = require('supertest');
const nock = require('nock');
const {
  startWebServer,
  stopWebServer,
} = require('../src/entry-points/sensors-api');
const { getShortUnique, getSensorEvent } = require('./test-helper');
const sinon = require('sinon');
const SensorsRepository = require('../src/data-access/sensors-repository');
const { AppError } = require('../src/error-handling');

let expressApp;

beforeAll(async () => {
  expressApp = await startWebServer();
});

afterAll(async () => {
  await stopWebServer();
});

beforeEach(() => {
  nock('http://localhost').get('/notification').reply(200, {
    success: true,
  });
});

afterEach(() => {
  sinon.restore();
});

describe('Sensors test', () => {
  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, we get back a valid response
  // 💡 TIP: Consider checking both the HTTP status and the body
  test('When inserting a valid event, should get successful response', async () => {
    // Arrange
    const eventToAdd = {
      temperature: 20,
      color: 'Green',
      weight: 80,
      status: 'active',
      category: 'Kids-Room',
    };

    // Act
    // 💡 TIP: use any http client lib like Axios OR supertest
    // 💡 TIP: This is how it is done with Supertest -> 
    const receivedResponse = await request(expressApp).post("/sensor-events").send(eventToAdd);

    // Assert
    // 💡 TIP: You may check the body and the status all together with the following syntax:
    expect(receivedResponse).toMatchObject({ status: 200, body: eventToAdd });
  });

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, it's indeed retrievable from the DB
  // 💡 TIP: In the assert phase, query to get the event that was added
  // 💡 TIP: Whenever possible, use the public API for verification (not direct DB access)
  test('When inserting a valid event, should be retrievable', async () => {
    // Arrange
    const eventToAdd = {
      temperature: 20,
      color: 'Green',
      weight: 80,
      status: 'active',
      category: 'Kids-Room',
    };

    // Act
    const successResponse = await request(expressApp).post("/sensor-events").send(eventToAdd);
    const receivedResponse = await request(expressApp).get(`/sensor-events/${successResponse.body.id}`).send();

    // Assert
    expect(receivedResponse).toMatchObject({ status: 200, body: eventToAdd });
  });

  // ✅ Keep the tests very short and readable, strive not to pass 7 statements per test
  // 💡 TIP: If it gets too long, extract obvious parts into an external helper

  // ✅ Ensure that the webserver is closed when all the tests are completed
  // 💡 TIP: Use the right test hook to call the API and instruct it to close

  // ✅🚀 Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
  // 💡 TIP: You might face port collision where two APIs instances try to open the same port
  // 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1
});
