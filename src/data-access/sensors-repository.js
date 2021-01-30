const Sequelize = require('sequelize');
const { AppError } = require('../error-handling');
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
        notificationSent: {
          type: Sequelize.BOOLEAN,
        },
      });
    }
  }

  async addSensorsEvent(event) {
    try {
      return await sensorEventModel.create(event);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('duplicated-event', true, 409);
      } else {
        throw error;
      }
    }
  }

  async getSensorById(id) {
    return await sensorEventModel.findOne({ where: { id: id } });
  }

  async getEventsByCategory(category, sortBy = 'category') {
    return await sensorEventModel.findAll({
      order: [[sortBy, 'ASC']],
      where: {
        category,
      },
    });
  }

  async getAllEvents() {
    return await sensorEventModel.findAll({});
  }
};
