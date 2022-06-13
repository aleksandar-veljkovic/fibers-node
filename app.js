const awilix = require('awilix');
const database = require('./services/database/database');
const API = require('./services/api/api');
const Utils = require('./services/utils/utils');

class App {
  constructor(config) {
    // Preparing Awilix container
    const container = awilix.createContainer();

    // Load Models
    container.loadModules([
      './models/*-model.js',
    ],
    {
      formatName: 'camelCase',
      resolverOptions: {
        injectionMode: awilix.InjectionMode.PROXY,
        register: awilix.asValue,
        lifetime: awilix.Lifetime.SINGLETON,
      },
    });

    // Load Controllers
    container.loadModules([
      './controllers/*-controller.js',
    ],
    {
      formatName: 'camelCase',
      resolverOptions: {
        injectionMode: awilix.InjectionMode.PROXY,
        register: awilix.asClass,
        lifetime: awilix.Lifetime.SINGLETON,
      },
    });

    // Register services
    container.register({
      config: awilix.asValue(config),
      db: awilix.asValue(database(config)),
      api: awilix.asClass(API, { lifetime: awilix.Lifetime.SINGLETON }),
      utils: awilix.asClass(Utils, { lifetime: awilix.Lifetime.SINGLETON }),
    });

    this.utils = container.resolve('utils');
    this.db = container.resolve('db');
    this.api = container.resolve('api');

    // Starting system
    (async () => {
      // Initializing database
      this.utils.log('Synchronizing database...');
      await this.db.sync({ alter: true });

      // Initializing API
      this.api.start();
    })();
  }
}

module.exports = App;
