const Sequelize = require('sequelize');
const sequelizeConfig = require('./config/config');

let repository;
let sensorEventModel;

module.exports = class SensorsRepository {
  constructor() {
    if (!repository) {
      repository = new Sequelize(
        'sensors',
        'myuser',
        'myuserpassword',
        sequelizeConfig,
      );

      sensorEventModel = repository.define('SensorEvent', {
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
        reason: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: true,
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
  }

  async addSensorsEvent(event) {
    return await sensorEventModel.create(event);
  }

  async getEvents(category, sortBy) {
    return await sensorEventModel.findAll({
      order: [[sortBy, 'ASC']],
      where: {
        category,
      },
    });
  }
};
