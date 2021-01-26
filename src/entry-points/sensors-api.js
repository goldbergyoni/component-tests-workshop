const express = require('express');
const util = require('util');
const axios = require('axios');
const bodyParser = require('body-parser');
const SensorsDal = require('../data-access/sensors-repository');

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
    const { temperature, category } = req.body;

    // validation
    if (!temperature || !category) {
      return res.status(400).end();
    }

    if (temperature > 50 || (category === 'kids-room' && temperature > 30)) {
      const notificationRequest = (
        await axios.get('http://localhost/notification')
      ).data;
    }

    // save to DB (Caution: simplistic code without layers and validation)
    const sensorsRepository = new SensorsDal();
    const DBResponse = await sensorsRepository.addSensorsEvent(req.body);

    return res.json(DBResponse);
  });

  router.get('/sensor-events/:id', async (req, res, next) => {
    const sensorsRepository = new SensorsDal();
    const sensorToReturn = await sensorsRepository.getSensorById(req.params.id);
    res.json(sensorToReturn);
  });

  // get existing events
  router.get('/sensor-events/:category/:sortBy', async (req, res, next) => {
    const sensorsRepository = new SensorsDal();
    const sensorsToReturn = await sensorsRepository.getEvents(
      req.params.category,
      req.params.sortBy,
    );
    res.json(sensorsToReturn);
  });

  expressApp.use('/', router);

  return expressApp;
};

module.exports = {
  initializeAPI,
};
