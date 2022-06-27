const axios = require('axios');
const { ValidationError } = require('joi');
const { UniqueConstraintError } = require('sequelize');
const bytes32 = require('bytes32');
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

                const {
                    sent_mass: sentMass,
                    sending_date: sentDate,
                    source_company: senderCompany,
                    source_department: senderDepartment,
                    target_company: recipientCompany,
                    target_department: recipientDepartment,
                } = shipment;

                shipment.dataValues.items = await this.shipmentItemController.findAll({ shipment_id: shipmentId, is_wrapper: false });
                const shipmentLabelHash = shipment.label_hash;
                const shipmentLabelHex = bytes32({ input: shipment.label }, { ignoreLength: true });

                // Prepare shipment items for hashing
                const shipmentItems = shipment.dataValues.items.map(item => 
                    (
                        { 
                            itemId: item.item_id, 
                            unitCode: item.quantity_unit.toUpperCase(), 
                            itemQuantity: item.quantity_value 
                        }
                    )
                ).sort((a, b) => a.itemId.localeCompare(b.itemId));

                const { shipmentHash, itemsRootHash, itemsTree } = await this.utils.generateShipmentHash(shipmentItems, shipmentLabelHex);
                // console.log(`Shipment ID hash: ${shipmentLabelHash}`);
                // console.log(`Shipment hash: ${shipmentHash}`);
                // console.log(`Items root hash: ${itemsRootHash}`);

                const paddedShipmentHash = BigInt(shipmentHash).toString(16).padStart(64,'0');

                // Generate inclusion proofs for the items
                const proofs = await this.zk.generateInclusionProofs(itemsTree, shipmentItems, shipmentLabelHex, shipmentLabelHash, shipment.salt, shipmentHash);
                console.log(proofs);

                for (let i = 0; i < shipmentItems.length; i += 1) {
                    const item = shipmentItems[i];
                    const proof = proofs[i];
                    console.log({ item_id: item.itemId, shipment_id: shipment.id, proof });
                    await this.shipmentItemController.findAndUpdate({ item_id: item.itemId, shipment_id: shipment.id }, { proof })
                }

                // Submit to Blockchain
                const result = await this.blockchain.fibersContract.registerShipment(
                    `0x${shipmentLabelHash}`,
                    `0x${paddedShipmentHash}`,
                    sentMass,
                    new Date(sentDate).getTime(),
                    `0x${senderCompany}`,
                    `0x${senderDepartment}`,
                    `0x${recipientCompany}`,
                    `0x${recipientDepartment}`,
                );

                // Wait until the transaction is accepted
                await result.wait();

                // Update shipment data
                await this.shipmentController.findAndUpdate({ id: shipmentId }, {
                    sent_shipment_hash: paddedShipmentHash,
                    status: 'PUBLISHED',
                });

                // Success!
                this.utils.log(`Shipment successfuly submitted on Blockchain and sent to partner!`);
                this.sendResponse(res, 200, 'Success', shipment);
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

                const {
                    received_mass: receivedMass,
                    receiving_date: receivingDate,
                } = shipment;

                shipment.dataValues.items = await this.shipmentItemController.findAll({ shipment_id: shipmentId, is_wrapper: false });

                const shipmentLabelHash = shipment.label_hash;
                
                const {
                    a, b, c,
                    shipmentLabelHashHex,
                    paddedShipmentHashHex,
                } = await this.zk.generateShipmentProof(shipment.label, shipmentLabelHash, shipment.dataValues.items, shipment.salt);

                console.log(paddedShipmentHashHex.split('0x')[1]);

                // Confirm shipment
                const result = await this.blockchain.fibersContract.confirmShipment(
                    a, b, c,
                    shipmentLabelHashHex,
                    paddedShipmentHashHex,
                    receivedMass,
                    new Date(receivingDate).getTime(),
                )

                await result.wait();

                shipment.dataValues.status = 'CONFIRMED';

                await this.shipmentController.findAndUpdate({ id: shipmentId }, {
                    received_shipment_hash: paddedShipmentHashHex.split('0x')[1],
                    status: 'CONFIRMED',
                });

                // TODO: Send shipment data to receiving partner

                this.sendResponse(res, 200, 'Success', shipment);
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
}

module.exports = BlockchainRouteHandlers;
