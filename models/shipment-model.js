const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Shipment', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  creation_transaction_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shipment_fingerprint: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
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
    allowNull: true,
  },
  received_mass: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reconciliation_table: {
    type: DataTypes.JSONB,
    allowNull: true,
  }
});
