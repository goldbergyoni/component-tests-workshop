// 🏅 Your mission is to create your first integration tests here 💜
// ✅ Whenever you see this icon, there's a TASK for you
// ✅🚀 This symbol represents an advanced task
// 💡 - This is an ADVICE symbol, it will appear nearby most tasks and help you in fulfilling the tasks
const jestOpenAPI = require('jest-openapi').default;
const apiDoc = require("../src/openapi.json");
jestOpenAPI(apiDoc);

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
  nock.emitter.on('no match', req => {
    console.warn(`Unmatched request by nock: Method: ${req.method} Path: ${(req.path)}`)
  })
});

afterAll(async () => {
  await stopWebServer();
  nock.cleanAll();
});

beforeEach(() => { });

afterEach(() => { 
  nock.cleanAll()
});

describe('Sensors test', () => {
  // ✅ TASK: Uncomment this test and run it. It will fail. Do you understand why?
  // 💡 TIP: When setting high temperature event, then a notification is sent with HTTP request. This URL/Service are not available on your local machine
  test('When adding a valid event, Then should get successful confirmation', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({ temperature: 60 });
    nock('http://localhost').post('/notification/default').reply(200, { success: true });
    // 💡 TIP: Uncomment me to make this test fail and realize why
    // // Act
    const receivedResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(receivedResponse.status).toBe(200);
  });

  // ✅ TASK: Fix the failing test above 👆 which trigger a network call to a service that is not installed locally (notification)
  //  Intercepting the network call and replying with some sensible default. Nock is a good tool for this mission
  // 💡 TIP: Many tests will need to avoid doing network requests, put this interception within some a test hook that affect all the tests
  // 💡 TIP: This is the basic nock syntax: nock('http://localhost').post('/notification/default').reply(200, { success: true });

  // ✅ TASK: Ensure to clean-up all the defined nocks after each test. Let each test start with a clean slate!
  // 💡 TIP: Sometimes tests do modify some network/services reply, further tests might fail because of these changes
  // 💡 TIP: nock.cleanAll() function cleans up all the existing interceptions

  // ✅ TASK: Write the following test below
  test('When temperature is above 50, then the right notification should be sent', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 51,
      notificationCategory: getShortUnique(),
    });
    let notificationPayload;

    // 💡 TIP: You need to define here a new nock, so you can listen to it and ensure that the call did happen
    // 💡 TIP: Since there is already a nock defined for this address, this new nock must has a unique address.
    // How to achieve this: The notification URL contains the notificationCategory, so you can generate unique notificationCategory
    // and the URL will have an address that is unique to this test 
    const scope = nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`,
      (payload) => (notificationPayload = payload),
    ).reply(200, { success: true, });


    // Act
    const receivedResponse = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    // 💡 TIP: When defining a nock, it returns a scope object: const scope = nock(url).post(path)
    // You may call whether this URL was called using - scope.isDone()
    expect(receivedResponse).toMatchObject({
      status: 200,
      body: {
        notificationCategory: eventToAdd.notificationCategory
      }
    })
    expect(scope.isDone())
    expect(notificationPayload).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String)
    })
  });

  // ✅ TASK: In the test above that checks for notification, ensure that the request body was valid. Otherwise, our code
  //  might fail to issue the right request (e.g. factor invalid body) and the test will not discover this
  // 💡 TIP: nock allows getting the request body using its constructor: nock(url).post(url, (body)=>{your function save the body in a test variable})
  // After doing this, the variable notificationPayload will hold the body. On the Assert phase, ensure that it contains the right schema or data

  // ✅ TASK: Write the following test below
  test('When emitting a new event and the notification service replies with 500 error, then the added event was still saved successfully', async () => {
    // Arrange
    const eventToAdd = getSensorEvent({
      temperature: 80, //💡 TIP: We need high temperature to trigger notification
      notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
    });
    // 💡 TIP: Set here a nock that replies with 500: nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`)
    nock.enableNetConnect("127.0.0.1")
    nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`).reply(500)
    
    // Act
    const addEventResult = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);
    // Assert
    // 💡 TIP: It's not about the response rather about checking that it was indeed saved and retrievable
    // 💡 TIP: Whenever possible always use a public API/REST and not a direct call the DB layer
    const getEventResult = await request(expressApp)
      .get('/sensor-events' + `/${addEventResult.body.id}`)

    // Assert
    // 💡 TIP: Check not only the HTTP status bot also the body
    expect(getEventResult).toMatchObject({
      status: 200, body: addEventResult.body
    });
  });
});

// ✅ There is some naughty code that is issuing HTTP requests without our awareness! Find it and nock it!
// 💡 TIP: When approaching real HTTP requests during testing, this might incur costs, performance issues and mostly flakiness
// 💡 TIP: Nock allows you to prevent this using the command nock.enableNetConnect(). Just make sure to allow 127.0.0.1 calls since this is the internal API

// ✅ When this tets suite (file) is done, ensure to clean-up and enable network requests - Maybe other test files do wish to approach external resources
// 💡 TIP: Nock intercepts any calls within the same process. Anything that is not reset here will affect the next tests

// ✅🚀 Some of the code HTTP calls outside might not match the existing defined nocks, in this case nock won't intercept these calls
// This will lead to unplanned flows, or failures that are hard to understand. Fix this by emitting a colorful warning to the console when there is no matching nock
// Simulate this situation by adding a new HTTP call in the code and see how it behaves
// 💡 TIP: nock exposes an event nock.emitter.on('no match', req => {})

// ✅🚀  TASK: Write the same test like above 👆, but this time when the response arrives with some delay
// 💡 TIP: Some code contains races between multiple tasks (e.g. Promise.race), for example when waiting for the request for sometime
// and after sometime invoking alternative code. If the request will always bounce back too quick - The alternative path will never be tested
// 💡 TIP: Nock is capable of simulating delays: nock(url).post(path).delay(timeInMillisecond)
test('When emitting a new event and the notification service replies with 500 error with delay, then the added event was still saved successfully', async () => {
  // Arrange
  const eventToAdd = getSensorEvent({
    temperature: 80, //💡 TIP: We need high temperature to trigger notification
    notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
  });
  // 💡 TIP: Set here a nock that replies with 500: nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`)

  nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`).delay(3000).reply(500)
  
  // Act
  const addEventResult = await request(expressApp)
    .post('/sensor-events')
    .send(eventToAdd);
  // Assert
  // 💡 TIP: It's not about the response rather about checking that it was indeed saved and retrievable
  // 💡 TIP: Whenever possible always use a public API/REST and not a direct call the DB layer
  const getEventResult = await request(expressApp)
    .get('/sensor-events' + `/${addEventResult.body.id}`)

  // Assert
  // 💡 TIP: Check not only the HTTP status bot also the body
  expect(getEventResult).toMatchObject({
    status: 200, body: addEventResult.body
  });
});

// ✅🚀 TASK: Write the same test like above 👆, but this time when the request is timed-out. In other words, when
// the remote service does not reply at all, we are still able to progress and save the event
// 💡 TIP: Nock is capable of simulating timeouts without waiting for the actual timeout
// Here's nock syntax: nock(url).post(path).delay(timeInMillisecond). Choose delay value that is just a bit bigger than Axios default
test('When emitting a new event and the notification service timing out, then the added event was still saved successfully', async () => {
  // Arrange
  const eventToAdd = getSensorEvent({
    temperature: 80, //💡 TIP: We need high temperature to trigger notification
    notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
  });

  nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`).delay(3000)
  
  // Act
  const addEventResult = await request(expressApp)
    .post('/sensor-events')
    .send(eventToAdd);
  // Assert
  // 💡 TIP: It's not about the response rather about checking that it was indeed saved and retrievable
  // 💡 TIP: Whenever possible always use a public API/REST and not a direct call the DB layer
  const getEventResult = await request(expressApp)
    .get('/sensor-events' + `/${addEventResult.body.id}`)

  // Assert
  // 💡 TIP: Check not only the HTTP status bot also the body
  expect(getEventResult).toMatchObject({
    status: 200, body: addEventResult.body
  });
});

// ✅🚀 TASK: Write the following test below
// 💡 TIP: This test is about an important Microservice concept: resiliency (retrying requests)
test('When emitting event and the notification service fails once, then a notification is still being retried and sent successfully', async () => {
  // 💡 TIP: Make nock return an error response once, then make it succeed in the 2nd time
  // 💡 TIP: Syntax: nock(url).post(path).times(1).reply(500)
  // 💡 TIP: The code has retry mechanism built-in, check your test by removing it (sensors-api.js, axiosRetry) and see the test failing

  const eventToAdd = getSensorEvent({
    temperature: 80, //💡 TIP: We need high temperature to trigger notification
    notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
  });

  nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`).reply(500)
  const retryScope = nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`).reply(200, { success: true })
  
  // Act
  const addEventResult = await request(expressApp)
    .post('/sensor-events')
    .send(eventToAdd);
  // Assert
  // 💡 TIP: It's not about the response rather about checking that it was indeed saved and retrievable
  // 💡 TIP: Whenever possible always use a public API/REST and not a direct call the DB layer
  const getEventResult = await request(expressApp)
    .get('/sensor-events' + `/${addEventResult.body.id}`)

  // Assert
  // 💡 TIP: Check not only the HTTP status bot also the body
  expect(getEventResult).toMatchObject({
    status: 200, body: addEventResult.body
  });
  expect(retryScope.isDone())
});

// ✅🚀 TASK: Ensure that if a response is not aligned with the OpenAPI (Swagger), then the tests will catch this issue
// 💡 TIP: In the root of the code, you may find the file openapi.json that documents the APIs
// 💡 TIP: Use jest-open-api tool to help with this mission:
// https://www.npmjs.com/package/jest-openapi
//💡 TIP: If you want to apply this to all tests, put this assertion as axios extension
test('When response is not aligned with official doc, the test should fail', async () => {
  const eventToAdd = getSensorEvent({
    temperature: 80, //💡 TIP: We need high temperature to trigger notification
    notificationCategory: getShortUnique(), //💡 TIP: Unique category will lead to unique notification URL. This helps in overriding the nock
  });
  nock('http://localhost').post(`/notification/${eventToAdd.notificationCategory}`).reply(200, { success: true })
  
  // Act
  const addEventResult = await request(expressApp)
    .post('/sensor-events')
    .send(eventToAdd);
  // Assert
  // 💡 TIP: It's not about the response rather about checking that it was indeed saved and retrievable
  // 💡 TIP: Whenever possible always use a public API/REST and not a direct call the DB layer
  const getEventResult = await request(expressApp)
    .get('/sensor-events' + `/${addEventResult.body.id}`)

  // Assert
  expect(getEventResult).toSatisfyApiSpec()
})
