const { ValidationError } = require('joi');
const Joi = require('joi');
const Controller = require('./controller');

class ShipmentController extends Controller {
  constructor(ctx) {
    // Validation schemas
    const schemes = {
      create: Joi.object({
        id: Joi.string().optional().error(() => new ValidationError('Invalid shipment creation transcation number')),
        creation_transaction_num: Joi.string().optional().error(() => new ValidationError('Invalid shipment creation transcation number')),
        shipment_fingerprint: Joi.string().optional().error(() => new ValidationError('Missing or invalid shipment fingerprint')),
        label: Joi.string().error(() => new ValidationError('Missing or invalid shipment source company')),
        source_company: Joi.string().error(() => new ValidationError('Missing or invalid shipment source company')),
        source_department: Joi.string().error(() => new ValidationError('Missing or invalid shipment source department')),
        target_company: Joi.string().error(() => new ValidationError('Missing or invalid shipment target company')),
        target_department: Joi.string().error(() => new ValidationError('Missing or invalid shipment target department')),
        sent_mass: Joi.number().positive().error(() => new ValidationError('Missing or invalid shipment sent mass')),
        sending_date: Joi.string().error(() => new ValidationError('Missing or invalid shipment sending date')),
        receiving_date: Joi.string().optional().error(() => new ValidationError('Invalid shipment receiving date')),
        received_mass: Joi.number().optional().positive().error(() => new ValidationError('Invalid shipment received mass')),
        status: Joi.string().error(() => new ValidationError('Missing or invalid shipment status')),
        reconciliation_table: Joi.array().optional().error(() => new ValidationError('Invalid reconciliation table')),
      }),
      
      update: Joi.object({
        creation_transaction_hash: Joi.string().optional().error(() => new ValidationError('Missing or invalid shipment creation transcation number')),
        shipment_fingerprint: Joi.string().optional().error(() => new ValidationError('Missing or invalid shipment fingerprint')),
        source_department: Joi.string().optional().error(() => new ValidationError('Invalid shipment source department')),
        target_company: Joi.string().optional().error(() => new ValidationError('Invalid shipment target company')),
        target_department: Joi.string().optional().error(() => new ValidationError('Invalid shipment target department')),
        sent_mass: Joi.number().positive().optional().error(() => new ValidationError('Invalid shipment sent mass')),
        sending_date: Joi.string().optional().error(() => new ValidationError('Invalid shipment sending date')),
        receiving_date: Joi.string().optional().error(() => new ValidationError('Invalid shipment receiving date')),
        received_mass: Joi.number().positive().optional().error(() => new ValidationError('Invalid shipment received mass')),
        status: Joi.string().optional().error(() => new ValidationError('Invalid shipment status')),
        reconciliation_table: Joi.array().optional().error(() => new ValidationError('Invalid reconciliation table')),
      }),
    };

    super(ctx.shipmentModel(ctx.db), schemes);
    this.utils = ctx.utils;
  }
}

module.exports = ShipmentController;
