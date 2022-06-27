const { ValidationError } = require('joi');
const { UniqueConstraintError, Op } = require('sequelize');
const BaseRouteHandlers = require('../base-route-handlers');
const { buildPoseidon } = require('circomlibjs');
const bytes32 = require('bytes32');
const { groth16 } = require("snarkjs");

// ------------------------------------------------
// Network
// ------------------------------------------------

class NetworkRouteHandlers extends BaseRouteHandlers {
 /**
   * Submit shipment data on blockchain
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
  async fetchPartnersHandler(req, res, next) {
    this.utils.log('Fetch partners request received');

    const { reload } = req.query;

    if (reload) {
        await this.utils.loadPartners();
    }

    this.sendResponse(res, 200, "Success", this.utils.partners);
  }

  /**
   * Request shipment by label hash
   * @param {} req 
   * @param {*} res 
   * @param {*} next 
   * @returns 
   */

   async requestShipmentByHashHandler(req, res, next) {
       // TODO: Check authorization
        this.utils.log('Fetch shipment by hash request received');

        const { labelHash } = req.params;

        try {
            const shipment = await this.shipmentController.findOne({ label_hash: labelHash });
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
                return next();
            }

            shipment.dataValues.reconciliation_table = await this.shipmentItemController.findAll({ shipment_id: shipment.id, is_wrapper: false });
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
   * Receive shipment from partner
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
   async receiveShipmentHandler(req, res, next) {
    this.utils.log('New shipment data received');

    const shipmentData = req.body;

    const {
        id,
        creation_transaction_hash,
        shipment_fingerprint,
        label,
        source_company,
        source_department,
        target_company,
        target_department,
        sent_mass,
        sending_date,
        status,
        items,
    } = shipmentData;

    // TODO: Verify blockchain information
    // TODO: Verify if shipment is already in database
    // TODO: Verify if partner has permission to submit shipment
    // TODO: Verify received data

    try {
        console.log(items);

        const reconciliationTable = items.map(item => ({
            item_id: item.item_id,
            quantity_unit: item.quantity_unit,
            quantity_value: item.quantity_value,
        }))

        console.log(reconciliationTable);

        await this.shipmentController.create({ 
            id,
            shipment_fingerprint,
            creation_transaction_hash,
            label,
            source_company,
            source_department,
            target_company,
            target_department,
            sent_mass,
            sending_date,
            status,
            reconciliation_table: reconciliationTable,
        });

        await this.shipmentItemController.create({
            shipment_id: id,
            is_wrapper: true,
            item_id: label,
            quantity_unit: 'UNIT',
            quantity_value: 1,
            is_indexed: true,
        })

        await this.shipmentItemController.bulkCreate(
            reconciliationTable.map(item => ({
                id: this.utils.generateId(),
                shipment_id: id,
                is_wrapper: false,
                item_id: item.item_id,
                quantity_unit: item.quantity_unit,
                quantity_value: item.quantity_value,
                is_indexed: true,
        })));

        this.sendResponse(res, 201, 'Success', null);
    } catch (err) {
        console.log(err);
        if (err instanceof ValidationError) {
            this.utils.log(err);
            this.sendResponse(res, 400, 'Error', { error: 'invalid_request', error_description: err.message });
        } else {
            this.utils.log(err);
            this.sendResponse(res, 500, 'Error', { error: 'internal_error', error_description: 'Internal server error' });
        }
    }

    return next();
    }

    /**
     * Query shipment item
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * @returns
     */
    async queryHandler(req, res, next) {
        this.utils.log('Shipment query received');

        const { itemId } = req.params;

        const items = await this.shipmentItemController.findAll({ item_id: itemId, is_indexed: true });
        console.log(items);
        if (items.length == 0) {
            this.sendResponse(res, 404, 'Not found', null);
            return next();
        }

        const responseItems = [];
        for (const item of items) {
            const { shipment_id: shipmentId } = item;
            const shipments = await this.shipmentController.findAll({ id: shipmentId, status: {[Op.not]: 'UNPUBLISHED' }});

            for (const shipment of shipments) {
                const resItem = {
                    itemId: item.item_id,
                    shipment: {
                        sender: this.utils.getPartnerInfo(shipment.source_company, shipment.source_department),
                        recipient: this.utils.getPartnerInfo(shipment.target_company, shipment.target_department),
                        shipmentLabel: shipment.label,
                        shipmentLabelHash: shipment.label_hash,
                        hashProof: shipment.label_hash_proof
                    },
                    isWrapper: item.is_wrapper,
                    inclusionProof: item.proof
                }

                responseItems.push(resItem);
            }
        }

        
        this.sendResponse(res, 200, 'Success', responseItems);

        return next();
    };
};

module.exports = NetworkRouteHandlers;