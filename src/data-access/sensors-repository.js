const Sequelize = require('sequelize');
const sequelizeConfig = require('./db-configuration');

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
      // repository.sync({ force: true });
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
  }

  async addSensorsEvent(event) {
    return await sensorEventModel.create(event);
  }

  async getEvents(category, soryBy) {
    console.log(category);
    return await sensorEventModel.findAll({
      order: [['name', 'ASC']],
      where: {
        category,
      },
    });
  }
};
