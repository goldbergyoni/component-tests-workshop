// 🏅 Your mission is to create your first integration tests here 💜
// 🏝 Monitoring island
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
const SensorsRepository = require('../src/data-access/sensors-repository');
const { AppError, metricsExporter } = require('../src/error-handling');
const SensorsDal = require("../src/data-access/sensors-repository");
let expressApp;

beforeAll(async () => {
  expressApp = await startWebServer();
});

afterAll(async () => {
  await stopWebServer();
});

beforeEach(() => {
  nock('http://localhost')
    .post('/notification/default')
    .reply(200, {
      success: true,
    })
    .persist();
  // 💡 TIP: This is needed because some errors that are triggered will cause the process to exit
  // For testing purposes only, we wish to avoid exiting
  sinon.stub(process, 'exit');
});
//Good luck!!!
afterEach(() => {
  sinon.restore();
  nock.cleanAll();
});

describe('Sensors test', () => {
  // ✅ TASK: Code the following test below
  // 💡 TIP: Researches show that the vast majority of production downtime are caused by incorrect error handling
  // There are few things that are as important as testing your error handling
  test('When adding an event without category, Then get back error 400', async () => {
    // Arrange
    // 💡 TIP: See below how we explicitly define and emphasize what's wrong with the input
    // 💡 TIP: When using external helpers, make it clear for the test reader what is happening
    const eventToAdd = getSensorEvent({ category: undefined });

    // Act
    const receivedResult = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
      expect(receivedResult.status).toBe(400);
  });

  // ✅ TASK: Code the following test below
  test('When an internal unknown error occurs during request, Then get back 500 error', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    // 💡 TIP: Let's make some internal method throw an error, this concept is called "Test doubles" or "Mocking"
    // 💡 TIP: Use the library sinon or jest to stub/mock some internal function and make it return an error. Example:
    sinon
      .stub(SensorsDal.prototype, 'addSensorsEvent')
      .rejects(new AppError('db-is-unaccessible', true, 500));

    // 💡 TIP: Replace here above 👆 'someClass' with one the code internal classes like the sensors service or DAL
    //   Replace 'someMethod' with a method of this class that is called during adding flow. Choose an async method
  //Act
    const addAPIResponse = await request(expressApp).post("/sensor-events").send(eventToAdd);
    //Assert
    expect(addAPIResponse.status).toBe(500)

  });

  // ✅ TASK: Code the following test below
  // 💡 TIP: Typically we try to avoid mocking our own code. However, this is necessary for testing error handling
  // and a good case to make an exception for
  test('When an internal error occurs during request, Then the logger writes the right error', async () => {
    // Arrange
    // 💡 TIP: We use Sinon, test doubles library, to listen ("spy") to the logger and ensure that it was indeed called
    const eventToAdd = getSensorEvent();
    const spyOnLogger = sinon.spy(console, 'error');
    sinon
        .stub(SensorsDal.prototype, 'addSensorsEvent')
        .rejects(new AppError('db-is-unaccessible', true, 500));
    // Act
    const addAPIResponse = await request(expressApp).post("/sensor-events").send(eventToAdd);

    // Assert
    // 💡 Use the variable 'spyOnLogger' to verify that the console.error was indeed called. If not sure how, check Sinon spy documentation:
    // https://sinonjs.org/releases/latest/spies/
    // 💡 TIP: Check not only that the logger was called but also with the right properties
    // 💡 TIP: In real-world code we don't use the Console for logging. However the testing techniques would be the same
    expect(spyOnLogger.calledOnce).toBeTruthy();
  });

  // ✅ TASK: Code the following test below
  // 💡 TIP: Metrics are one of the core technique to properly monitor a component - Whenever anything significant
  // is happening, the code emits a metric object which arrives to the monitoring service. Testing that metrics are
  // indeed fired is critical
  test('When an internal error occurs during request, Then a metric is fired', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    const spyOnMetric = sinon.spy(metricsExporter, 'fireMetric');
    sinon
        .stub(SensorsDal.prototype, 'addSensorsEvent')
        .rejects(new AppError('db-is-unaccessible', true, 500));
    // Act
    const addAPIResponse = await request(expressApp).post("/sensor-events").send(eventToAdd);
    // 💡 TIP: Use Sinon here to listen to the metricsExporter object, see the file: src/error-handling, it has a class 'metricsExporter'
    // 💡 TIP: This is very similar to the last test, only now instead of listening to the logger - We should listen to the metric exporter
   // Assert
    expect(spyOnMetric.calledOnce).toBeTruthy();
  });

  // ✅🚀 TASK: Code the following test below
  // 💡 TIP: In Node.js, it's common to distinguish between Trusted vs Non-trusted errors. The former are casual errors that
  // happen during requests. The later, are fatal error that might hint that the process is in a bad state -> In this case the error
  // handler usually make the process exit
  test('When an internal NON-TRUSTED error occurs during request, Then the process exits', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    sinon
        .stub(SensorsDal.prototype, 'addSensorsEvent')
        .rejects(new AppError('db-is-unaccessible', false, 500));
    // 💡 TIP: Trigger an error here like the tests above, tag the error as non-trusted
    /*
    Make the DAL throw this error: new AppError('db-is-unaccessible', false, 500)
    */

    // 💡 TIP: Listen here to the process.exit method to check later whether it was called
    if (process.exit.restore) {
      process.exit.restore();
    }
    const listenToProcessExit = sinon.stub(process, 'exit');

    // Act
    const addAPIResponse = await request(expressApp).post("/sensor-events").send(eventToAdd);

    // Assert
    // 💡 TIP: Check here whether process.exit was called
    expect(listenToProcessExit.calledOnce).toBeTruthy();

  });

  // ✅🚀 TASK: Check that when uncaught error is thrown, the logger writes the mandatory fields and the process exits
  // 💡 TIP: The event process.on('uncaughtException' , yourCallBack) fires when an error is not caught and will lead to
  // non-documented crash!
  test('When uncaught exception is thrown, then logger writes the mandatory fields and the process exits', async () => {
    // Arrange
    if (process.exit.restore) {
      process.exit.restore();
    }
    const listenToProcessExit = sinon.stub(process, 'exit');

    // Act
    // 💡 TIP: Explicitly make the process object throw an uncaught exception:
    process.emit('uncaughtException', {name: 'uncaughtException', isTrusted: false});


    // Assert
    expect(listenToProcessExit.calledOnce).toBeTruthy();
  });

  // ✅🚀 TASK: Check the same like above, but for unhandled rejections (throw unhandledRejection, ensure the process and logger behaves as expected)
  // 💡 TIP: The event process.on('unhandledRejection' , yourCallBack) fires when a rejected promise is not caught error is not caught and will lead to
  // non-documented crash!

  // ✅🚀 TASK: Check that for any type of error that is being thrown, whether a valid error object or number or anything else - Our
  //  error handler is capable of handling it
  // 💡 TIP: 3rd party npm libraries sometimes throw all sort of error types like strings, Error or even plain objects
  // 💡 TIP: Use parameterized tests to avoid repeating yourself -> This allows defining multiple scenarios/errors and then
  // code the test only once - The test runner will loop and run the test for every item. Read here more:
  // https://jestjs.io/docs/en/api#testeachtablename-fn-timeout
  describe('Various Error Types', () => {
    // 💡 TIP: Here is a list of all sort of error that might get thrown - Let's see that we can process each item
    test.each`
      errorInstance                       | errorTypeDescription
      ${null}                             | ${'Null as error'}
      ${'This is a string'}               | ${'String as error'}
      ${1}                                | ${'Number as error'}
      ${{}}                               | ${'Object as error'}
      ${new Error('JS basic error')}      | ${'JS error'}
      ${new AppError('error-name', true)} | ${'AppError'}
    `(
      `When throwing $errorTypeDescription, Then it's handled correctly`,
      async ({ errorInstance }) => {
        // 💡 TIP: This is a typical test, only the thrown error is provided here using the param: errorInstance
        //Arrange
        const eventToAdd = getSensorEvent();

        // 💡 TIP: make here some code throw the 'errorInstance' variable
        sinon
            .stub(SensorsDal.prototype, 'addSensorsEvent')
            .rejects(new AppError('errorInstance', true, 500));
        // 💡 TIP: We should listen here to the logger and metrics exporter - This is how we know that errors were handled
        const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');
        const consoleErrorDouble = sinon.stub(console, 'error');

        //Act
        // 💡 TIP: Approach the API like in any other test
        const addAPIResponse = await request(expressApp).post("/sensor-events").send(eventToAdd);

        //Assert
        // 💡 TIP: Check that the consoleErrorDouble, metricsExporterDouble were indeed called
        expect(metricsExporterDouble.calledOnce).toBeTruthy();
        expect(consoleErrorDouble.calledOnce).toBeTruthy();
      },
    );
  });
});

// ✅🚀 TASK: Test that when the any startup method fails (one that happens before Express is ready), the process do exit
// 💡 TIP: If our process is not being able to startup, there is no point in staying alive. This is called a 'zombie' process.
// 💡 TIP: Since the webserver starts before the tests, you test would need to stub some method and then initialize a new webserver
