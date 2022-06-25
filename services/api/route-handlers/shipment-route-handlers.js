const { ValidationError } = require('joi');
const { UniqueConstraintError } = require('sequelize');
const BaseRouteHandlers = require('../base-route-handlers');
const { buildPoseidon } = require('circomlibjs');
const bytes32 = require('bytes32');

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

        // Generate shipment label hash
        const shipmentData = req.body;
        const poseidon = await buildPoseidon();

        const salt = this.utils.generateId();
        const shipmentLabelHex = bytes32({ input: shipmentData.label }, { ignoreLength: true });
        const hash = poseidon.F.toString(poseidon([BigInt(shipmentLabelHex, 'hex'), BigInt(`0x${salt}`, 'hex')]));
        const paddedHash = BigInt(hash).toString(16).padStart(64,'0');
        shipmentData.label_hash = paddedHash;

        const proof = await this.zk.generateShipmentLabelHashProof(shipmentLabelHex, salt, hash);

        // Assign shipment creator
        shipmentData.shipment_creator = this.config.departmentId;
        shipmentData.salt = salt;
        shipmentData.label_hash_proof = proof;

        try {
            const shipment = await this.shipmentController.create(shipmentData);

            // Add shipment wrapper item
            await this.shipmentItemController.create({ 
                shipment_id: shipment.id,
                is_wrapper: true,
                item_id: shipment.label,
                quantity_unit: 'UNIT',
                quantity_value: 1,
                is_indexed: true,
                proof,
            });
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
                shipment.dataValues.items = await this.shipmentItemController.findAll({ shipment_id: shipmentId, is_wrapper: false });
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
        const { items } = shipmentUpdate;
        
        if (items != null) {
            delete shipmentUpdate.items;
        }

        try {
            const shipment = await this.shipmentController.findOne({ id: shipmentId });
            
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            } else {
                if (items != null) {
                    await this.shipmentItemController.findAndDelete({ shipment_id: shipmentId, is_wrapper: false });
                    await this.shipmentItemController.bulkCreate(items.map(item => ({ ...item, id: this.utils.generateId() })));
                }

                await this.shipmentController.findAndUpdate({ id: shipmentId }, shipmentUpdate);
                this.sendResponse(res, 201, 'Shipment updated', null);
            }
        } catch (err) {
            console.log(err);
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
}

module.exports = ShipmentRouteHandlers;
