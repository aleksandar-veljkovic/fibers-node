const { ValidationError } = require('joi');
const { UniqueConstraintError } = require('sequelize');
const BaseRouteHandlers = require('../base-route-handlers');

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
        creation_transaction_num,
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
        await this.shipmentController.create({ 
            id,
            creation_transaction_num,
            shipment_fingerprint,
            label,
            source_company,
            source_department,
            target_company,
            target_department,
            sent_mass,
            sending_date,
            status,
            reconciliation_table: items.map(item => ({
                item_id: item.item_id,
                quantity_unit: item.quantity_unit,
                quantity_value: item.quantity_value,
            }))
        });

        await this.shipmentItemController.create({
            shipment_id: id,
            is_wrapper: true,
            item_id: label,
            quantity_unit: 'UNIT',
            quantity_value: 1,
            is_indexed: true,
        })

        this.sendResponse(res, 201, 'Success', null);
    } catch (err) {
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
};

module.exports = NetworkRouteHandlers;