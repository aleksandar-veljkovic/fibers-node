/**
 * Main class with registered route handlers
 */  

class BaseRouteHandlers {
    constructor({
      config,
      utils,
      shipmentController,
      shipmentItemController,
    }) {
      this.config = config;
      this.utils = utils;
      this.log = utils.log;
  
      // Controllers
      this.shipmentController = shipmentController;
      this.shipmentItemController = shipmentItemController;
    }

    sendResponse(res, status, message, data) {
      res.status(status);
      res.send({ message, data, timestamp: new Date().toISOString() });
    }
    
  
    // Base route handler
    async healthcheckHandler(req, res, next) {
      this.utils.log('Healthcheck request received');

      try {
        this.sendResponse(res, 200, `${this.config.api.appName} API is running`, null);
      } catch (err) {
        this.sendResponse(res, 400, 'Bad request', null);
      }
      return next();
    }

    // Query route handler
    async queryHandler(req, res, next) {
      this.utils.log('Query request received');

      const { id: itemId } = req.params;

      try {
        const departments = this.departmentController.findAll();
        const apis = departments.map(dep => dep.api);

        const promises = apis.map(api => axios.get(`${api}/items`, { params: { id: itemId }}));
        const responses = await Promise.any(promises);

        this.sendResponse(res, 200, responses);
      } catch (err) {
        this.sendResponse(res, 400, 'Bad request', null);
      }
      return next();
    }
}

module.exports = BaseRouteHandlers;