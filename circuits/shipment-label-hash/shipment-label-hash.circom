pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template ShipmentLabelHash() {
    signal input shipmentLabel;
    signal input salt;
    signal input shipmentLabelHash;

    component shipmentLabelPoseidon = Poseidon(2);
    shipmentLabelPoseidon.inputs[0] <== shipmentLabel;
    shipmentLabelPoseidon.inputs[1] <== salt;

    shipmentLabelHash === shipmentLabelPoseidon.out;
}

component main {public [shipmentLabelHash, shipmentLabel]} = ShipmentLabelHash();