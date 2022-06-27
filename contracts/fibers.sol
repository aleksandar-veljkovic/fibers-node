// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;
import "./shipment-verifier.sol";

contract Fibers is ShipmentVerifier {
    address owner;

    constructor() {
        owner = msg.sender;
    }

    event ShipmentRegistered(bytes32 shipmentLabelHash, bytes32 senderDepartment, bytes32 recipientDepartment);
    event ShipmentConfirmed(bytes32 shipmentLabelHash);

    struct User {
        bytes32 companyId;
        bytes32 departmentId;
        bool isActive;
    }

    mapping(address => User) whitelistedUsers;

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
        uint creationTimestamp;
        bool isConfirmed;
        
    }

    mapping(bytes32 => Shipment) shipments;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
    * Whitelist new user
    */
    function addUser(address wallet, bytes32 companyId, bytes32 departmentId) public onlyOwner {
        require(whitelistedUsers[wallet].companyId == 0, "User already registered");

        whitelistedUsers[wallet].companyId = companyId;
        whitelistedUsers[wallet].departmentId = departmentId;
        whitelistedUsers[wallet].isActive = true;
    }

    /**
    * Deactivate user
    */
    function deactivateUser(address wallet) public onlyOwner {
        require(whitelistedUsers[wallet].companyId != 0, "Unknown user");
        whitelistedUsers[wallet].isActive = false;
    }

    /**
    * Get shipment by label hash
    */
    function getShipment(bytes32 shipmentLabelHash) public view returns (Shipment memory s) {
        s = shipments[shipmentLabelHash];
    }

    /**
     * Register new shipment
     */
     function registerShipment(
        bytes32 shipmentLabelHash,
        bytes32 shipmentHash,
        uint shipmentMass,
        uint shipmentDate,
        bytes32 senderCompany,
        bytes32 senderDepartment,
        bytes32 recipientCompany,
        bytes32 recipientDepartment
    ) public {
        require(shipments[shipmentLabelHash].shipmentLabelHash == bytes32(0), "Shipment already registered");
        require(whitelistedUsers[msg.sender].companyId != 0, "Unknown user");
        require(whitelistedUsers[msg.sender].isActive, "Inactive user");
        require((
            whitelistedUsers[msg.sender].companyId == senderCompany &&
            whitelistedUsers[msg.sender].departmentId == senderDepartment
        )
        || 
        (
            whitelistedUsers[msg.sender].companyId == recipientCompany &&
            whitelistedUsers[msg.sender].departmentId == recipientDepartment
        ), "User is not sender nor recipient");

        Shipment memory newShipment;
        newShipment.senderCompany = senderCompany;
        newShipment.senderDepartment = senderDepartment;
        newShipment.recipientCompany = recipientCompany;
        newShipment.recipientDepartment = recipientDepartment;
        newShipment.shipmentCreator = whitelistedUsers[msg.sender].departmentId;
        newShipment.shipmentLabelHash = shipmentLabelHash;
        newShipment.creationTimestamp = block.timestamp;
        
        if (whitelistedUsers[msg.sender].companyId == senderCompany) {
            newShipment.sentShipmentHash = shipmentHash;
            newShipment.sentMass = shipmentMass;
            newShipment.sentDate = shipmentDate;
        } else {
            newShipment.receivedShipmentHash = shipmentHash;
            newShipment.receivedMass = shipmentMass;
            newShipment.receivedDate = shipmentDate;
        }
        
        shipments[shipmentLabelHash] = newShipment;

        emit ShipmentRegistered(shipmentLabelHash, senderDepartment, recipientDepartment);
    }

    /**
     * Confirm shipment
     */
     function confirmShipment(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        bytes32 shipmentLabelHash,
        bytes32 shipmentHash,
        uint shipmentMass,
        uint shipmentDate
    ) public {
        require(shipments[shipmentLabelHash].shipmentLabelHash != bytes32(0), "Shipment not registered");
        require(shipments[shipmentLabelHash].isConfirmed == false, "Shipment is already confirmed");
        require(whitelistedUsers[msg.sender].isActive, "Inactive user");
        require(verifyProof(a, b, c, [uint(shipmentLabelHash), uint(shipmentHash)]) == true, "Invalid proof");
        require((
            shipments[shipmentLabelHash].sentShipmentHash == 0 &&
            whitelistedUsers[msg.sender].companyId == shipments[shipmentLabelHash].senderCompany &&
            whitelistedUsers[msg.sender].departmentId == shipments[shipmentLabelHash].senderDepartment
        )
        || 
        (
            shipments[shipmentLabelHash].receivedShipmentHash == 0 &&
            whitelistedUsers[msg.sender].companyId == shipments[shipmentLabelHash].recipientCompany &&
            whitelistedUsers[msg.sender].departmentId == shipments[shipmentLabelHash].recipientDepartment
        ), "Invalid user action");
        
        shipments[shipmentLabelHash].isConfirmed = true;

        if (whitelistedUsers[msg.sender].companyId == shipments[shipmentLabelHash].senderCompany) {
            shipments[shipmentLabelHash].sentShipmentHash = shipmentHash;
            shipments[shipmentLabelHash].sentMass = shipmentMass;
            shipments[shipmentLabelHash].sentDate = shipmentDate;
        } else {
            shipments[shipmentLabelHash].receivedShipmentHash = shipmentHash;
            shipments[shipmentLabelHash].receivedMass = shipmentMass;
            shipments[shipmentLabelHash].receivedDate = shipmentDate;
        }

        emit ShipmentConfirmed(shipmentLabelHash);
    }
}