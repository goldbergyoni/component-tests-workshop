const request = require('supertest');
const nock = require('nock');
const sinon = require('sinon');

const {
  startWebServer,
  stopWebServer,
} = require('../src/entry-points/sensors-api');

const { getSensorEvent } = require('./test-helper');
const SensorsRepository = require('../src/data-access/sensors-repository');
const { AppError, metricsExporter } = require('../src/error-handling');
const SensorsService = require('../src/domain/sensors-service');
const { Error } = require('sequelize');
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
});
//Good luck!!!
afterEach(() => {
  sinon.restore();
  nock.cleanAll();
});

describe('Monitoring tests', () => {
  test('When adding an event without category, Then get back error 400', async () => {
    const eventToAdd = getSensorEvent({ category: undefined });

    // Act
    const receivedResult = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(receivedResult.status).toBe(400);
  });

  test('When an internal unknown error occurs during request, Then get back 500 error', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    sinon
      .stub(SensorsService.prototype, 'addEvent')
      .rejects(new Error('Error!'));

    // Act
    const receivedResult = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(receivedResult.status).toBe(500);
  });

  test('When an internal error occurs during request, Then the logger writes the right error', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    const error = new Error('this specific error');
    sinon.stub(SensorsService.prototype, 'addEvent').rejects(error);
    const spyOnLogger = sinon.spy(console, 'error');

    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    expect(spyOnLogger.calledOnce).toBe(true);
    expect(spyOnLogger.args[0]).toMatchObject([error]);
  });

  test('When an internal error occurs during request, Then a metric is fired', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    sinon
      .stub(SensorsService.prototype, 'addEvent')
      .rejects(new Error('Error'));
    const spyOnMetricsExporter = sinon.spy(metricsExporter, 'fireMetric');

    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    expect(spyOnMetricsExporter.calledOnce).toBe(true);
    expect(spyOnMetricsExporter.args[0]).toMatchObject([
      'error',
      { errorName: 'SequelizeBaseError' },
    ]);
  });

  test('When an internal NON-TRUSTED error occurs during request, Then the process exits', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    sinon
      .stub(SensorsService.prototype, 'addEvent')
      .rejects(new AppError('db-is-unaccessible', false, 500));
    const listenToProcessExit = sinon.stub(process, 'exit');
    // TODO: Why can't I do the same with these stubs + .get('/sensor-events')?
    // sinon
    //   .stub(SensorsService.prototype, 'getAllEvents')
    //   .rejects(new Error('Error'));
    // sinon
    //   .stub(SensorsRepository.prototype, 'getAllEvents')
    //   .rejects(new AppError('db-is-unaccessible', false, 500));

    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);
    // await request(expressApp).get('/sensor-events');

    // Assert
    expect(listenToProcessExit.calledOnce).toBe(true);
  });

  // ✅🚀 TASK: Check that when uncaught error is thrown, the logger writes the mandatory fields and the process exits
  // 💡 TIP: The event process.on('uncaughtException' , yourCallBack) fires when an error is not caught and will lead to
  // non-documented crash!
  test('When uncaught exception is thrown, then logger writes the mandatory fields and the process exits', async () => {
    // Arrange
    const listenToProcessExit = sinon.stub(process, 'exit');

    // Act
    process.emit(
      'uncaughtException',
      new AppError('uncaught exception', false, 500),
    );

    // Assert
    expect(listenToProcessExit.calledOnce).toBe(true);
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

        // 💡 TIP: We should listen here to the logger and metrics exporter - This is how we know that errors were handled
        const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');
        const consoleErrorDouble = sinon.stub(console, 'error');

        //Act
        // 💡 TIP: Approach the API like in any other test

        //Assert
        // 💡 TIP: Check that the consoleErrorDouble, metricsExporterDouble were indeed called
      },
    );
  });
});

// ✅🚀 TASK: Test that when the any startup method fails (one that happens before Express is ready), the process do exit
// 💡 TIP: If our process is not being able to startup, there is no point in staying alive. This is called a 'zombie' process.
// 💡 TIP: Since the webserver starts before the tests, you test would need to stub some method and then initialize a new webserver
