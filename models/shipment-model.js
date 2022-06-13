const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Shipment', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  creation_transaction_num: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shipment_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  relabel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  source_company: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  source_department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  target_company: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  target_department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sent_mass: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sending_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  receiving_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  received_mass: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reconciliation_requested: {
    type: DataTypes.BOOLEAN,
    default: false,
    allowNull: false,
  },
  reconciliationTable: {
    type: DataTypes.JSONB,
    allowNull: true,
  }
});
