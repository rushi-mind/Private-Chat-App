const router = require('express').Router();
const { signup, login, postGroup, getGroups, getUsers } = require('../controllers');

router.post('/signup', signup);
router.post('/login', login);
router.post('/group', postGroup);
router.get('/groups/:userID', getGroups);
router.get('/users', getUsers);

module.exports = router;