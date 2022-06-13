const App = require('./app');
const rawConfig = require('./config');

let env = 'DEVELOPMENT';

if (process.argv.length > 2) {
  // eslint-disable-next-line prefer-destructuring
  env = process.argv[2];
}

const config = rawConfig[env];
config.env = env;

// eslint-disable-next-line no-unused-vars
const app = new App(config);
