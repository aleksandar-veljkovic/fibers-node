const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');

// API Route handlers
const BaseRouteHandlers = require('./base-route-handlers');
const ShipmentRouteHandlers = require('./route-handlers/shipment-route-handlers');
const ShipmentItemRouteHandlers = require('./route-handlers/shipment-item-route-handlers');
const BlockchainRouteHandlers = require('./route-handlers/blockchain-route-handlers');
const NetworkRouteHandlers = require('./route-handlers/network-route-handlers');

// Cors middelware parameters
const cors = corsMiddleware({
  origins: ['*'],
  allowHeaders: ['*'],
  exposeHeaders: ['*'],
});

/**
 * Rest Server main class, includes route handlers for handling specific API routes
 */
class RestServer {
  constructor(ctx) {
    this.config = ctx.config;
    this.utils = ctx.utils;

    // Initialize route handlers
    this.baseRouteHandlers = new BaseRouteHandlers(ctx);
    this.shipmentRouteHandlers = new ShipmentRouteHandlers(ctx);
    this.shipmentItemRouteHandlers = new ShipmentItemRouteHandlers(ctx);
    this.blockchainRouteHandlers = new BlockchainRouteHandlers(ctx);
    this.networkRouteHandlers = new NetworkRouteHandlers(ctx);

    this.unprotectedRoutes = [
      {
        method: 'GET',
        path: '/',
      },
    ];

    this.init();
  }

  /**
     * Initialize server parameters
     */
  init() {
    // Initialize REST server
    this.server = restify.createServer({
        name: this.config.api.appName,
    });

    this.server.pre(cors.preflight);
    this.server.use(cors.actual);
    this.server.use(restify.plugins.queryParser({ mapParams: false }));
    this.server.use(restify.plugins.bodyParser());

    // Register API Routes
    this.registerRoutes();
  }

  /**
     * Register API routes and connect them with route handlers
     */
  registerRoutes() {
    // Healthcheck
    this.server.get('/', this.baseRouteHandlers.healthcheckHandler.bind(this.baseRouteHandlers));

    // Query handler
    this.server.get('/query/:id', this.baseRouteHandlers.queryHandler.bind(this.baseRouteHandlers));

    // Shipment handlers
    this.server.post('/shipments', this.shipmentRouteHandlers.createShipmentHandler.bind(this.shipmentRouteHandlers));
    this.server.get('/shipments', this.shipmentRouteHandlers.fetchAllShipmentsHandler.bind(this.shipmentRouteHandlers));
    this.server.get('/shipments/:id', this.shipmentRouteHandlers.fetchSingleShipmentHandler.bind(this.shipmentRouteHandlers));
    this.server.put('/shipments/:id', this.shipmentRouteHandlers.updateShipmentHandler.bind(this.shipmentRouteHandlers));
    this.server.del('/shipments/:id', this.shipmentRouteHandlers.deleteShipmentHandler.bind(this.shipmentRouteHandlers));

    // Shipment item handlers
    this.server.post('/shipment-items', this.shipmentItemRouteHandlers.createShipmentItemHandler.bind(this.shipmentItemRouteHandlers));
    this.server.get('/shipment-items', this.shipmentItemRouteHandlers.fetchAllShipmentItemsHandler.bind(this.shipmentItemRouteHandlers));
    this.server.get('/shipment-items/:id', this.shipmentItemRouteHandlers.fetchSingleShipmentItemHandler.bind(this.shipmentItemRouteHandlers));
    this.server.put('/shipment-items/:id', this.shipmentItemRouteHandlers.updateShipmentItemHandler.bind(this.shipmentItemRouteHandlers));
    this.server.del('/shipment-items/:id', this.shipmentItemRouteHandlers.deleteShipmentItemHandler.bind(this.shipmentItemRouteHandlers));

    // Blockchain interaction handlers
    this.server.post('/blockchain/submit/:id', this.blockchainRouteHandlers.submitShipmentHandler.bind(this.blockchainRouteHandlers));
    this.server.post('/blockchain/confirm/:id', this.blockchainRouteHandlers.confirmShipmentHandler.bind(this.blockchainRouteHandlers));

    // Network handlers
    this.server.get('/network/partners', this.networkRouteHandlers.fetchPartnersHandler.bind(this.networkRouteHandlers));
    this.server.post('/network/shipments', this.networkRouteHandlers.receiveShipmentHandler.bind(this.networkRouteHandlers));
    this.server.get('/network/shipments/:labelHash', this.networkRouteHandlers.requestShipmentByHashHandler.bind(this.networkRouteHandlers));
    this.server.get('/network/query/:itemId', this.networkRouteHandlers.queryHandler.bind(this.networkRouteHandlers));
  }

  /**
    * Start REST API
    */
  start() {
    this.server.listen(
      this.config.api.port,
      this.config.api.host || 'localhost',
      () => this.utils.log(`${this.config.api.appName} API listening at ${
        this.server.address().address
      }:${
        this.config.api.port
      }`),
    );
  }
}

module.exports = RestServer;
