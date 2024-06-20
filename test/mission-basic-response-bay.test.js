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
const sinon = require('sinon');
const SensorsService = require('../src/domain/sensors-service');

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

const event = {
  temperature: 20,
  color: 'Green',
  weight: 80,
  status: 'active',
  category: 'Kids-Room',
};

describe('Basic response tests', () => {
  test('Just checking that testing works on your machine', () => {
    expect('Me boosting my testing knowledge in the workshop').toBeTruthy();
  });

  test('When category is not specified, should get http 400 error', async () => {
    // Arrange
    const eventToAdd = { ...event, category: undefined };

    // Act
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(response.status).toBe(400);
  });

  test('When inserting a valid event, should get successful response', async () => {
    // Arrange

    // Act
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(event);

    // Assert
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toMatchObject(event);
  });

  test('When inserting a valid event, should be able to retrieve it', async () => {
    // Arrange
    const { text } = await request(expressApp)
      .post('/sensor-events')
      .send(event);
    const id = JSON.parse(text).id;

    // Act
    const response = await request(expressApp).get(`/sensor-events/${id}`);

    // Assert
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toMatchObject(event);
  });

  test("When getting an event that doesn't exist, text is empty", async () => {
    // Arrange

    // Act
    const response = await request(expressApp).get(`/sensor-events/12222`);

    // Assert
    expect(response.text).toBe('null');
  });

  test('When an internal unknown error occurs during request, Then get back 500 error', async () => {
    // Arrange
    sinon
      .stub(SensorsService.prototype, 'addEvent')
      .rejects(new Error('Error!'));

    // Act
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(event);

    // Assert
    expect(response.status).toBe(500);
  });

  // ✅ Ensure that the webserver is closed when all the tests are completed
  // 💡 TIP: Use the right test hook to call the API and instruct it to close

  // ✅🚀 Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
  // 💡 TIP: You might face port collision where two APIs instances try to open the same port
  // 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1
});
