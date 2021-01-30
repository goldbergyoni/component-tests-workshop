module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('SensorEvents', {
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
      notificationSent: {
        type: Sequelize.BOOLEAN,
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    }),

  down: (queryInterface, Sequelize) => queryInterface.dropTable('SensorEvents'),
};
