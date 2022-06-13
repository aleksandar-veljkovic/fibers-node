module.exports = {
  DEVELOPMENT: {
    db: {
      dialect: 'sqlite',
      database: 'fibers-node',
      username: 'root',
      password: 'password',
    },
    api: {
      port: 9229,
      host: '127.0.0.1',
      appName: 'Fibers Node',
    },
    logging: true,
  },
};
