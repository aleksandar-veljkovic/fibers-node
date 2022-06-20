// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;
import "./shipment-verifier.sol";

contract Fibers is ShipmentVerifier {
    event SentShipmentRegistered(bytes32 shipmentId, bytes32 recipientCompany, bytes32 recipientDepartment);
    event ReceivedShipmentRegistered(bytes32 shipmentId, bytes32 senderCompany, bytes32 senderDepartment);
    event ShipmentConfirmed(bytes32 shipmentId);

    struct Shipment {
        bytes32 shipmentIdHash;
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
        bool isConfirmed;
    }

    mapping(bytes32 => Shipment) shipments;

    /**
     * Register new shipment as sender
     */
     function registerSentShipment(
        bytes32 shipmentIdHash,
        bytes32 sentShipmentHash,
        uint sentMass,
        uint sentDate,
        bytes32 senderCompany,
        bytes32 senderDepartment,
        bytes32 recipientCompany,
        bytes32 recipientDepartment
    ) public {
        require(shipments[shipmentIdHash].shipmentIdHash == bytes32(0), "Shipment already registered");

        Shipment memory newShipment;
        newShipment.shipmentIdHash = shipmentIdHash;
        newShipment.sentShipmentHash = sentShipmentHash;
        newShipment.sentMass = sentMass;
        newShipment.sentDate = sentDate;
        newShipment.senderCompany = senderCompany;
        newShipment.senderDepartment = senderDepartment;
        newShipment.recipientCompany = recipientCompany;
        newShipment.recipientDepartment = recipientDepartment;
        shipments[shipmentIdHash] = newShipment;
    }

    /**
     * Register new shipment as recipient
     */
     function registerReceivedShipment(
        bytes32 shipmentIdHash,
        bytes32 receivedShipmentHash,
        uint receivedMass,
        uint receivedDate,
        bytes32 senderCompany,
        bytes32 senderDepartment,
        bytes32 recipientCompany,
        bytes32 recipientDepartment
    ) public {
        require(shipments[shipmentIdHash].shipmentIdHash == bytes32(0), "Shipment already registered");

        Shipment memory newShipment;
        newShipment.shipmentIdHash = shipmentIdHash;
        newShipment.receivedShipmentHash = receivedShipmentHash;
        newShipment.receivedMass = receivedMass;
        newShipment.receivedDate = receivedDate;
        newShipment.senderCompany = senderCompany;
        newShipment.senderDepartment = senderDepartment;
        newShipment.recipientCompany = recipientCompany;
        newShipment.recipientDepartment = recipientDepartment;
        shipments[shipmentIdHash] = newShipment;
    }

    /**
     * Confirm received shipment
     */
     function confirmSentShipment(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        bytes32 shipmentIdHash,
        bytes32 sentShipmentHash,
        uint sentMass,
        uint sentDate
    ) public {
        require(shipments[shipmentIdHash].shipmentIdHash != bytes32(0), "Shipment not registered");
        require(shipments[shipmentIdHash].isConfirmed == false, "Shipment is already confirmed");
        require(shipments[shipmentIdHash].sentShipmentHash == 0, "Sent shipment data is already added");
        require(verifyProof(a, b, c, [uint(shipmentIdHash), uint(sentShipmentHash)]) == true, "Invalid proof");

        shipments[shipmentIdHash].sentShipmentHash = sentShipmentHash;
        shipments[shipmentIdHash].sentMass = sentMass;
        shipments[shipmentIdHash].sentDate = sentDate;
        shipments[shipmentIdHash].isConfirmed = true;
    }

    /**
     * Confirm received shipment
     */
     function confirmReceivedShipment(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        bytes32 shipmentIdHash,
        bytes32 receivedShipmentHash,
        uint receivedMass,
        uint receivedDate
    ) public {
        require(shipments[shipmentIdHash].shipmentIdHash != bytes32(0), "Shipment not registered");
        require(shipments[shipmentIdHash].isConfirmed == false, "Shipment is already confirmed");
        require(shipments[shipmentIdHash].receivedShipmentHash == 0, "Sent shipment data is already added");
        require(verifyProof(a, b, c, [uint256(shipmentIdHash), uint256(receivedShipmentHash) ]) == true, "Invalid proof");

        shipments[shipmentIdHash].receivedShipmentHash = receivedShipmentHash;
        shipments[shipmentIdHash].receivedMass = receivedMass;
        shipments[shipmentIdHash].receivedDate = receivedDate;
        shipments[shipmentIdHash].isConfirmed = true;
    }

    function getShipment(bytes32 shipmentIdHash) public view returns (Shipment memory s) {
        s = shipments[shipmentIdHash];
    }
}