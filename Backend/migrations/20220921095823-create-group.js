'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      }, 
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userIDs: {
        type: Sequelize.JSON
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('groups');
  }
};