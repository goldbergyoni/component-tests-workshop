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

describe('Sensors test', () => {
  // ✅ TASK: Run the testing and ensure the the next simplistic test pass
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
      category: 'Kids-Room',
      category: undefined
      // 💡 TIP: Consider explicitly specify that category is undefined by assigning 'undefined'
    };

    // Act
    const receivedResponse = await request(expressApp)
    .post('/sensor-events')
    .send(eventToAdd);

    // Assert

    // 💡 TIP: Check that the received response is indeed as stated in the test name
    // 💡 TIP: Use this syntax for example: expect(receivedResponse.status).toBe(...);
    expect(receivedResponse.status).toBe(400)
  });

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, we get back a valid response
  // 💡 TIP: Consider checking both the HTTP status and the body
  test('When inserting a valid event, should get successful response', async () => {
    // Arrange
    const validEvent = getSensorEvent();

    // Act
    const receivedResponse = await request(expressApp)
    .post('/sensor-events')
    .send(validEvent);

    // Assert
    expect(receivedResponse).toMatchObject({status: 200, body: {...validEvent}});
  });

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, it's indeed retrievable from the DB
  // 💡 TIP: In the assert phase, query to get the event that was added
  // 💡 TIP: Whenever possible, use the public API for verification (not direct DB access)
  test('When inserting a valid event, should be able to retrieve it', async () => {
    // Arrange
    const validEvent = getSensorEvent();

    // Act
    const receivedResponse = await request(expressApp)
    .post('/sensor-events')
    .send(validEvent);

    const retrieveResponse = await request(expressApp)
    .get('/sensor-events/' + receivedResponse.body.id)

    // Assert
    expect(receivedResponse).toMatchObject({status: 200, body: {...validEvent}});
    expect(receivedResponse.body).toMatchObject(retrieveResponse.body)
  });

  // ✅🚀 TASK: Code the following test below
  test('When an internal unknown error occurs during request, Then get back 500 error', async () => {
    // Arrange
    const validEvent = getSensorEvent();
    // 💡 TIP: Factor a valid event here, otherwise the request will get rejected on start and the failure won't happen
    // 💡 TIP: Make some internal function fail, choose any class method
    // 💡 TIP: Use the library sinon to alter the behaviour of existing function and make it throw error
    //  https://sinonjs.org/releases/latest/stubs/
    // 💡 TIP: Here is the syntax: sinon.stub(someClass.prototype, 'methodName').rejects(new Error("Error explanation"));
    sinon.stub(SensorsService.prototype, 'addEvent').rejects(new Error("Error explanation"));

    // Act
    const receivedResponse = await request(expressApp)
    .post('/sensor-events')
    .send(validEvent);

    // Assert
    expect(receivedResponse.status).toBe(500)
  });
});
