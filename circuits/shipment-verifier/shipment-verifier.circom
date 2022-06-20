pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template CheckShipmentHash() {
    // Private inputs
    signal input itemsRootHash;
    signal input shipmentId;
    
    // Public inputs
    signal input shipmentIdHash;
    signal input shipmentHash;

    // Check shipmentIdHash value
    component shipmentIdPoseidon = Poseidon(1);
    shipmentIdPoseidon.inputs[0] <== shipmentId;
    shipmentIdHash === shipmentIdPoseidon.out;

    // Transaction hash computation (id + root)
    component shipmentPoseidon = Poseidon(2);
    shipmentPoseidon.inputs[0] <== shipmentId;
    shipmentPoseidon.inputs[1] <== itemsRootHash;

    shipmentHash === shipmentPoseidon.out;
}

component main {public [shipmentIdHash, shipmentHash]} = CheckShipmentHash();