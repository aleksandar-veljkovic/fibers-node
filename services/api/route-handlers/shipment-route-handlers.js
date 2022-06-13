const { ValidationError } = require('joi');
const { UniqueConstraintError } = require('sequelize');
const BaseRouteHandlers = require('../base-route-handlers');

// ------------------------------------------------
// Shipment
// ------------------------------------------------

class ShipmentRouteHandlers extends BaseRouteHandlers {
  /**
   * Fetch all shipments
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
    async fetchAllShipmentsHandler(req, res, next) {
        this.utils.log('Fetch all shipments request received');

        try {
            const shipments = await this.shipmentController.findAll({});
            this.sendResponse(res, 200, 'Success', shipments);
        } catch (err) {
            this.utils.log(err);
            this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
        }

        return next();
    }

  /**
   * Create new shipment
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
    async createShipmentHandler(req, res, next) {
        this.utils.log('Create shipment request received');
        if (req.body == null) {
            this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: 'Invalid request object' });
            return next();
        }

        const shipmentData = req.body;

        try {
            const shipment = await this.shipmentController.create(shipmentData);
            this.sendResponse(res, 201, 'Shipment created', shipment);
        } catch (err) {
            if (err instanceof ValidationError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: err.message });
            } else if (err instanceof UniqueConstraintError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: 'Shipment already exists' });
            } else {
                this.utils.log(err);
                this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
            }
        }

        return next();
    }

    /**
     * Fetch one shipment by id
     * @param {} req
     * @param {*} res
     * @param {*} next
     * @returns
     */
    async fetchSingleShipmentHandler(req, res, next) {
        const { include_items } = req.query;

        this.utils.log('Fetch single shipment request received');

        const shipmentId = req.params.id;

        try {
            const shipment = await this.shipmentController.findOne({ id: shipmentId });
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            }

            if (include_items) {
                shipment.items = await this.shipmentItemsController.findAll({ shipment_id: shipmentId });
            }
            this.sendResponse(res, 200, 'Success', shipment);
        } catch (err) {
            if (err instanceof ValidationError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: err.message });
            } else {
                this.utils.log(err);
                this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
            }
        }

        return next();
    }

    /**
     * Update one shipment
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * @returns
     */
    async updateShipmentHandler(req, res, next) {
        this.utils.log('Update shipment request received');

        const { id: shipmentId } = req.params;
        const shipmentUpdate = req.body;

        try {
            const shipment = await this.shipmentController.findOne({ id: shipmentId });
            
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            } else {
                await this.shipmentController.findAndUpdate({ id: shipmentId }, shipmentUpdate);
                this.sendResponse(res, 201, 'Shipment updated', null);
            }
        } catch (err) {
            if (err instanceof ValidationError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: err.message });
            } else {
                this.utils.log(err);
                this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
            }
        }

        return next();
    }

  /**
   * Delete shipment
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
    async deleteShipmentHandler(req, res, next) {
        this.utils.log('Delete shipment request received');

        const { id: shipmentId } = req.params;

        try {
            const shipment = await this.shipmentController.findOne({ id: shipmentId });
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            } else {
                await this.shipmentController
                .findAndDelete({ id: shipmentId });
                this.sendResponse(res, 201, 'Shipment deleted', null);
            }
        } catch (err) {
            if (err instanceof ValidationError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: err.message });
            } else {
                this.utils.log(err);
                this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
            }
        }

        return next();
    }

   /**
   * Receive shipment items table
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
     async receiveShipmentItemsTableHandler(req, res, next) {
        this.utils.log('Receive shipment items table request received');

        const { id: shipmentId } = req.params;
        const { shipmentTable } = req.body;

        // TODO: Check table contents

        try {
            const shipment = await this.shipmentController.findOne({ id: shipmentId });
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            } else {
                // TODO: Check update permissions
                await this.shipmentController
                .findAndUpdate({ id: shipmentId }, { reconciliationTable: shipmentTable });
                this.sendResponse(res, 201, 'Shipment table updated', null);
            }
        } catch (err) {
            if (err instanceof ValidationError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: err.message });
            } else {
                this.utils.log(err);
                this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
            }
        }

        return next();
    }
}

module.exports = ShipmentRouteHandlers;
