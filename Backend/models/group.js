'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {}
  }
  Group.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    }, 
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userIDs: {
      type: DataTypes.JSON
    }
  }, {
    sequelize,
    tableName: 'groups',
    timestamps: false,
    modelName: 'Group',
  });
  return Group;
};