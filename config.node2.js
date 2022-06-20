module.exports = {
    DEVELOPMENT: {
      db: {
        dialect: 'sqlite',
        database: 'fibers-node2',
        username: 'root',
        password: 'password',
      },
      api: {
        port: 9339,
        host: '127.0.0.1',
        appName: 'Fibers Node',
      },
      tracker: {
        api: 'http://127.0.0.1:2992',
      },
      logging: true,
      partners_filename: 'partners2'
    },
  };
  