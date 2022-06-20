const { default: axios } = require('axios');
const { ValidationError } = require('joi');
const { UniqueConstraintError } = require('sequelize');
const BaseRouteHandlers = require('../base-route-handlers');

// ------------------------------------------------
// Blockchain
// ------------------------------------------------

class BlockchainRouteHandlers extends BaseRouteHandlers {
   /**
   * Submit shipment data on blockchain
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
     async submitShipmentHandler(req, res, next) {
        this.utils.log('Shipment submission request received');

        const { id: shipmentId } = req.params;

        try {
            const shipment = await this.shipmentController.findOne({ id: shipmentId });
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            } else {
                // TODO: Check if shipment has already been submitted

                shipment.dataValues.items = await this.shipmentItemController.findAll({ shipment_id: shipmentId, is_wrapper: false });

                // TODO: Create Merkle root and ZK proof
                // TODO: Submit to Blockchain

                // BEGIN FAKE DATA 
                const shipmentFingerprint = 'abcd123456789';
                const creationTransactionHash = 'TXabcd123456789';
                // END FAKE DATA 

                shipment.dataValues.creation_transaction_hash = creationTransactionHash;
                shipment.dataValues.shipment_fingerprint = shipmentFingerprint;
                shipment.dataValues.status = 'PUBLISHED';

                await this.shipmentController.findAndUpdate({ id: shipmentId }, {
                    creation_transaction_hash: creationTransactionHash,
                    shipment_fingerprint: shipmentFingerprint,
                    status: 'PUBLISHED',
                });

                // TODO: Send shipment data to receiving partner
                const { 
                    target_company: targetCompany,
                    target_department: targetDepartment,
                } = shipment;

                const partnerAPI = this.utils.findAPI(targetCompany, targetDepartment);
                this.utils.log(`Sending shipment to partner's API: ${partnerAPI}`);

                // TODO: Include authorization
                await axios.post(`${partnerAPI}/network/shipment`, shipment);

                this.utils.log(`Shipment successfuly submitted on Blockchain and sent to partner!`);
                this.sendResponse(res, 200, 'Success', shipment);
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
   * Confirm received shipment on blockchain
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns
   */
     async confirmShipmentHandler(req, res, next) {
        this.utils.log('Shipment confirmation request received');

        const { id: shipmentId } = req.params;

        try {
            const shipment = await this.shipmentController.findOne({ id: shipmentId });
            if (shipment == null) {
                this.sendResponse(res, 404, 'Error', { error: 'not_found', error_description: 'Shipment not found' });
            } else {
                // TODO: Check if shipment has already been submitted
                // TODO: Check if received mass and receiving date are not null

                shipment.dataValues.items = await this.shipmentItemController.findAll({ shipment_id: shipmentId, is_wrapper: false });

                // TODO: Create Merkle root and ZK proof
                // TODO: Submit confirmation to Blockchain

                shipment.dataValues.status = 'CONFIRMED';

                await this.shipmentController.findAndUpdate({ id: shipmentId }, {
                    status: 'CONFIRMED',
                });

                // TODO: Send shipment data to receiving partner

                this.sendResponse(res, 200, 'Success', shipment);
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

module.exports = BlockchainRouteHandlers;
