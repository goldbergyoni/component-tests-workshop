const express = require('express');
const util = require('util');
const axios = require('axios');
const bodyParser = require('body-parser');
const axiosRetry = require('axios-retry');
const SensorsDal = require('../data-access/sensors-repository');
const validationService = require('../domain/validation-service');
axiosRetry(axios, { retries: 3 });

const initializeAPI = () => {
  const expressApp = express();
  const router = express.Router();
  expressApp.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );
  expressApp.use(bodyParser.json());
  expressApp.listen();

  // add new event
  router.post('/sensor-events', async (req, res, next) => {
    console.log(
      `Sensors events was called to add new event ${util.inspect(req.body)}`,
    );
    
    const eventToHandle = req.body;
    let { temperature, category, notificationCategory } = eventToHandle;
    validationService(eventToHandle);

    // validation
    if (!temperature || !category) {
      return res.status(400).end();
    }

    if (temperature > 50 || (category === 'kids-room' && temperature > 30)) {
      const id = Math.ceil(Math.random() * 1000);
      if (!notificationCategory) {
        notificationCategory = 'default';
      }

      try {
        await axios.post(
          `http://localhost/notification/${notificationCategory}`,
          {
            title: 'Something critical happened',
            id,
          },
        );
        eventToHandle.notificationSent = true;
      } catch (error) {
        eventToHandle.notificationSent = false;
        console.log(
          `Don't want to stop because of this notification error ${error}`,
        );
      }
    }

    // save to DB (Caution: simplistic code without layers and validation)
    const sensorsRepository = new SensorsDal();
    const DBResponse = await sensorsRepository.addSensorsEvent(eventToHandle);

    return res.json(DBResponse);
  });

  router.get('/sensor-events/:id', async (req, res, next) => {
    const sensorsRepository = new SensorsDal();
    const sensorToReturn = await sensorsRepository.getSensorById(req.params.id);
    res.json(sensorToReturn);
  });

  // get existing events with filters
  router.get('/sensor-events/:category/:sortBy', async (req, res, next) => {
    const sensorsRepository = new SensorsDal();
    const sensorsToReturn = await sensorsRepository.getEventsByCategory(
      req.params.category,
      req.params.sortBy,
    );
    res.json(sensorsToReturn);
  });

  // get alle vents
  router.get('/sensor-events/', async (req, res, next) => {
    const sensorsRepository = new SensorsDal();
    const sensorsToReturn = await sensorsRepository.getAllEvents();
    console.log(JSON.stringify(sensorsToReturn[0]));
    res.json(sensorsToReturn);
  });

  expressApp.use('/', router);

  return expressApp;
};

module.exports = {
  initializeAPI,
};
