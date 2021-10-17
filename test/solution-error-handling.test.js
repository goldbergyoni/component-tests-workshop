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
const SensorsRepository = require('../src/data-access/sensors-repository');
const { AppError, metricsExporter } = require('../src/error-handling');
let expressApp;

beforeAll(async (done) => {
  expressApp = await startWebServer();
  done();
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
  // 💡 TIP: This is needed because some of the errors that are triggered will cause the process to exit
  // For testing purposes only, we wish to avoid exiting
  sinon.stub(process, 'exit');
});

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
    sinon
      .stub(SensorsRepository.prototype, 'addSensorsEvent')
      .rejects(new AppError('db-is-unaccessible', true, 500));

    // Act
    const receivedResult = await request(expressApp)
      .post('/sensor-events')
      .send(eventToAdd);

    // Assert
    expect(receivedResult.status).toBe(500);
  });

  // ✅ TASK: Code the following test below
  // 💡 TIP: Typically we try to avoid mocking our own code. However, this is neccessary for testing error handling
  // and a good case to make an exception for
  test('When an internal error occurs during request, Then the logger writes an error', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    sinon
      .stub(SensorsRepository.prototype, 'addSensorsEvent')
      .rejects(new AppError('db-is-unaccessible', true, 500));
    const spyOnLogger = sinon.spy(console, 'error');

    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    expect(spyOnLogger.lastCall.firstArg).toMatchObject({
      name: 'db-is-unaccessible',
      stack: expect.any(String),
      message: expect.any(String),
    });
  });

  // ✅ TASK: Code the following test below
  test('When an internal error occurs during request, Then a metric is fired', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    sinon
      .stub(SensorsRepository.prototype, 'addSensorsEvent')
      .rejects(new AppError('db-is-unaccessible', true, 500));
    const spyOnLogger = sinon.spy(console, 'error');

    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    expect(spyOnLogger.called).toBe(true);
  });

  // ✅ TASK: Code the following test below
  test('When an internal NON-TRUSTED error occurs during request, Then the process exits', async () => {
    // Arrange
    const eventToAdd = getSensorEvent();
    sinon
      .stub(SensorsRepository.prototype, 'addSensorsEvent')
      .rejects(new AppError('db-is-unaccessible', false, 500));
    if (process.exit.restore) {
      process.exit.restore();
    }
    const listenToProcessExit = sinon.stub(process, 'exit');
    // Act
    await request(expressApp).post('/sensor-events').send(eventToAdd);

    // Assert
    expect(listenToProcessExit.called).toBe(true);
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
    const spyOnLogger = sinon.spy(console, 'error');

    // Act
    process.emit(
      'unhandledRejection',
      new AppError('something-bad', false, 500, 'something really bad'),
    );

    // Assert
    expect(listenToProcessExit.called).toBe(true);
    expect(spyOnLogger.lastCall.firstArg).toMatchObject({
      name: 'something-bad',
      stack: expect.any(String),
      message: expect.any(String),
    });
  });

  describe('Various Error Types', () => {
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
        //Arrange
        const eventToAdd = getSensorEvent();
        sinon
          .stub(SensorsRepository.prototype, 'addSensorsEvent')
          .rejects(errorInstance);
        const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');
        const consoleErrorDouble = sinon.stub(console, 'error');

        //Act
        await request(expressApp).post('/sensor-events').send(eventToAdd);

        //Assert
        expect(metricsExporterDouble.called).toBe(true);
        expect(consoleErrorDouble.called).toBe(true);
      },
    );
  });
});
