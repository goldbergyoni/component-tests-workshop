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
const SensorsService = require('../src/domain/sensors-service');
const sinon = require('sinon');

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
    const eventToAdd = getSensorEvent({
      category: undefined,
    });

    // Act
    const result = await request(expressApp)
      .post("/sensor-events")
      .send(eventToAdd);

    // Assert
    expect(result).toMatchObject({
      status: 400,
      body: { }
    });
  });

  test('When temperature is not specified, should get http 400 error', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: undefined,
    });

    // Act
    const result = await request(expressApp)
      .post("/sensor-events")
      .send(eventToAdd);

    // Assert
    expect(result).toMatchObject({
      status: 400,
      body: { }
    });
  });

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, we get back a valid response
  // 💡 TIP: Consider checking both the HTTP status and the body
  test('When inserting a valid event, should get successful response', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    // Act
    const result = await request(expressApp)
      .post("/sensor-events")
      .send(eventToAdd);

    // Assert
    expect(result).toMatchObject({
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: {
        id: expect.any(Number),
        ...eventToAdd,
      }
    })

    // Assert the record entry has been created
    const getResult = await request(expressApp)
      .get(`/sensor-events/${result.body.id}`);

    expect(getResult).toMatchObject({
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: result.body
    });
  });

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, it's indeed retrievable from the DB
  // 💡 TIP: In the assert phase, query to get the event that was added
  // 💡 TIP: Whenever possible, use the public API for verification (not direct DB access)

  // Done this in the previous test, could be in a separate test but is it needed guess it just helps with readability

  // ✅ Keep the tests very short and readable, strive not to pass 7 statements per test
  // 💡 TIP: If it gets too long, extract obvious parts into an external helper

  // ✅🚀 TASK: Code the following test below
  test('When an internal unknown error occurs during request, Then get back 500 error', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();

    // 💡 TIP: Factor a valid event here, otherwise the request will get rejected on start and the failure won't happen
    // 💡 TIP: Make some internal function fail, choose any class method
    // 💡 TIP: Use the library sinon to alter the behavior of existing function and make it throw error
    //  https://sinonjs.org/releases/latest/stubs/
    // 💡 TIP: Here is the syntax: sinon.stub(someClass.prototype, 'methodName').rejects(new Error("Error explanation"));
    sinon.stub(SensorsService.prototype, 'addEvent').rejects(new Error("Whoops an error occurred"));

    // Act
    const result = await request(expressApp)
      .post("/sensor-events")
      .send(eventToAdd);

    // Assert
    expect(result).toMatchObject({
      status: 500,
    });
  });

  // TODO: There are edge cases to cover looking as the logic for 'addEvent' depending on the temperature
  // and category a notification is created.
  // Guess we'd cover these in the unit tests?

  // ✅ Ensure that the webserver is closed when all the tests are completed
  // 💡 TIP: Use the right test hook to call the API and instruct it to close

  // ✅🚀 Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
  // 💡 TIP: You might face port collision where two APIs instances try to open the same port
  // 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1
});
