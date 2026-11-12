
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AgriTrace {

    enum Status {
        Registered,
        ReceivedAtCollection,
        InTransitToDistributor,
        ReceivedAtDistributor,
        InTransitToRetailer,
        ReceivedAtRetailer,
        DeliveredToConsumer
    }

    struct Batch {
        string batchId;
        string cropName;
        string farmerName;
        uint256 quantity;
        string origin;
        Status currentStatus;
        bool exists;
    }

    mapping(string => Batch) public batches;

    event BatchRegistered(string batchId, string cropName);

    event StatusUpdated(
        string batchId,
        Status status,
        uint256 timestamp
    );

    function registerBatch(
        string memory _batchId,
        string memory _cropName,
        string memory _farmerName,
        uint256 _quantity,
        string memory _origin
    ) public {
        require(!batches[_batchId].exists, "Batch already exists");

        batches[_batchId] = Batch(
            _batchId,
            _cropName,
            _farmerName,
            _quantity,
            _origin,
            Status.Registered,
            true
        );

        emit BatchRegistered(_batchId, _cropName);
        emit StatusUpdated(_batchId, Status.Registered, block.timestamp);
    }

    function updateStatus(
        string memory _batchId,
        Status _newStatus
    ) public {
        require(batches[_batchId].exists, "Batch not found");

        Batch storage batch = batches[_batchId];

        require(
            uint8(_newStatus) == uint8(batch.currentStatus) + 1,
            "Invalid status transition"
        );

        batch.currentStatus = _newStatus;

        emit StatusUpdated(_batchId, _newStatus, block.timestamp);
    }

    function getBatch(
        string memory _batchId
    ) public view returns (Batch memory) {
        require(batches[_batchId].exists, "Batch not found");

        return batches[_batchId];
    }
}
