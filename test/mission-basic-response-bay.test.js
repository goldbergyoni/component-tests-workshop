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
const SensorsEventService = require('../src/domain/sensors-service');

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
  // ✅ TASK: Run the testing and ensure the the next simplistic test pass - done
  test('Just checking that testing works on your machine', () => {
    expect('Me boosting my testing knowledge in the workshop').toBeTruthy();
    // 💡 TIP: The the tests in watch mode: npm run test:dev
    // 💡 TIP: When in watch mode, within the terminal/CMD type "p" -> Then start typing this file name, choose it
    //  It should run only this file. Click "w" to return to the main menu
  });

  // ✅ TASK: Test that when a new event is posted to /event route, if category or temperature are not specified -> the API returns HTTP 400
  // 💡 TIP: Down below, there is an example event schema
  test('When category is not specified, should get http 400 error', async () => {
    // Arrange
    const eventToAdd = {
      temperature: 20,
      color: 'Green',
      weight: 80,
      status: 'active',
      category: undefined, // 💡 TIP: Consider explicitly specify that category is undefined by assigning 'undefined'
    };

    // Act

    // 💡 TIP: use any http client lib like Axios OR supertest
    // 💡 TIP: This is how it is done with Supertest -> await request(expressApp).post("/sensor-events").send(eventToAdd);
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert

    // 💡 TIP: Check that the received response is indeed as stated in the test name
    // 💡 TIP: Use this syntax for example: expect(receivedResponse.status).toBe(...);
    expect(response.statusCode).toEqual(400);
    expect(response.body).toBeEmptyObject;
  });

  test('When temperature is not specified, should get http 400 error', async () => {
    // Arrange
    const eventToAdd = {
      temperature: undefined, // 💡 TIP: Consider explicitly specify that temperature is undefined by assigning 'undefined'
      color: 'Green',
      weight: 80,
      status: 'active',
      category: 1,
    };

    // Act

    // 💡 TIP: use any http client lib like Axios OR supertest
    // 💡 TIP: This is how it is done with Supertest -> await request(expressApp).post("/sensor-events").send(eventToAdd);
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert

    // 💡 TIP: Check that the received response is indeed as stated in the test name
    // 💡 TIP: Use this syntax for example: expect(receivedResponse.status).toBe(...);
    expect(response.statusCode).toEqual(400);
    expect(response.body).toBeEmptyObject;
  });

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, we get back a valid response
  // 💡 TIP: Consider checking both the HTTP status and the body
  test('When inserting a valid event, should get successful response', async () => {
    // Arrange
    const validRequestBody = {
      temperature: 25,
      color: 'Green',
      weight: 80,
      status: 'active',
      category: 1,
    };
    // Act
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(validRequestBody);

    // Assert
    expect(response.statusCode).toEqual(200);
    expect(response.body).toMatchObject({
      temperature: 25,
      color: 'Green',
      weight: 80,
      status: 'active',
      category: '1',
      ...response.body,
    });
  });

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, it's indeed retrievable from the DB
  // 💡 TIP: In the assert phase, query to get the event that was added
  // 💡 TIP: Whenever possible, use the public API for verification (not direct DB access)
  test('When a valid event is posted to /sensor-events route, it can be retrieved from the database', async () => {
    // Arrange
    const validRequestBody = {
      temperature: 25,
      color: 'Green',
      weight: 80,
      status: 'active',
      category: '1',
    };
    // Act
    const postResponse = await request(expressApp)
      .post('/sensor-events')
      .send(validRequestBody);

    const getResponse = await request(expressApp).get(
      `/sensor-events/${postResponse.body.id}`,
    );

    //Assert
    expect(getResponse.statusCode).toEqual(200);
    expect(getResponse.body).toMatchObject({
      id: getResponse.body.id,
      ...getResponse.body,
      ...validRequestBody,
    });
  });

  // ✅ Keep the tests very short and readable, strive not to pass 7 statements per test
  // 💡 TIP: If it gets too long, extract obvious parts into an external helper

  // ✅🚀 TASK: Code the following test below
  test('When an internal unknown error occurs during request, Then get back 500 error', async () => {
    // Arrange
    // 💡 TIP: Factor a valid event here, otherwise the request will get rejected on start and the failure won't happen
    const validRequestBody = {
      temperature: 25,
      color: 'Green',
      weight: 80,
      status: 'active',
      category: '1',
    };
    // 💡 TIP: Make some internal function fail, choose any class method
    sinon
      .stub(SensorsEventService.prototype, 'addEvent')
      .rejects(new Error('Something went wrong'));

    // Act
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(validRequestBody);

    // Assert
    expect(response.statusCode).toEqual(500);
    expect(response.body).toBeEmptyObject;
  });

  // ✅ Ensure that the webserver is closed when all the tests are completed
  // 💡 TIP: Use the right test hook to call the API and instruct it to close

  // ✅🚀 Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
  // 💡 TIP: You might face port collision where two APIs instances try to open the same port
  // 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1
});
