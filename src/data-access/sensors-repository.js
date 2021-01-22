const Sequelize = require('sequelize');
const sequelizeConfig = require('./db-configuration');

let repository;
let sensorEventModel;

module.exports = class SensorsRepository {
  async initialize() {
    if (!repository) {
      repository = new Sequelize(
        'sensors',
        'myuser',
        'myuserpassword',
        sequelizeConfig,
      );

      sensorEventModel = repository.define('Sensor', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        category: {
          type: Sequelize.STRING,
        },
        color: {
          type: Sequelize.STRING,
        },
        name: {
          type: Sequelize.STRING,
        },
        status: {
          type: Sequelize.STRING,
        },
        weight: {
          type: Sequelize.INTEGER,
        },
        latitude: {
          type: Sequelize.INTEGER,
        },
        longtitude: {
          type: Sequelize.INTEGER,
        },
        temperature: {
          type: Sequelize.INTEGER,
        },
      });
    }

    await repository.sync();
  }

  async addSensorsEvent(event) {
    await this.initialize();
    return await sensorEventModel.create(event);
  }

  async getEvents(category, sortBy) {
    await this.initialize();
    return await sensorEventModel.findAll({
      order: [[sortBy, 'ASC']],
      where: {
        category,
      },
    });
  }
};
