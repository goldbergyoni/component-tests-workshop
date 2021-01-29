// 🏅 Your mission is to create your first integration tests here 💜
// ✅ Whenever you see this icon, there's a TASK for you
// 💡 - This is an ADVICE symbol, it will appear nearby most tasks and help you in fulfilling the tasks

// ⚠️ Warning: This is the solution to the mission-data-isolation exercise - Try solving yourself before looking here

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

beforeEach(() => {
  nock('http://localhost')
    .post(/notification.*/)
    .reply(200, {
      success: true,
    });
});

afterAll(async () => {
  await stopWebServer();
});

describe('Sensors test', () => {
  // ✅ TASK: Write the following test 👇 to ensure adding an event succeed
  // 💡 TIP: The event schema is already defined below
  test('When adding a valid event, Then should get successful confirmation', async () => {
    // Arrange
    const eventToAdd = {
      category: 'Home equipment',
      temperature: 20,
      reason: `Thermostat-failed-${getShortUnique()}`, // This must be unique
      color: 'Green',
      weight: 80,
      status: 'active',
    };

    // Act
    const receivedResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    eventToAdd.id = expect.any(Number);
    expect(receivedResponse).toMatchObject({
      status: 200,
      body: eventToAdd,
    });
  });

  // ✅ TASK: Run the test above twice, it fails, ah? Let's fix!
  // 💡 TIP: The failure is because the field 'reason' is unique. When the test runs for the second time -> This value already exists
  // 💡 TIP: Write a simple helper function that create unique and short value, put this at the end of the reason field
  // 💡 TIP: For the sake of this exercise, this helper can be as simple as just randomize number or use a timestamp

  // ✅ TASK: Let's test that the system indeed enforces the 'reason' field uniqueness by writing this test below 👇
  // 💡 TIP: This test probably demands two POST calls, you can use the same JSON payload twice
  test('When a record exist with a specific reason and trying to add a second one, then it fails with status 409', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({ reason: 'Failure' });
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Act
    const receivedResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(receivedResponse.status).toBe(409);
  });

  // ✅ TASK: In one of the tests above 👆, ensure that 'id' field is also part of the response with the right type
  // But hey, there is a challenge here: The 'id' is different in every response
  // 💡 TIP: Jest has a dedicated matcher for unknown values, read about:
  //  https://jestjs.io/docs/en/expect#expectanyconstructor

  // ✅ TASK: Let's write the test below 👇 that checks that querying by ID works. For now, temporarily please query for the event that
  // was added using the test above 👆
  // 💡 TIP: This is not the recommended technique, to reuse records from previous tests, we do this to understand
  //  The consequences
  test('When querying for event by id, Then the right event is being returned', async () => {
    // Arrange
    const eventToAdd = {
      category: 'Home equipment',
      temperature: 20,
      reason: `Thermostat-failed-${getShortUnique()}`, // This must be unique
      color: 'Green',
      weight: 80,
      status: 'active',
    };
    const anExistingEventId = (
      await request(expressApp).post('/sensor-events').send(eventToAdd)
    ).body.id;

    // Act
    const receivedResponse = await request(expressApp).get(
      `/sensor-events/${anExistingEventId}`,
    );

    // Assert
    expect(receivedResponse).toMatchObject({
      status: 200,
      body: eventToAdd,
    });
  });

  // ✅ TASK: Run the last test 👆 alone. Does it pass now?
  // 💡 TIP: To run a single test only, put the word test.only in front of the test method
  // 💡 TIP: Other way to run a single test is to run the tests in watch mode - 'npm run test:dev',
  //  then within the CLI type "t", now type your desired test name

  // ✅ TASK: The last step should have failed, the query test 👆 fails when running alone... Why?
  // 💡 TIP: This is because the 'Add sensor event' test did not run, so there is no record to fetch
  // 💡 TIP: A test that relies on records from other tests will always be fragile and increase the maintenance complexity

  // ✅ TASK: Let's fix the query test above 👆 - Make it pass all the time, even when running alone
  // 💡 TIP: Create the desired state within the test, don't trust any other test

  // ✅🚀 TASK: Let's ensure that two new events can be added at the same time - This ensure there are no concurrency and unique-key issues
  // Check that when adding two events at the same time, both are saved successfully
  // 💡 TIP: To check something was indeed saved, it's not enough to rely on the response - Ensure that it is retriveable
  // 💡 TIP: Promise.all function might be helpful to parallelize the requests

  // ✅ TASK: Write the following test below 👇 to check that the app is able to return all records
  // 💡 TIP: Checking the number of records in the response might be fragile as there other processes and tests
  //  that add data. Consider sampling for some records to get partial confidence that it works
  test('When adding multiple events, then all of them appear in the result', async () => {
    // Arrange
    const eventToAdd1 = getSensorEvent({});
    const event1Id = (
      await request(expressApp).post('/sensor-events').send(eventToAdd1)
    ).body.id;
    const eventToAdd2 = getSensorEvent({});
    const event2Id = (
      await request(expressApp).post('/sensor-events').send(eventToAdd2)
    ).body.id;

    // Act
    const receivedResponse = await request(expressApp).get('/sensor-events');

    // Assert
    expect(receivedResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: event1Id }),
        expect.objectContaining({ id: event2Id }),
      ]),
    );
  });

  // ✅ TASK: Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
  // 💡 TIP: You might face port collision where two APIs instances try to open the same port
  // 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1

  // ✅🚀 TASK: Let's ensure that two new events can be added at the same time - This ensure there are no concurrency and unique-key issues
  // Check that when adding two events at the same time, both are saved successfully
  // 💡 TIP: To check something was indeed saved, it's not enough to rely on the response - Ensure that it is retrievable
  // 💡 TIP: Promise.all function might be helpful to parallelize the requests

  // ✅🚀 TASK: Although we don't clean-up the DB during the tests, it's useful to clean-up in the end. Let's delete the data tables after all the tests
  // 💡 TIP: Choose the right hook thoughtfully and remember that two test files might get executed at the same time

  // ✅🚀 TASK: Test that querying for /sensor-events route and sorting by the field 'name', the results are indeed sorted
  // 💡 TIP: Each test should be independent and might run alone without others, don't count on data (events) from other tests
});
