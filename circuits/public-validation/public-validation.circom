pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/mux1.circom";

template LeafCommitment() {
    signal input itemIdHash;
    signal input unitCode;
    signal input itemQuantity;

    signal output out;

    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== itemIdHash;
    poseidon.inputs[1] <== unitCode;
    poseidon.inputs[2] <== itemQuantity;
    out <== poseidon.out;
}

template ShipmentInclusionProof(n) {
    // Private inputs
    signal input unitCode;
    signal input itemQuantity;
    signal input path_elements[n];
    signal input path_index[n];
    signal input shipmentId;
    signal input salt;
    
    // Public inputs
    signal input itemIdHash;
    signal input shipmentIdHash;
    signal input shipmentHash;
    
    // Verify shipment id hash
    component shipmentIdPoseidon = Poseidon(2);
    shipmentIdPoseidon.inputs[0] <== shipmentId;
    shipmentIdPoseidon.inputs[1] <== salt;
    shipmentIdHash === shipmentIdPoseidon.out;

    // Merkle inclusion proof
    component leaf_commitment = LeafCommitment();
    leaf_commitment.itemIdHash <== itemIdHash;
    leaf_commitment.unitCode <== unitCode;
    leaf_commitment.itemQuantity <== itemQuantity;

    signal leaf <== leaf_commitment.out;
    
    component poseidon_hashers[n];
    component mux[n];

    signal hashes[n + 1];
    hashes[0] <== leaf;

    for (var i = 0; i < n; i++) {
        path_index[i] * (1 - path_index[i]) === 0;

        poseidon_hashers[i] = Poseidon(2);
        mux[i] = MultiMux1(2);

        mux[i].c[0][0] <== hashes[i];
        mux[i].c[0][1] <== path_elements[i];
        mux[i].c[1][0] <== path_elements[i];
        mux[i].c[1][1] <== hashes[i];
        mux[i].s <== path_index[i];

        poseidon_hashers[i].inputs[0] <== mux[i].out[0];
        poseidon_hashers[i].inputs[1] <== mux[i].out[1];

        hashes[i + 1] <== poseidon_hashers[i].out;
    }

    // Transaction hash computation (id + root)
    component shipmentPoseidon = Poseidon(2);
    shipmentPoseidon.inputs[0] <== shipmentId;
    shipmentPoseidon.inputs[1] <== hashes[n];

    shipmentHash === shipmentPoseidon.out;
}

component main {public [itemIdHash, shipmentIdHash, shipmentHash]} = ShipmentInclusionProof(20);