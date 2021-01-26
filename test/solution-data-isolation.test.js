// 🏅 Your mission is to create your first integration tests here 💜
// ✅ Whenever you see this icon, there's a TASK for you
// 💡 - This is an ADVICE symbol, it will appear nearby most tasks and help you in fulfilling the tasks

// ⚠️ Warning: This is the solution to the mission-data-isolation exercise - Try solving yourself before looking here

const request = require('supertest');
const nock = require('nock');
const { initializeAPI } = require('../src/entry-points/sensors-api');
const { getShortUnique } = require('./test-helper');

let expressApp;

beforeAll(() => {
  expressApp = initializeAPI();
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
  // 💡 TIP: Write an helper function that create unique and short value, put this at the end of the reason field

  // ✅ TASK: Let's test that the system indeed enforces the 'reason' field uniqueness by writing this test below 👇
  // 💡 TIP: This test probably demands two POST calls, you can use the same JSON payload twice
  test.todo(
    'When a record exist with a specific reason and trying to add a second one, then it fails with status 409',
  );

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

  // ✅ TASK: Write the follwing test below 👇 to check that the app is able to return all records
  // 💡 TIP: Checking the number of records in the response might be fragile as there other processes and tests
  //  that add data. Consider sampling for some records to get partial confidence that it works
  test('When adding multiple events, then all of them appear in the result', () => {});

  // ✅ TASK: Clean-up in global-teardown
  // 💡 TIP: multiple options

  // ✅ TASK: Global context
  // 💡 TIP: Add store

  // ✅ TASK: Multi-file
  // 💡 TIP: Add store

  // ✅ TASK: Run parallel
  // 💡 TIP: Add store

  // ✅ TASK: Big response
  // 💡 TIP: Add store

  // ✅ TASK: Parameterized test
  // 💡 TIP: Add store

  // ✅ TASK: Big data
  // 💡 TIP: Add store

  // ✅ TASK: Test that when a new event is posted to /sensor-events route, the temperature is not specified -> the event is NOT saved to the DB!
  // 💡 TIP: Testing the response is not enough, the adequate state (e.g. DB) should also satisfy the expectation

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, we get back a valid response
  // 💡 TIP: Consider both the HTTP status and the body

  // ✅ TASK: Test that when a new valid event is posted to /sensor-events route, it's indeed retrievable from the DB
  // 💡 TIP: Whenever possible, use the public API for verification

  // ✅ TASK: Test that querying the GET:/sensor-events route, it returns the right event when a single event exist
  // 💡 TIP: Ensure that exactly one was returned and that this is the right event
  // 💡 TIP: Try using as few assertions as possible, maybe even only one

  // ✅ TASK: Test that querying the GET:/sensor-events route, it returns the right events when multiple events exist
  // 💡 TIP: Ensure that all the relevant events were returned

  // ✅ TASK: Test that querying for /sensor-events route and sorting by the field 'name', the results are indeed sorted
  // 💡 TIP: Each test should be independent and might run alone without others, don't count on data (events) from other tests

  // ✅ Learning TASK: Test that when a new valid event is posted to /sensor-events route, if the temperature exceeds 50 degree a notification is being sent
  // 💡 TIP: This was not covered in the course. To achieve this read about the library 'nock' which can verify that the /localhost/notification service was called

  // ✅ Ensure that the webserver is closed when all the tests are completed
  // 💡 TIP: Use the right test hook to call the API and instruct it to close

  // ✅ Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
  // 💡 TIP: You might face port collision where two APIs instances try to open the same port
  // 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1

  // ✅ Ensure that the app is read for production and can stat listening to requests not only during testing
  // 💡 TIP: Sometimes we focus only on testing and it might happen that the app can't bootstrap and listen in a production scenario
});
