const { ValidationError } = require('joi');
const Joi = require('joi');
const Controller = require('./controller');

class ShipmentItemController extends Controller {
  constructor(ctx) {
    // Validation schemas
    const schemes = {
      create: Joi.object({
        shipment_id: Joi.string().error(() => new ValidationError('Missing or invalid shipment id')),
        is_wrapper: Joi.boolean().error(() => new ValidationError('Missing or invalid is wrapper flag')),
        item_id: Joi.string().error(() => new ValidationError('Missing or invalid item id')),
        quantity_unit: Joi.string().error(() => new ValidationError('Missing or invalid item quantity unit')),
        quantity_value: Joi.number().error(() => new ValidationError('Missing or invalid item quantity value')),
        is_indexed: Joi.boolean().error(() => new ValidationError('Missing or invalid item indexing flag')),
        proof: Joi.object().error(() => new ValidationError('Missing or invalid proof')),
      }),
      
      update: Joi.object({
        shipment_id: Joi.string().error(() => new ValidationError('Missing or invalid shipment id')),
        is_wrapper: Joi.boolean().error(() => new ValidationError('Invalid is wrapper flag')),
        item_id: Joi.string().error(() => new ValidationError('Missing or invalid item id')),
        quantity_unit: Joi.string().error(() => new ValidationError('Missing or invalid item quantity unit')),
        quantity_value: Joi.number().error(() => new ValidationError('Missing or invalid item quantity value')),
        is_indexed: Joi.boolean().error(() => new ValidationError('Missing or invalid item indexing flag')),
        proof: Joi.object().error(() => new ValidationError('Missing or invalid proof')),
      }),
    };

    super(ctx.shipmentItemModel(ctx.db), schemes);
    this.utils = ctx.utils;
  }
}

module.exports = ShipmentItemController;
