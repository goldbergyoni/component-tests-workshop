// 🏅 Your mission is to create your first integration tests here 💜
// ✅ Whenever you see this icon, there's a TASK for you
// 💡 - This is an ADVICE symbol, it will appear nearby most tasks and help you in fulfilling the tasks

const request = require('supertest');
const nock = require('nock');
const { initializeAPI } = require('../src/entry-points/sensors-api');

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

// Migration, unique record + helper, 

// ✅ TASK: Relying on the same record, fix
// 💡 TIP: Create helper

// ✅ TASK: Get all but how could you be sure
// 💡 TIP: ASC DESC

// ✅ TASK: Get all but how could you be sure
// 💡 TIP: ASC DESC

// ✅ TASK: Clean-up in global-teardown
// 💡 TIP: multiple options

// ✅ TASK: Global context
// 💡 TIP: Add store

// ✅ TASK: Multi-file
// 💡 TIP: Add store

// ✅ TASK: Two in-parallel
// 💡 TIP: Add store

// ✅ TASK: Test uniqueness
// 💡 TIP: Add store

// ✅ TASK: Run parallel
// 💡 TIP: Add store

// ✅ TASK: Big response
// 💡 TIP: Add store

// ✅ TASK: Parameterized test
// 💡 TIP: Add store

// ✅ TASK: Big data
// 💡 TIP: Add store

describe('Sensors test', () => {
  // ✅ TASK: Unique will fail, fix with radom
  // 💡 TIP: Helper
  test('When adding a valid event, should get successful confirmation', async () => {
    // Arrange
    const eventToAdd = {
      temperature: 20,
      name: 'Thermostat-temperature', // This must be unique
      color: 'Green',
      weight: '80',
      status: 'active',
      // 💡 TIP: Consider explicitly specify that category is undefined
    };

    // Act
    // 💡 TIP: use any http client lib like Axios OR supertest
    // 💡 TIP: This is how it is done with Supertest -> await request(expressApp).post("/sensor-events").send(eventToAdd);

    // Assert
    // 💡 TIP: verify that status is 400
  });

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
