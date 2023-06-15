// 🏅 Your mission is to create your first integration tests here 💜
// 🏝 database island
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

let expressApp;

beforeAll(async () => {
  expressApp = await startWebServer();
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

describe('Sensors test', () => {
  // ✅ TASK: Write the following test 👇 to ensure adding an event succeed
  // 💡 TIP: The event schema is already defined below
  test('When adding a valid event, Then should get successful confirmation', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();

    // Act
    const receivedResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    const expectedResult = eventToAdd;
    expectedResult.id = expect.any(Number);
    expect(receivedResponse).toMatchObject({
      status: 200,
      body: expectedResult,
    });
  });

  // ✅ TASK: Let's test that the system indeed enforces the 'reason' field uniqueness by writing this test below 👇
  // 💡 TIP: This test probably demands two POST calls, you can use the same JSON payload twice
  // test('When a record exist with a specific reason and trying to add a second one, then it fails with status 409');
  test('When a record exist with a specific reason and trying to add a second one, then it fails with status 409', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();

    // Act
    const receivedResponseOne = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    const receivedResponseTwo = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(receivedResponseOne).toMatchObject({
      status: 200,
      body: eventToAdd,
    });

    expect(receivedResponseTwo.status).toBe(409);
  });

  // ✅ TASK: Let's write the test below 👇 that checks that querying by ID works. For now, temporarily please query for the event that
  // was added using the first test above 👆.
  // 💡 TIP: This is not the recommended technique (reusing records from previous tests), we do this to understand
  //  The consequences
  test('When querying for event by id, Then the right event is being returned', async () => {
    // Arrange
    const validEvent = getSensorEvent();

    const receivedResponse = await request(expressApp)
    .post('/sensor-events')
    .send(validEvent);

    // Act
    const retrieveResponse = await request(expressApp)
    .get(`/sensor-events/${receivedResponse.body.id}`)

    // Assert
    expect(retrieveResponse.body).toMatchObject(validEvent)
  });


  // ✅ TASK: Test that when a new event is posted to /sensor-events route, the temperature is not specified -> the event is NOT saved to the DB!
  // 💡 TIP: Testing the response is not enough, the adequate state (e.g. DB) should also satisfy the expectation
  // 💡 TIP: In the assert phase, query to get the event that was (not) added - Ensure the response is empty
  test('When creating new event with no temperature should not save to db', async () => {
    // Arrange
    const validEvent = getSensorEvent();
    delete validEvent.temperature

    // Act
    const receivedResponse = await request(expressApp)
    .post('/sensor-events')
    .send(validEvent);

    const retrieveResponse = await request(expressApp)
    .get(`/sensor-events/${validEvent.category}/color`)

    // Assert
    expect(receivedResponse.status).toBe(400)
    expect(retrieveResponse).toMatchObject({
      status: 200,
      body: [],
    });
  })

  // ✅ TASK: Test that when an event is deleted, then its indeed not existing anymore
  test('When deleting event with should not be retrievable', async () => {
    // Arrange
    const validEvent = getSensorEvent();

    // Act
    const createdResponse = await request(expressApp)
    .post('/sensor-events')
    .send(validEvent);

    const deletedResponse = await request(expressApp)
    .delete(`/sensor-events/${createdResponse.body.id}`)

    const getResponse = await request(expressApp)
    .get(`/sensor-events/${createdResponse.body.id}`)

    // Assert
    expect(createdResponse).toMatchObject({
      status: 200,
      body: validEvent,
    });
    expect(deletedResponse.status).toBe(200)
    expect(getResponse).toMatchObject({
      status: 200,
      body: null,
    });
  })

  // ✅ TASK: Write the following test below 👇 to check that the app is able to return all records
  // 💡 TIP: Checking the number of records in the response might be fragile as there other processes and tests
  //  that add data. Consider sampling for some records to get partial confidence that it works
  test('When adding multiple events, then all of them appear in the result', () => {});

  // ✅ TASK: Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
  // 💡 TIP: You might face port collision where two APIs instances try to open the same port
  // 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1

  // ✅🚀  TASK: Test the following
  test('When querying for a non-existing event, then get http status 404', () => {});
  // 💡 TIP: How could you be sure that an item does not exist? 🤔

  // ✅🚀  TASK: Let's ensure that two new events can be added at the same time - This ensure there are no concurrency and unique-key issues
  // Check that when adding two events at the same time, both are saved successfully
  // 💡 TIP: To check something was indeed saved, it's not enough to rely on the response - Ensure that it is retrievable
  // 💡 TIP: Promise.all function might be helpful to parallelize the requests

  // ✅🚀 When adding a valid event, we get back some fields with dynamic values: createdAt, updatedAt, id
  //  Check that these fields are not null and have the right schema
  // 💡 TIP: Jest has a dedicated matcher for unknown values, read about:
  //  https://jestjs.io/docs/en/expect#expectanyconstructor

  // ✅🚀 TASK: Although we don't clean-up the DB during the tests, it's useful to clean-up in the end. Let's delete the data tables after all the tests
  // 💡 TIP: Choose the right hook thoughtfully and remember that two test files might get executed at the same time
  // 💡 TIP: Within global-setup file, there is a docker-compose library that exemplifies running command within our docker-compose environment

  // ✅🚀  TASK: Test that querying for /sensor-events route (i.e. get all) and sorting by the field 'temperature', the results are indeed sorted
  // 💡 TIP: The following route allows sorting by specific field: /sensor-events/:category/:sortBy
  // 💡 TIP: Each test should be independent and might run alone without others, don't count on data (events) from other tests

  // ✅🚀  TASK: Test that querying for /sensor-events route (i.e. get all) and sorting by the field 'temperature', the results are indeed sorted
  // 💡 TIP: The following route allows sorting by specific field: /sensor-events/:category/:sortBy
  // 💡 TIP: Each test should be independent and might run alone without others, don't count on data (events) from other tests

  // ✅🚀  TASK: Test when a sensor event is deleted, the code is not mistakenly deleting data that was not
  // supposed to be deleted
  // 💡 TIP: You may need to add more than one event to achieve this
});
