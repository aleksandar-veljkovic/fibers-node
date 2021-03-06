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
      partners_filename: 'partners2',
      contractAddress: '0x3b3431C421A5E51f2097e2378dC544216BEC3E0f',
      privateKey: '566b422d22f723bddb28cdd5a5e57685984e73cc72d7806d1c68109c272c5f7f',
      rpcString: 'http://127.0.0.1:8545',
      companyId: '3a8e82a3b412ece07c7c4cd8d77281e099e7036af7ed97bcaa96dc1fb1ce991a',
      departmentId: 'cbdefe62dae9d7109e25d52b4920ec9cf9b3519b163301a9d51d8d6f21903774',
      socketService: { port: 8338 },
    },
    DEVNET: {
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
      partners_filename: 'partners2',
      contractAddress: '0x2f92D8F6B691d7c1BBf6865350A24fEf15F18FdE',
      privateKey: '566b422d22f723bddb28cdd5a5e57685984e73cc72d7806d1c68109c272c5f7f',
      rpcString: 'https://api.s0.ps.hmny.io/',
      companyId: '3a8e82a3b412ece07c7c4cd8d77281e099e7036af7ed97bcaa96dc1fb1ce991a',
      departmentId: 'cbdefe62dae9d7109e25d52b4920ec9cf9b3519b163301a9d51d8d6f21903774',
      socketService: { port: 8338 },
    },
  };
  