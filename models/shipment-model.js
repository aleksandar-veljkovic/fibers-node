const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Shipment', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  sent_shipment_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  received_shipment_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  label: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  label_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  label_hash_proof: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  salt: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shipment_creator: {
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
    allowNull: true,
  },
  sending_date: {
    type: DataTypes.DATE,
    allowNull: true,
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
