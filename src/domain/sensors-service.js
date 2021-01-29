const axios = require('axios');
const axiosRetry = require('axios-retry');
const sanitizeService = require('../domain/sanitize-service');
const SensorsDal = require('../data-access/sensors-repository');

class SensorsEventService {
  async addEvent(eventToHandle) {
    let { temperature, category, notificationCategory } = eventToHandle;
    sanitizeService(eventToHandle);

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

    const sensorsRepository = new SensorsDal();
    const DBResponse = await sensorsRepository.addSensorsEvent(eventToHandle);

    return DBResponse;
  }

  async getSensorById(id) {
    return await new SensorsDal().getSensorById(id);
  }

  async getEventsByCategory(category, sortBy = 'category') {
    return await new SensorsDal().getEventsByCategory(category, sortBy);
  }

  async getAllEvents() {
    return await new SensorsDal().getAllEvents();
  }
}

module.exports = SensorsEventService;
