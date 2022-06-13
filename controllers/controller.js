const { ValidationError } = require('joi');
const utils = require('../services/utils/utils');

class Controller {
  constructor(model, schemes) {
    this.model = model;
    this.schemes = schemes;
  }

  create(data) {
    if (data == null) {
      throw new ValidationError('Invalid request object');
    }

    const { error } = this.schemes.create.validate(data);
    if (error) {
      throw error;
    }

    if (data.id == null) {
      // eslint-disable-next-line no-param-reassign
      data.id = utils.generateId();
    }

    return this.model.create(data);
  }

  findAll(query, allowedAttributes) {
    return this.model.findAll({ where: query, attributes: allowedAttributes, order: [['createdAt', 'ASC']]});
  }

  findOne(query, allowedAttributes) {
    return this.model.findOne({ where: query, attributes: allowedAttributes });
  }

  static update(instance, update) {
    Object.assign(instance, update);
    return instance.save();
  }

  findAndUpdate(query, update) {
    const { error } = this.schemes.update.validate(update);
    if (error) {
      throw error;
    }

    return this.model.update(
      update,
      {
        where: query,
      },
    );
  }

  static delete(instance) {
    instance.destroy();
  }

  findAndDelete(query) {
    return this.model.destroy({
      where: query,
    });
  }
}

module.exports = Controller;
