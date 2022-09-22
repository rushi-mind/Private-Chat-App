const db = require('../models');

const getUsers = (async (req, res) => {
    let users = await db.User.findAll({attributes: ['id', 'name']});
    res.send(users);
});

module.exports = { getUsers };