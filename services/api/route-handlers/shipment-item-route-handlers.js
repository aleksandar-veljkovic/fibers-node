const { ValidationError } = require('joi');
const { UniqueConstraintError } = require('sequelize');
const BaseRouteHandlers = require('../base-route-handlers');

// ------------------------------------------------
// Shipment
// ------------------------------------------------

class ShipmentItemRouteHandlers extends BaseRouteHandlers {
  /**
   * Fetch all shipment items
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
    async fetchAllShipmentItemsHandler(req, res, next) {
        this.utils.log('Fetch all shipment items request received');

        try {
            const shipmentItems = await this.shipmentItemController.findAll({});
            this.sendResponse(res, 200, 'Success', shipmentItems);
        } catch (err) {
            this.utils.log(err);
            this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
        }

        return next();
    }

  /**
   * Create new shipment item
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
    async createShipmentItemHandler(req, res, next) {
        this.utils.log('Create shipment item request received');
        if (req.body == null) {
            this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: 'Invalid request object' });
            return next();
        }

        const shipmentItemData = req.body;

        try {
            const shipmentItem = await this.shipmentItemController.create(shipmentItemData);
            this.sendResponse(res, 201, 'Shipment item created', shipmentItem);
        } catch (err) {
            if (err instanceof ValidationError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: err.message });
            } else if (err instanceof UniqueConstraintError) {
                this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: 'Shipment item already exists' });
            } else {
                this.utils.log(err);
                this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
            }
        }

        return next();
    }

    /**
     * Fetch one shipment item by id
     * @param {} req
     * @param {*} res
     * @param {*} next
     * @returns
     */
    async fetchSingleShipmentItemHandler(req, res, next) {
        this.utils.log('Fetch single shipment item request received');

        const shipmentItemId = req.params.id;

        try {
            const shipmentItem = await this.shipmentItemController.findOne({ id: shipmentItemId });
            if (shipmentItem == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment item not found' });
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
     * Update one shipment item
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * @returns
     */
    async updateShipmentItemHandler(req, res, next) {
        this.utils.log('Update shipment item request received');

        const { id: shipmentItemId } = req.params;
        const shipmentItemUpdate = req.body;

        try {
            const shipmentItem = await this.shipmentItemController.findOne({ id: shipmentItemId });
            
            if (shipmentItem == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            } else {
                await this.shipmentItemController.findAndUpdate({ id: shipmentItemId }, shipmentItemUpdate);
                this.sendResponse(res, 201, 'Shipment item updated', null);
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
   * Delete shipment item
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
    async deleteShipmentItemHandler(req, res, next) {
        this.utils.log('Delete shipment item request received');

        const { id: shipmentItemId } = req.params;

        try {
            const shipmentItem = await this.shipmentItemController.findOne({ id: shipmentItemId });
            if (shipmentItem == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment item not found' });
            } else {
                await this.shipmentItemController
                .findAndDelete({ id: shipmentItemId });
                this.sendResponse(res, 201, 'Shipment item deleted', null);
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

module.exports = ShipmentItemRouteHandlers;
