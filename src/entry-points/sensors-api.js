const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const SensorsService = require('../domain/sensors-service');
const { errorHandler, AppError } = require('../error-handling');
const { default: axios } = require('axios');

let serverConnection;

const startWebServer = async () => {
  return new Promise((resolve, reject) => {
    const expressApp = express();

    expressApp.use(
      bodyParser.urlencoded({
        extended: true,
      }),
    );
    expressApp.use(bodyParser.json());
    defineAllRoutes(expressApp);
    registerErrorHandling(expressApp);

    const webServerPort = process.env.PORT ? process.env.PORT : null;
    serverConnection = expressApp.listen(webServerPort, () => {
      resolve(expressApp);
    });
  });
};

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    serverConnection.close(() => {
      resolve();
    });
  });
};

function defineAllRoutes(expressApp) {
  const router = express.Router();

  // 📖 add new event - Schema example
  //   category: `Home equipment`,
  //   temperature: 20,
  //   reason: `Thermostat-failed`, // This must be unique
  //   color: 'Green',
  //   weight: 80,
  //   status: 'active',
  //   notificationCategory: 'default',
  router.post('/sensor-events', async (req, res, next) => {
    try {
      console.log(
        `The sensors events was called to add new event ${util.inspect(
          req.body,
        )}`,
      );
      const sensorsService = new SensorsService();
      const response = await sensorsService.addEvent(req.body);
      let returnedHTTPStatus = 200;
      if (response.notificationSent === false) {
        returnedHTTPStatus = 202;
      }

      res.status(returnedHTTPStatus).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/sensor-events/:id', async (req, res, next) => {
    const sensorsService = new SensorsService();
    const sensorToReturn = await sensorsService.getSensorById(req.params.id);

    if (!sensorToReturn) {
      return res.status(404).json(sensorToReturn);
    }
    res.json(sensorToReturn);
  });

  router.delete('/sensor-events/:id', async (req, res, next) => {
    const sensorsService = new SensorsService();
    const sensorToReturn = await sensorsService.deleteSensorById(req.params.id);
    res.json(sensorToReturn);
  });

  // get existing events with filters
  router.get('/sensor-events/:category/:sortBy', async (req, res, next) => {
    const sensorsService = new SensorsService();
    const sensorToReturn = await sensorsService.getEventsByCategory(
      req.params.category,
      req.params.sortBy,
    );

    res.json(sensorToReturn);
  });

  // get alle vents
  router.get('/sensor-events/', async (req, res, next) => {
    const sensorsService = new SensorsService();
    const sensorsToReturn = await sensorsService.getAllEvents();

    res.json(sensorsToReturn);
  });

  expressApp.use('/', router);
}

function registerErrorHandling(expressApp) {
  expressApp.use(async (error, req, res, next) => {
    if (typeof error === 'object') {
      if (error.isTrusted === undefined || error.isTrusted === null) {
        error.isTrusted = true; //Error during a specific request is usually not catastrophic and should not lead to process exit
      }
    }
    await errorHandler.handleError(error);
    res.status(error.status || 500).end();
  });

  process.on('uncaughtException', (error) => {
    errorHandler.handleError(error);
  });

  process.on('unhandledRejection', (reason) => {
    errorHandler.handleError(reason);
  });
}

module.exports = {
  startWebServer,
  stopWebServer,
};
