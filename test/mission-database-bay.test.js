const request = require('supertest');
const nock = require('nock');
const {
  startWebServer,
  stopWebServer,
} = require('../src/entry-points/sensors-api');
const { getSensorEvent, assertSensorEvent } = require('./test-helper');

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

describe('Database tests', () => {
  // ✅ TASK: Write the following test 👇 to ensure adding an event succeed
  // 💡 TIP: The event schema is already defined below
  test('When adding a valid event, Then should get successful confirmation', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();

    // Act
    const postResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(postResponse).toMatchObject({ status: 200 });
    const id = JSON.parse(postResponse.text).id;
    await assertSensorEvent(expressApp, id, eventToAdd);
  });

  test('When a record exist with a specific reason and trying to add a second one, then it fails with status 409', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    const firstResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Act
    const secondResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(firstResponse).toMatchObject({ status: 200 });
    expect(secondResponse).toMatchObject({ status: 409 });
  });

  // ✅ TASK: Let's write the test below 👇 that checks that querying by ID works. For now, temporarily please query for the event that
  // was added using the first test above 👆.
  // 💡 TIP: This is not the recommended technique (reusing records from previous tests), we do this to understand
  //  The consequences
  test('When querying for event by id, Then the right event is being returned', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    const postResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);
    const id = JSON.parse(postResponse.text).id;

    // Act
    const response = await request(expressApp).get(`/sensor-events/${id}`);

    // Assert
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toMatchObject(eventToAdd);
  });

  test('When adding an event without temperature, Then the event is not saved', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: undefined,
      category: 'should not be saved',
    });

    // Act
    const postResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(postResponse).toMatchObject({ status: 400 });
    // The category posted from this test should not be saved
    const response = await request(expressApp).get('/sensor-events');
    const eventAdded = JSON.parse(response.text).find(
      (event) => event.category === eventToAdd.category,
    );
    expect(eventAdded).toBeUndefined();
  });

  test('When deleting an event, Then it is indeed deleted', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    const postResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);
    const id = JSON.parse(postResponse.text).id;

    // Act
    const deleteResponse = await request(expressApp).delete(
      `/sensor-events/${id}`,
    );

    // Assert
    expect(deleteResponse.status).toBe(200);
    const getResponse = await request(expressApp).get(`/sensor-events/${id}`);
    expect(getResponse.text).toBe('null');
  });

  // ✅ TASK: Write the following test below 👇 to check that the app is able to return all records
  // 💡 TIP: Checking the number of records in the response might be fragile as there other processes and tests
  //  that add data. Consider sampling for some records to get partial confidence that it works
  test('When adding multiple events, then all of them appear in the result', async () => {
    // Arrange
    const event1 = getSensorEvent();
    const event2 = getSensorEvent();
    const currentEvents = await request(expressApp).get('/sensor-events');
    const currentEventsCount = JSON.parse(currentEvents.text).length;

    // Act
    await request(expressApp).post('/sensor-events').send(event1);
    await request(expressApp).post('/sensor-events').send(event2);
    const updatedEvents = await request(expressApp).get('/sensor-events');

    // Assert
    const updatedEventsCount = JSON.parse(updatedEvents.text).length;
    expect(updatedEventsCount).toBe(currentEventsCount + 2);
    // Check that one of the new events is in the result.
    expect(
      JSON.parse(updatedEvents.text).find(
        ({ reason }) => reason === event1.reason,
      ),
    ).toMatchObject(event1);
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
