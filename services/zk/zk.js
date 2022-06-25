const { groth16 } = require("snarkjs");
const bytes32 = require('bytes32');
const { buildPoseidon } = require('circomlibjs');

class ZK {
    constructor(ctx) {
        this.utils = ctx.utils;
    }

    async generateShipmentProof(shipmentLabel, shipmentLabelHash, items, salt) {
        const shipmentIdHex = bytes32({ input: shipmentLabel }, { ignoreLength: true });
        const saltHex = BigInt(`0x${salt}`, 'hex');
        const shipmentItems = items.map(item => 
            (
                {
                    itemId: item.item_id, 
                    unitCode: item.quantity_unit.toUpperCase(), 
                    itemQuantity: item.quantity_value 
                }
            )
        ).sort((a, b) => a.itemId.localeCompare(b.itemId));

        const { shipmentHash, itemsRootHash } = await this.utils.generateShipmentHash(shipmentItems, shipmentIdHex);
        const paddedShipmentHash = BigInt(shipmentHash).toString(16).padStart(64,'0');

        // Prepare data for ZK proof
        const INPUT = {
            // Private inputs
            itemsRootHash,
            salt: BigInt(saltHex, 'hex'),
            shipmentId: BigInt(shipmentIdHex, 16),
                
            // Public inputs
            shipmentIdHash: BigInt(`0x${shipmentLabelHash}`, 'hex'),
            shipmentHash,
        }

        // Generating ZK proof
        const { proof, publicSignals } = await groth16.fullProve(
            INPUT, 
            "circuits/shipment-verifier/shipment-verifier_js/shipment-verifier.wasm",
            "circuits/shipment-verifier/circuit_final.zkey"
        );

        const editedPublicSignals = this.utils.unstringifyBigInts(publicSignals);
        const editedProof = this.utils.unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];

        return {
            a, b, c,
            shipmentLabelHashHex: `0x${shipmentLabelHash}`,
            paddedShipmentHashHex: `0x${paddedShipmentHash}`,
        }
    }

    async generateInclusionProofs(itemsTree, shipmentItems, shipmentLabelHex, shipmentLabelHash, salt, shipmentHash) {
        const saltHex = `0x${salt}`;

        const poseidon = await buildPoseidon();

        const proofs = shipmentItems.map((item, index) => (
            new Promise(async (resolve, reject) => { 
                const inclusionProof = itemsTree.createProof(index);
                const itemIdHex = `0x${Buffer.from(item.itemId, 'utf-8').toString('hex')}`;
                const itemIdHash = poseidon.F.toString(poseidon([BigInt(itemIdHex, 'hex')]));

                const inclusionProofInputs = {
                    // Private inputs
                    unitCode:  BigInt('0x' + Buffer.from(item.unitCode, 'utf-8').toString('hex'), 'hex'),
                    itemQuantity: item.itemQuantity,
                    path_elements: inclusionProof.siblings.map(arr => arr[0].toString()),
                    path_index: inclusionProof.pathIndices.map(el => `${el}`),
                    shipmentId: BigInt(shipmentLabelHex, 'hex'),
                    salt: BigInt(saltHex, 'hex'),
                    
                    // Public inputs
                    itemIdHash,
                    shipmentIdHash: BigInt(`0x${shipmentLabelHash}`, 'hex'),
                    shipmentHash: BigInt(shipmentHash),
                }

                // Preparing proof for the recipient using previously generated input
                const { proof, publicSignals } = await groth16.fullProve(
                    inclusionProofInputs, 
                    "circuits/public-validation/public-validation_js/public-validation.wasm",
                    "circuits/public-validation/circuit_final.zkey"
                )
                const editedPublicSignals = this.utils.unstringifyBigInts(publicSignals);
                const editedProof = this.utils.unstringifyBigInts(proof);
                const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
            
                const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
            
                const a = [argv[0], argv[1]];
                const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
                const c = [argv[6], argv[7]];

                console.log({ a, b, c });
                resolve({ a, b, c });
            })
        ))

        return Promise.all(proofs);
    }

    async generateShipmentLabelHashProof(shipmentLabelHex, salt, shipmentLabelHash) {
        const saltHex = `0x${salt}`;
        const shipmentLabelHashHex = `0x${BigInt(shipmentLabelHash).toString(16)}`;

        const inputs = {
            shipmentLabel: BigInt(shipmentLabelHex, 'hex'),
            salt: BigInt(saltHex, 'hex'),
            shipmentLabelHash: shipmentLabelHashHex
        };

        const { proof, publicSignals } = await groth16.fullProve(
            inputs, 
            "circuits/shipment-label-hash/shipment-label-hash_js/shipment-label-hash.wasm",
            "circuits/shipment-label-hash/circuit_final.zkey"
        );
        
        const editedPublicSignals = this.utils.unstringifyBigInts(publicSignals);
        const editedProof = this.utils.unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];

        return { a, b, c };
    }
}

module.exports = ZK;