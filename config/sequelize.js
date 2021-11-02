const { Sequelize } = require('sequelize');
const config = require('./database');
const sequelize = new Sequelize(
    config.database,
    config.connection.user,
    config.connection.password, 
    {
        host: config.connection.host,
        dialect: 'mysql'
    }
);

module.exports = sequelize