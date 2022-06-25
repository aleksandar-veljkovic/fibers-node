module.exports = {
    DEVELOPMENT: {
      db: {
        dialect: 'sqlite',
        database: 'fibers-node1',
        username: 'root',
        password: 'password',
      },
      api: {
        port: 9229,
        host: '127.0.0.1',
        appName: 'Fibers Node',
      },
      tracker: {
        api: 'http://127.0.0.1:2992',
      },
      logging: true,
      partners_filename: 'partners1',
      contractAddress: '0xF73A81B98fe14223D894e8b1f0F363D329052a86',
      privateKey: 'b510a4a2d08c4a28eab3efecc16d0120bd3cb9894fa453422d1e2da0e588bff1',
      rpcString: 'http://127.0.0.1:8545',
      companyId: '1b58a94ce84bf83016e777c77e74c0ca508d832cb82d2f4ccb7946a503ce72cb',
      departmentId: '7f386528170deda53d8e5b18efdfb2f5ece6c7a6272acf4183b2c543510de89c',
      socketService: { port: 8228 },
    },
  };
  