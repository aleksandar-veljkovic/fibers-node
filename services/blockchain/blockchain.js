const { ethers } = require("hardhat");
const fibersAbi = require('./Fibers.json');
const axios = require('axios');
const bytes32 = require('bytes32');
const { groth16 } = require("snarkjs");

class Blockchain {
    constructor({ config, shipmentController, utils, shipmentItemController, sockets }) {
        this.config = config;
        this.utils = utils;
        this.fibersContract = null;
        this.shipmentController = shipmentController;
        this.shipmentItemController = shipmentItemController;
        this.sockets = sockets;

        this.connectContract();
    }

    connectContract() {
        const { rpcString, privateKey, contractAddress } = this.config;

        const provider = new ethers.providers.JsonRpcProvider(`${rpcString}`);
        const wallet = new ethers.Wallet(privateKey, provider);
        this.fibersContract = new ethers.Contract(contractAddress, fibersAbi.abi, wallet);
    }   

    startListeners() {
        const { departmentId } = this.config;

        // Listen to shipment registration events
        this.fibersContract.on('ShipmentRegistered', async (shipmentLabelHash, senderDepartmentHex, recipientDepartmentHex) => {
            // console.log('New shipment!');

            const senderDepartment = senderDepartmentHex.split('0x')[1];
            const recipientDepartment = recipientDepartmentHex.split('0x')[1];

            // console.log({ shipmentLabelHash, senderDepartment, recipientDepartment });
            if (senderDepartment === departmentId || recipientDepartment === departmentId) {
                const labelHash = shipmentLabelHash.split('0x')[1];
                // Check if shipment is listed
                const shipment = await this.shipmentController.findOne({ label_hash: labelHash});

                if (shipment == null) {
                    console.log('New shipment registered!');
                    const contractShipment = await this.fibersContract.getShipment(shipmentLabelHash);
                    const { 
                        sentShipmentHash,
                        receivedShipmentHash,
                        senderCompany: senderCompanyHex, 
                        recipientCompany: recipientCompanyHex,
                        sentMass,
                        receivedMass,
                        sentDate,
                        receivedDate,
                        shipmentCreator,
                    } = contractShipment;
                    
                    const senderCompany = senderCompanyHex.split('0x')[1];
                    const recipientCompany = recipientCompanyHex.split('0x')[1];

                    let partnerApi = null;
                    let shipment = null;
                    let direction = null
                    const shipmentId = this.utils.generateId();

                    if (recipientDepartment === departmentId) {
                        partnerApi = this.utils.findAPI(senderCompany, senderDepartment);
                        if (partnerApi == null) {
                            return;
                        }

                        direction = 'received'
                        
                        try {
                            shipment = (await axios.get(`${partnerApi}/network/shipments/${labelHash}`)).data.data;
                        } catch (err) {
                            this.utils.log(`Partner ${partnerApi} unreachable!`);
                        }
                        
                        const newShipment = {
                            id: shipmentId,
                            sent_shipment_hash: sentShipmentHash.split('0x')[1],
                            label: shipment ? shipment.label : undefined,
                            salt: shipment ? shipment.salt : undefined,
                            label_hash: labelHash,
                            shipment_creator: shipmentCreator.split('0x')[1],
                            source_company: senderCompany,
                            source_department: senderDepartment,
                            target_company: recipientCompany,
                            target_department: recipientDepartment,
                            sent_mass: sentMass.toString(),
                            sending_date: new Date(parseInt(sentDate.toString())).toISOString(),
                            label_hash_proof: shipment ? shipment.label_hash_proof : undefined,
                            status: 'PUBLISHED'
                        }

                        // Store shipment data
                        await this.shipmentController.create(newShipment);
                    } else {
                        partnerApi = this.utils.findAPI(recipientCompany, recipientDepartment);
                        if (partnerApi == null) {
                            return;
                        }
                        
                        direction = 'sent';

                        try {
                            shipment = (await axios.get(`${partnerApi}/network/shipment/${labelHash}`)).data.data;
                        } catch (err) {
                            this.utils.log(`Partner ${partnerApi} unreachable!`);
                        }

                        const newShipment = {
                            id: shipmentId,
                            received_shipment_hash: receivedShipmentHash.split('0x')[1],
                            label: shipment ? shipment.label : undefined,
                            salt: shipment ? shipment.salt : undefined,
                            label_hash: labelHash,
                            shipment_creator: shipmentCreator,
                            source_company: senderCompany.split('0x')[1],
                            source_department: senderDepartment,
                            target_company: recipientCompany,
                            target_department: recipientDepartment,
                            received_mass: receivedMass.toString(),
                            receiving_date: new Date(parseInt(receivedDate.toString())).toISOString(),
                            label_hash_proof: shipment ? shipment.label_hash_proof : undefined,
                            status: 'PUBLISHED',
                        };

                        // Store shipment data
                        await this.shipmentController.create(newShipment);
                    }

                    // Create wrapper item
                    if (shipment) {
                        await this.shipmentItemController.create({
                            shipment_id: shipmentId,
                            is_wrapper: true,
                            item_id: shipment.label,
                            quantity_unit: 'UNIT',
                            quantity_value: 1,
                            is_indexed: true,
                            proof: shipment.label_hash_proof,
                        })
                    
                        // Add other items
                        await this.shipmentItemController.bulkCreate(
                            shipment.reconciliation_table.map(item => ({
                                id: this.utils.generateId(),
                                shipment_id: shipmentId,
                                is_wrapper: false,
                                item_id: item.item_id,
                                quantity_unit: item.quantity_unit,
                                quantity_value: item.quantity_value,
                                is_indexed: true,
                        })));
                    }

                    this.sockets.emit('shipments', { eventType: 'new_shipment', message: `New ${direction} shipment registered!` });
                } else {
                    console.log('Already have it');
                }
            }
        })

        this.fibersContract.on('ShipmentConfirmed', async (shipmentLabelHashHex) => {
            console.log('New confirmation!');
            const shipmentLabelHash = shipmentLabelHashHex.split('0x')[1];

            // Check if my shipment
            const shipment = await this.shipmentController.findOne({ label_hash: shipmentLabelHash });
            if (shipment != null && !shipment.is_confirmed && shipment.shipment_creator == departmentId) {
                console.log('New confirmation for me!');
                const contractShipment = await this.fibersContract.getShipment(shipmentLabelHashHex);
                const { 
                    sentShipmentHash,
                    receivedShipmentHash,
                    sentMass,
                    receivedMass,
                    sentDate,
                    receivedDate,
                } = contractShipment;

                let update = null;
                
                if (departmentId == shipment.source_department) {
                    update = {
                            status: 'CONFIRMED',
                            received_mass: receivedMass.toString(),
                            receiving_date: new Date(parseInt(receivedDate.toString())).toISOString(),
                            received_shipment_hash: receivedShipmentHash.split('0x')[1],
                    }
                } else {
                    update = {
                        status: 'CONFIRMED',
                        received_mass: sentMass.toString(),
                        sending_date: new Date(parseInt(sentDate.toString())).toISOString(),
                        sent_shipment_hash: sentShipmentHash.split('0x')[1],
                    }
                }

                this.shipmentController.findAndUpdate({ id: shipment.id }, update);
                this.sockets.emit('shipments', { message: 'Shipment confirmed!'});
            }

        })
    }
}

module.exports = Blockchain;