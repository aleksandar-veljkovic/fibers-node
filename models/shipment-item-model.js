const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('ShipmentItem', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    shipment_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_wrapper: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    item_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    quantity_unit: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    quantity_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    is_indexed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    proof: {
        type: DataTypes.JSON,
        allowNull: true,
    }
});
