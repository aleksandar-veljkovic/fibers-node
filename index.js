const App = require('./app');
let env = 'DEVELOPMENT';
let configRoute = './config';

if (process.argv.length > 2) {
  // eslint-disable-next-line prefer-destructuring
  env = process.argv[2];

  if (process.argv[3] != null) {
    configRoute = `./config.${process.argv[3]}`;
  }
}

const rawConfig = require(configRoute);

const config = rawConfig[env];
config.env = env;

// eslint-disable-next-line no-unused-vars
const app = new App(config);
