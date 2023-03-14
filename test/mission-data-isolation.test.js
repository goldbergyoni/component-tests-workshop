// 🏅 Your mission is to create your first integration tests here 💜
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
const jestExtended = require('jest-extended');
let id;

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
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);
    // 💡 TIP: use any http client lib like Axios OR supertest
    // 💡 TIP: This is how it is done with Supertest -> await request(expressApp).post("/sensor-events").send(eventToAdd);

    // Assert
    // 💡 TIP: Check not only the HTTP status bot also the body
    expect(response).toMatchObject({ status: 200, body: eventToAdd });
    expect(response.body).toMatchObject({
      ...eventToAdd,
      id: expect.any(Number),
    });
  });

  // ✅ TASK: Run the test above twice, it fails, ah? Let's fix!
  // 💡 TIP: The failure is because the field 'reason' is unique. When the test runs for the second time -> This value already exists
  // 💡 TIP: Write an helper function that create unique and short value, put this at the end of the reason field
  // 💡 TIP: For the sake of this exercise, this helper can be as simple as just randomize number or use a timestamp

  // ✅ TASK: In the test above 👆, ensure that 'id' field is also part of the response with the right type
  // But hey, there is a challenge here: The 'id' is different in every response
  // 💡 TIP: Jest has a dedicated matcher for unknown values, read about:
  //  https://jestjs.io/docs/en/expect#expectanyconstructor

  // ✅ TASK: Let's test that the system indeed enforces the 'reason' field uniqueness by writing this test below 👇
  // 💡 TIP: This test probably demands two POST calls, you can use the same JSON payload twice
  test('When a record exist with a specific reason and trying to add a second one, then it fails with status 409', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();

    // Act
    const response1 = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);
    id = response1.body.id;
    const response2 = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(response1).toMatchObject({ status: 200, body: eventToAdd });
    expect(response2.status).toBe(409);
  });

  // ✅ TASK: Let's write the test below 👇 that checks that querying by ID works. For now, temporarily please query for the event that
  // was added using the first test above 👆.
  // 💡 TIP: This is not the recommended technique (reusing records from previous tests), we do this to understand
  //  The consequences
  test('When querying for event by id, Then the right event is being returned', async () => {
    // 💡 TIP: At first, query for the event that was added in the first test (In the first test above, store
    //  the ID of the added event globally). In this test, query for that ID
    // 💡 TIP: This is the GET sensor URL: await request(expressApp).get(`/sensor-events/${id}`,
    // Arrange
    const eventToAdd = getSensorEvent();
    const {
      body: { id },
    } = await request(expressApp).post('/sensor-events').send(eventToAdd);
    // Act
    const response = await request(expressApp).get(`/sensor-events/${id}`);

    // Assert
    expect(response).toMatchObject({ status: 200, body: { id } });
  });

  // ✅ TASK: Run the last test 👆 alone (without running other tests). Does it pass now?
  // 💡 TIP: To run a single test only, put the word test.only in front of the test method
  // 💡 TIP: Other way to run a single test is to run the tests in watch mode - 'npm run test:dev',
  //  then within the CLI type "t", now type your desired test name

  // ✅ TASK: The last step should have failed, the query test 👆 fails when running alone... Why?
  // 💡 TIP: This is because the first test ('Add sensor event') did not run, so no record added to the DB
  // 💡 TIP: A test that relies on records from other tests will always be fragile and increase the maintenance complexity

  // ✅ TASK: Let's fix the query test above 👆 - Make it pass all the time, even when running alone
  // 💡 TIP: In the arrange phase, add an event to query for. Don't trust any other test!

  // ✅ TASK: Test that when a new event is posted to /sensor-events route, the temperature is not specified -> the event is NOT saved to the DB!
  // 💡 TIP: Testing the response is not enough, the adequate state (e.g. DB) should also satisfy the expectation
  // 💡 TIP: In the assert phase, query to get the event that was (not) added - Ensure the response is empty
  test('when a new event is posted to /sensor-events route, the temperature is not specified -> the event is NOT saved to the DB', async () => {
    // 💡 TIP: At first, query for the event that was added in the first test (In the first test above, store
    //  the ID of the added event globally). In this test, query for that ID
    // 💡 TIP: This is the GET sensor URL: await request(expressApp).get(`/sensor-events/${id}`,
    // Arrange
    const eventToAdd = getSensorEvent({ temperature: undefined });
    const response = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Act
    const getAllEventsResult = await request(expressApp).get(`/sensor-events`);

    // Assert
    expect(response).toMatchObject({ status: 400 });
    expect(getAllEventsResult.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining(eventToAdd)]),
    );
  });
  // ✅ TASK: Test that when an event is deleted, then its indeed not existing anymore
  test('when a new event is posted to /sensor-events route, the temperature is not specified -> the event is NOT saved to the DB', async () => {
    // 💡 TIP: At first, query for the event that was added in the first test (In the first test above, store
    //  the ID of the added event globally). In this test, query for that ID
    // 💡 TIP: This is the GET sensor URL: await request(expressApp).get(`/sensor-events/${id}`,
    // Arrange
    const eventToAdd = getSensorEvent();
    const {
      body: { id },
    } = await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Act
    await request(expressApp).delete(`/sensor-events/${id}`);
    const getAllEventsResult = await request(expressApp).get(`/sensor-events`);

    // Assert
    expect(getAllEventsResult.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining(eventToAdd)]),
    );
  });

  // ✅ TASK: Write the following test below 👇 to check that the app is able to return all records
  // 💡 TIP: Checking the number of records in the response might be fragile as there other processes and tests
  //  that add data. Consider sampling for some records to get partial confidence that it works
  test('When adding multiple events, then all of them appear in the result', async () => {
    // Arrange
    const eventToAdd1 = getSensorEvent();
    const eventToAdd2 = getSensorEvent();

    //Act
    await request(expressApp).post('/sensor-events').send(eventToAdd1);
    await request(expressApp).post('/sensor-events').send(eventToAdd2);
    const getAllEventsResult = await request(expressApp).get(`/sensor-events`);

    // Assert
    expect(getAllEventsResult.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining(eventToAdd1),
        expect.objectContaining(eventToAdd2),
      ]),
    );
  });

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
