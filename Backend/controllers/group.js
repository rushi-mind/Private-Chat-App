const db = require('../models');

const postGroup = (async (req, res) => {
    let { groupName, IDs } = req.body;
    let group = await db.Group.create({ name: groupName, userIDs: IDs });
    if(group && group.id) return res.send({ status: 1, groupID: group.id });
    res.send({ status: 0 });
});

const getGroups = (async (req, res) => {
    try {
        let query = `SELECT \`id\`, \`name\` FROM \`groups\` WHERE userIDs->'$."${req.params.userID}"' = true;`
        console.log(query);
        let temp = (await db.sequelize.query(query))[0];
        // let groupIDs = [];
        // temp.forEach(current => {
        //     groupIDs.push(current.id);
        // });
        // console.log('came here: ', groupIDs);
        res.send({status: 1, data: temp});
    } catch(error) {
        res.send({status: 0});
    }
}); 

module.exports = { postGroup, getGroups };