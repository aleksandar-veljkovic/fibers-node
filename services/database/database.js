const { Sequelize } = require('sequelize');

module.exports = (config) => new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    dialect: config.db.dialect,
    logging: false,
    storage: 'db.sqlite',
  },
);
