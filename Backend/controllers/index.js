const { signup, login } = require('./auth');
const { postGroup, getGroups } = require('./group');
const { getUsers } = require('./user');

module.exports = { signup, login, postGroup, getGroups, getUsers };