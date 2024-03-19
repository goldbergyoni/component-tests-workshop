// 🏅 Your mission is to create your first integration tests here 💜
// ✅ Whenever you see this icon, there's a TASK for you
// ✅🚀 This symbol represents an advanced task
// 💡 - This is an ADVICE symbol, it will appear nearby most tasks and help you in fulfilling the tasks

const request = require('supertest');
const nock = require('nock');
const sinon = require('sinon');
const {
  startWebServer,
  stopWebServer,
} = require('../src/entry-points/sensors-api');
const { getShortUnique, getSensorEvent } = require('./test-helper');

let expressApp;

// ✅ Best Practice
beforeAll(async () => {
  expressApp = await startWebServer();
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterAll(async () => {
  await stopWebServer();
  nock.enableNetConnect();
});

// ✅ Best Practice
beforeEach(() => {
  nock('http://localhost')
    .post('/notification/default')
    .reply(200, {
      success: true,
    })
    .persist();
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(() => {});

describe('Sensors test', () => {
  // ✅ TASK: Uncomment this test and run it. It will fail. Do you understand why?
  // 💡 TIP: When setting high temperature event, then a notification is sent with HTTP request
  test('When adding a valid event, Then should get successful confirmation', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({ temperature: 60 });

    // 💡 TIP: Uncomment me to realize why this test fails
    // // Act
    const receivedResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // // Assert
    expect(receivedResponse.status).toBe(200);
  });

  // ✅ TASK: Fix the failing test above 👆 by intercepting the network call and replying with some sensible default
  // 💡 TIP: Many tests will need to avoid doing network requests, put this interception within some test hook
  // 💡 TIP: This is the basic nock syntax: nock('http://localhost').get(/notification.*/).reply(200, {success: true,});

  // ✅ TASK: Ensure to clean-up all the defined nocks after each test. Let each test start with a clean slate!
  // 💡 TIP: Sometimes tests do modify some network/services reply, further tests might fail because of these changes
  // 💡 TIP: nock.cleanAll() function cleans up all the existing interceptions

  // ✅ TASK: Write the following test below
  // 💡 TIP: Since you defined a default nock for all the calls to /notification, we need to define here
  //  a new nock with unique URL
  test('When temperature is above 50, then the right notification should be sent', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 51,
      notificationCategory: getShortUnique(),
    });
    // ✅ Best Practice
    let notificationPayload;
    nock('http://localhost')
      .post(
        `/notification/${eventToAdd.notificationCategory}`,
        (payload) => (notificationPayload = payload),
      )
      .reply(200, {
        success: true,
      });
    // 💡 TIP: You need to define here a new nock, so you can listen to it and ensure that the call did happen
    // 💡 TIP: Since there is already a nock defined for this address, this new nock must has a unique address.
    // Note that the notification URL contains the notificationCategory, so you can generate unique notificationCategory
    // and the URL will have an address that is unique to this test

    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    expect(notificationPayload).toMatchObject({
      title: expect.any(String),
      id: expect.any(Number),
    });
  });

  // ✅ TASK: In the test above that checks for notification, ensure that the request body was valid. Otherwise, our code
  //  might fail to issue the right request (e.g. drop important properties) and the test will not discover this
  // 💡 TIP: nock allows getting the request body using its constructor: nock(url).post(url, (body)=>{your function})
  // Use this function to set a local variable in the test with the body. Then on the assertion phase, check the content of this variable

  // ✅ TASK: Write the following test below
  test('When emitting a new event and the notification service replies with 500 error, then the added event was still saved successfully', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 80, //💡 TIP: We need high temperature to trigger notification
      notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
    });
    nock('http://localhost')
      .post(
        `/notification/${eventToAdd.notificationCategory}`,
        (payload) => (notificationPayload = payload),
      )
      .delay(100)
      .once(2)
      .reply(500);

    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    // 💡 TIP: It's not about the response rather about checking that it was indeed saved and retrievable
    // 💡 TIP: Whenever possible always use a public API/REST and not a direct call the DB layer
  });
});

// ✅🚀 There is some naughty code that is issuing HTTP requests without our awareness! Find it and nock it!
// 💡 TIP: When approaching real HTTP requests during testing, this might incur costs, performance issues and mostly flakiness
// 💡 TIP: Nock allows you to prevent this using the command nock.enableNetConnect(). Just make sure to allow 127.0.0.1 calls since this is the internal API

// ✅🚀 TASK: Write the same test like above 👆, but this time when the response arrives with some delay
// 💡 TIP: Some code contains races between multiple tasks (e.g. Promise.race), for example when waiting for the request for sometime
// and after sometime invoking alternative code. If the request will bounce too quick - The alternative path will never be tested
// 💡 TIP: Nock is capable of simulating delays: nock(url).post(path).delay(timeInMillisecond)

// ✅🚀 TASK: Write the same test like above 👆, but this time when the request is timed-out. In other words, when
// the remote service does not reply at all, we are still able to progress and save the event
// 💡 TIP: Nock is capable of simulating timeouts without waiting for the actual timeout
// Here's nock syntax: nock(url).post(path).delay(timeInMillisecond). Choose delay value that is just a bit bigger than Axios default

// ✅🚀 TASK: Write the following test below which
// 💡 TIP: This test is about a hot Microservice concept: Circuit-breaker (retrying requests)
test('When emitting event and the notification service fails once, then a notification is still being retried and sent ', async () => {
  const eventToAdd = getSensorEvent({
    temperature: 80, //💡 TIP: We need high temperature to trigger notification
    notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
  });
  nock('http://localhost')
    .post(`/notification/${eventToAdd.notificationCategory}`)
    .times(2)
    .reply(500);
  nock('http://localhost')
    .post(`/notification/${eventToAdd.notificationCategory}`)
    .reply(200, { success: true });

  // Act
  const savedEvent = await request(expressApp)
    .post('/sensor-events')
    .send(eventToAdd);

  // Assert
  const receivedResponse = await request(expressApp).get(
    `/sensor-events/${savedEvent.body.id}`,
  );
  expect(receivedResponse).toMatchObject({
    status: 200,
    body: { notificationSent: true },
  });

  // 💡 TIP: Make nock return an error response once, then make it succeed in the 2 time
  // 💡 TIP: Syntax: nock(url).post(path).times(1).reply(500)
  // 💡 TIP: The code has retry mechanism built-in, check your test by removing it (sensors-api.js, axiosRetry) and see the test failing
});
