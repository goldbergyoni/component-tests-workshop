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
let expressApp;

beforeAll(async () => {
  expressApp = await startWebServer();

  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1')
});

afterAll(async () => {
  await stopWebServer();
});

beforeEach(() => {
  nock.cleanAll()

  nock('http://localhost').post('/notification/default').reply(200, { success: true });
  nock('https://google.com/').get(`/${expect.any(String)}`).reply(200, { success: true });
});

afterEach(() => {});

describe('Sensors test', () => {
  test('When adding a valid event, Then should get successful confirmation', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({ temperature: 60 });

    // Act
    const receivedResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(receivedResponse.status).toBe(200);
  });

  test('When temperature is above 50, then the right notification should be sent', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 51,
      notificationCategory: getShortUnique(),
    });
    let notificationPayload;
    
    const scope = nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`,
        (payload) => (notificationPayload = payload),
      ).reply(200, {success: true,});
  
    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    expect(scope.isDone()).toBe(true)
    expect(notificationPayload).toMatchObject({
      title: expect.any(String),
      id: expect.any(Number),
    });
  });

  test('When emitting a new event and the notification service replies with 500 error, then the added event was still saved successfully', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 80, //💡 TIP: We need high temperature to trigger notification
      notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
    });
    
    nock('http://localhost')
    .post(`/notification/${eventToAdd.notificationCategory}`)
    .reply(500)

    // Act
    const postResponse = await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    const retrievedSensorEventResponse = await request(expressApp).get(`/sensor-events/${postResponse.body.id}`);

    expect(retrievedSensorEventResponse.status).toBe(200)
    expect(retrievedSensorEventResponse.body).toMatchObject(eventToAdd)
  });

  test('When emitting a new event and the notification service replies with 500 error with delay, then the added event was still saved successfully', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 80, //💡 TIP: We need high temperature to trigger notification
      notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
    });
    
    nock('http://localhost')
    .post(`/notification/${eventToAdd.notificationCategory}`)
    .delay(100)
    .reply(500)

    // Act
    const postResponse = await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    const retrievedSensorEventResponse = await request(expressApp).get(`/sensor-events/${postResponse.body.id}`);

    expect(retrievedSensorEventResponse.status).toBe(200)
    expect(retrievedSensorEventResponse.body).toMatchObject(eventToAdd)
  });

  test('When emitting a new event and the notification service response with timeout, then the added event was still saved successfully', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 80, //💡 TIP: We need high temperature to trigger notification
      notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
    });
    
    process.env.HTTP_TIMEOUT = 1000
    nock('http://localhost')
    .post(`/notification/${eventToAdd.notificationCategory}`)
    .delay(Number(process.env.HTTP_TIMEOUT) + 1000)
    .reply(500)

    // Act
    const postResponse = await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    const retrievedSensorEventResponse = await request(expressApp).get(`/sensor-events/${postResponse.body.id}`);

    expect(retrievedSensorEventResponse.status).toBe(200)
    expect(retrievedSensorEventResponse.body).toMatchObject(eventToAdd)
  });
});

// 💡 TIP: This test is about a hot Microservice concept: Circuit-breaker (retrying requests)
test('When emitting event and the notification service fails once, then a notification is still being retried and sent successfully', async () => {
  // 💡 TIP: Make nock return an error response once, then make it succeed in the 2nd time
  // 💡 TIP: Syntax: nock(url).post(path).times(1).reply(500)
  // 💡 TIP: The code has retry mechanism built-in, check your test by removing it (sensors-api.js, axiosRetry) and see the test failing
  // Arrange
  const eventToAdd = getSensorEvent({
    temperature: 80,
    notificationCategory: getShortUnique(),
  });
  
  nock('http://localhost')
  .post(`/notification/${eventToAdd.notificationCategory}`)
  .times(2)
  .reply(500);

  let notificationPayload;
    
  const scope = nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`,
      (payload) => (notificationPayload = payload),
    ).reply(200, {success: true,});

  // Act
  const postResponse = await request(expressApp).post('/sensor-events').send(eventToAdd);

  // Assert
  const retrievedSensorEventResponse = await request(expressApp).get(`/sensor-events/${postResponse.body.id}`);

  expect(retrievedSensorEventResponse.status).toBe(200)
  expect(retrievedSensorEventResponse.body).toMatchObject(eventToAdd)

  expect(scope.isDone()).toBe(true)
  expect(notificationPayload).toMatchObject({
    title: expect.any(String),
    id: expect.any(Number),
  });
});

// ✅🚀 TASK: Ensure that if a response is not aligned with the OpenAPI (Swagger), then the tests will catch this issue
// 💡 TIP: In the root of the code, you may find the file openapi.json that documents the APIs
// 💡 TIP: Use jest-open-api tool to help with this mission:
// https://www.npmjs.com/package/jest-openapi
//💡 TIP: If you want to apply this to all tests, put this assertion as axios extension