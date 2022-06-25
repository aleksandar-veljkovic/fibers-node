const { expect } = require("chai");
const { ethers } = require("hardhat");
const { buildPoseidon } = require('circomlibjs');
const { IncrementalMerkleTree } = require('@zk-kit/incremental-merkle-tree');
const fs = require("fs");
const { groth16 } = require("snarkjs");
const wasm_tester = require("circom_tester").wasm;
const path = require('path');
const { assert } = require("console");

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

async function generateItemsTree(items) {
    const poseidon = await buildPoseidon();
    const zeroValue = 0;
    const depth = 20;
    const arity = 2;
    const tree = new IncrementalMerkleTree((inputs) => { return BigInt(poseidon.F.toString(poseidon(inputs))) }, depth, zeroValue, arity);

    /**
     * Create leaf for items Merkle tree
     * @param {*} itemId 
     * @param {*} unitCode 
     * @param {*} itemQuantity 
     * @returns {}
     */
    const createLeaf = (itemId, unitCode, itemQuantity) => {
        const itemIdHash = poseidon.F.toString(
            poseidon(
                [
                    BigInt(
                        `0x${Buffer.from(itemId, 'utf-8').toString('hex')}`, 
                        'hex'
                    )
                ]
            )
        );
        return { itemIdHash, leaf: BigInt(poseidon.F.toString(poseidon([itemIdHash, unitCode, itemQuantity]))) };
    }

    const leaves = [];
    const itemIdHashes = [];

    for (let i = 0; i < items.length; i += 1) {
        const { itemId, unitCode, itemQuantity } = items[i];
        const { itemIdHash, leaf } = createLeaf(itemId, BigInt('0x' + Buffer.from(unitCode, 'utf-8').toString('hex'), 'hex'), itemQuantity);
        
        tree.insert(leaf);
        leaves.push(leaf);
        itemIdHashes.push(itemIdHash);
    }

    return { tree, leaves, itemIdHashes };
}

/**
 * Generate shipment hash
 * @param {*} items 
 * @param {*} shipmentId 
 * @returns 
 */
async function generateShipmentHash(items, shipmentId) {
    const { tree: itemsTree, itemIdHashes, leaves } = await generateItemsTree(items);
    const { root: itemsRoot } = itemsTree;

    const poseidon = await buildPoseidon();
    const shipmentHash = poseidon.F.toString(poseidon([BigInt(shipmentId, 'hex'), itemsRoot]));

    return { shipmentHash, itemsRootHash: itemsRoot, itemsTree, itemIdHashes, leaves };
}

describe("Full test with shipment registration, confirmation, and inclusion proof", function () {
    let fibersContract;

    beforeEach(async function () {
        const Fibers = await ethers.getContractFactory("Fibers");
        fibersContract = await Fibers.deploy();
        await fibersContract.deployed();
    });

    it("Should be able to submit new shipment as sender, confirm as receiver and generate inclusion proof", async function () {
        const poseidon = await buildPoseidon();

        // Generate shipment hash
        const shipmentId = "0x536869706d656e74310000000000000000000000000000000000000000000000"; // bytes32("Shipment1");
        const salt = 42;
        const shipmentIdHash = poseidon.F.toString(poseidon([BigInt(shipmentId, 'hex'), salt]));

        const shipmentItems = [
            {
                itemId: 'ITEM01',
                unitCode: 'G',
                itemQuantity: 1000,
            },
            {
                itemId: 'ITEM02',
                unitCode: 'UNIT',
                itemQuantity: 2,
            }
        ]

        const { shipmentHash, itemsRootHash, itemsTree, leaves } = await generateShipmentHash(shipmentItems, shipmentId);
        console.log(`Shipment ID hash: ${shipmentIdHash}`);
        console.log(`Shipment hash: ${shipmentHash}`);
        console.log(`Items root hash: ${itemsRootHash}`);
        
        // Verify the shipment hash with circom circuit
        const circuit = await wasm_tester(path.join(__dirname, "..", "..", "circuits", "shipment-verifier", "shipment-verifier.circom"));
        await circuit.loadConstraints();

        const INPUT = {
            // Private inputs
            itemsRootHash,
            shipmentId,
            salt,
                
            // Public inputs
            shipmentIdHash,
            shipmentHash,
        }

        await circuit.calculateWitness(INPUT, true);
        console.log('Circuit check successful');

        // Preparing shipment data
        const sentShipmentHash = `0x${BigInt(shipmentHash).toString(16)}`;
        const sentMass = 1500;
        const sentDate = new Date().getTime();
        const senderCompany = "0xe0e4e311e7ed4be7502717bf8e0ef1436bffe22fe51e41ac58de978439ad8e7c";
        const senderDepartment = "0x2f7675104645c7a984a17140dceff0b58aa788a2e89fc29dc0074b0708862ab9";
        const recipientCompany = "0x3b4bd0b82e7d716658cab65b881094a6715eaf64ec8ba225d82b342ef5152371";
        const recipientDepartment = "0x0bed4558c8667bf8983f0a537fc134c48757c3ff3cd7798d8620d25dfba164a9";

        // Sending shipment data to smart contract
        await fibersContract.registerSentShipment(
            `0x${BigInt(shipmentIdHash).toString(16)}`,
            sentShipmentHash,
            sentMass,
            sentDate,
            senderCompany,
            senderDepartment,
            recipientCompany,
            recipientDepartment,
        );

        console.log('Shipment registered on the smart contract');

        // Preparing proof for the recipient using previously generated input
        const { proof, publicSignals } = await groth16.fullProve(
            INPUT, 
            "circuits/shipment-verifier/shipment-verifier_js/shipment-verifier.wasm",
            "circuits/shipment-verifier/circuit_final.zkey"
        );

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];

        // Confirm shipment
        await fibersContract.confirmReceivedShipment(
            a, b, c,
            `0x${BigInt(shipmentIdHash).toString(16)}`,
            sentShipmentHash,
            1495,
            new Date().getTime(),
        )

        const shipment = await fibersContract.getShipment(`0x${BigInt(shipmentIdHash).toString(16)}`);
        expect(shipment.isConfirmed).to.be.true;

        // Verify the shipment inclusion proof
        const validationCircuit = await wasm_tester(path.join(__dirname, "..", "..", "circuits", "public-validation", "public-validation.circom"));
        await validationCircuit.loadConstraints();
        
        const itemIndex = 0;
        const selectedItem = shipmentItems[itemIndex];
        const itemIdHash =  poseidon.F.toString(
            poseidon(
                [BigInt(
                    `0x${Buffer.from(selectedItem.itemId, 'utf-8').toString('hex')}`, 
                    'hex'
                )]
            )
        );

        const inclusionProof = itemsTree.createProof(itemIndex);

        const inclusionProofInputs = {
            // Private inputs
            unitCode:  BigInt('0x' + Buffer.from(selectedItem.unitCode, 'utf-8').toString('hex'), 'hex'),
            itemQuantity: selectedItem.itemQuantity,
            path_elements: inclusionProof.siblings.map(arr => arr[0].toString()),
            path_index: inclusionProof.pathIndices.map(el => `${el}`),
            shipmentId: shipmentId,
            salt,
            
            // Public inputs
            itemIdHash,
            shipmentIdHash,
            shipmentHash,
        }

        const inclusionWitness = await validationCircuit.calculateWitness(inclusionProofInputs);
        assert(inclusionWitness != null);

        console.log('Valid inclusion proof generated successfully');
    });
});