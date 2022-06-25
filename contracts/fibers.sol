// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;
import "./shipment-verifier.sol";

contract Fibers is ShipmentVerifier {
    event ShipmentRegistered(bytes32 shipmentLabelHash, bytes32 senderDepartment, bytes32 recipientDepartment);
    event ShipmentConfirmed(bytes32 shipmentLabelHash);

    struct Shipment {
        bytes32 shipmentLabelHash;
        bytes32 sentShipmentHash;
        bytes32 receivedShipmentHash;
        uint sentMass;
        uint receivedMass;
        uint sentDate;
        uint receivedDate;
        bytes32 senderCompany;
        bytes32 senderDepartment;
        bytes32 recipientCompany;
        bytes32 recipientDepartment;
        bytes32 shipmentCreator;
        bool isConfirmed;
    }

    mapping(bytes32 => Shipment) shipments;

    /**
     * Register new shipment as sender
     */
     function registerSentShipment(
        bytes32 shipmentLabelHash,
        bytes32 sentShipmentHash,
        uint sentMass,
        uint sentDate,
        bytes32 senderCompany,
        bytes32 senderDepartment,
        bytes32 recipientCompany,
        bytes32 recipientDepartment
    ) public {
        require(shipments[shipmentLabelHash].shipmentLabelHash == bytes32(0), "Shipment already registered");

        Shipment memory newShipment;
        newShipment.shipmentLabelHash = shipmentLabelHash;
        newShipment.sentShipmentHash = sentShipmentHash;
        newShipment.sentMass = sentMass;
        newShipment.sentDate = sentDate;
        newShipment.senderCompany = senderCompany;
        newShipment.senderDepartment = senderDepartment;
        newShipment.recipientCompany = recipientCompany;
        newShipment.recipientDepartment = recipientDepartment;
        newShipment.shipmentCreator = senderDepartment;
        shipments[shipmentLabelHash] = newShipment;

        emit ShipmentRegistered(shipmentLabelHash, senderDepartment, recipientDepartment);
    }

    /**
     * Register new shipment as recipient
     */
     function registerReceivedShipment(
        bytes32 shipmentLabelHash,
        bytes32 receivedShipmentHash,
        uint receivedMass,
        uint receivedDate,
        bytes32 senderCompany,
        bytes32 senderDepartment,
        bytes32 recipientCompany,
        bytes32 recipientDepartment
    ) public {
        require(shipments[shipmentLabelHash].shipmentLabelHash == bytes32(0), "Shipment already registered");

        Shipment memory newShipment;
        newShipment.shipmentLabelHash = shipmentLabelHash;
        newShipment.receivedShipmentHash = receivedShipmentHash;
        newShipment.receivedMass = receivedMass;
        newShipment.receivedDate = receivedDate;
        newShipment.senderCompany = senderCompany;
        newShipment.senderDepartment = senderDepartment;
        newShipment.recipientCompany = recipientCompany;
        newShipment.recipientDepartment = recipientDepartment;
        newShipment.shipmentCreator = recipientDepartment;
        shipments[shipmentLabelHash] = newShipment;

        emit ShipmentRegistered(shipmentLabelHash, senderDepartment, recipientDepartment);
    }

    /**
     * Confirm received shipment
     */
     function confirmSentShipment(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        bytes32 shipmentLabelHash,
        bytes32 sentShipmentHash,
        uint sentMass,
        uint sentDate
    ) public {
        require(shipments[shipmentLabelHash].shipmentLabelHash != bytes32(0), "Shipment not registered");
        require(shipments[shipmentLabelHash].isConfirmed == false, "Shipment is already confirmed");
        require(shipments[shipmentLabelHash].sentShipmentHash == 0, "Sent shipment data is already added");
        require(verifyProof(a, b, c, [uint(shipmentLabelHash), uint(sentShipmentHash)]) == true, "Invalid proof");

        shipments[shipmentLabelHash].sentShipmentHash = sentShipmentHash;
        shipments[shipmentLabelHash].sentMass = sentMass;
        shipments[shipmentLabelHash].sentDate = sentDate;
        shipments[shipmentLabelHash].isConfirmed = true;

        emit ShipmentConfirmed(shipmentLabelHash);
    }

    /**
     * Confirm received shipment
     */
     function confirmReceivedShipment(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        bytes32 shipmentLabelHash,
        bytes32 receivedShipmentHash,
        uint receivedMass,
        uint receivedDate
    ) public {
        require(shipments[shipmentLabelHash].shipmentLabelHash != bytes32(0), "Shipment not registered");
        require(shipments[shipmentLabelHash].isConfirmed == false, "Shipment is already confirmed");
        require(shipments[shipmentLabelHash].receivedShipmentHash == 0, "Sent shipment data is already added");
        require(verifyProof(a, b, c, [uint256(shipmentLabelHash), uint256(receivedShipmentHash) ]) == true, "Invalid proof");

        shipments[shipmentLabelHash].receivedShipmentHash = receivedShipmentHash;
        shipments[shipmentLabelHash].receivedMass = receivedMass;
        shipments[shipmentLabelHash].receivedDate = receivedDate;
        shipments[shipmentLabelHash].isConfirmed = true;

        emit ShipmentConfirmed(shipmentLabelHash);
    }

    function getShipment(bytes32 shipmentLabelHash) public view returns (Shipment memory s) {
        s = shipments[shipmentLabelHash];
    }
}