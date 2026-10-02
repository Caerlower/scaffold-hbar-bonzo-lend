// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AuditAnchor
 * @notice Anchors Bonzo lending actions on-chain so they can be correlated with HCS topic messages.
 *         Anyone may record an action for themselves; the HCS sequence/hash is optional metadata.
 */
contract AuditAnchor {
    enum ActionType {
        Deposit,
        Withdraw,
        Borrow,
        Repay,
        Associate
    }

    struct ActionRecord {
        address user;
        ActionType actionType;
        address asset;
        uint256 amount;
        bytes32 hcsRef;
        uint64 timestamp;
    }

    event ActionAnchored(
        uint256 indexed id,
        address indexed user,
        ActionType actionType,
        address indexed asset,
        uint256 amount,
        bytes32 hcsRef,
        uint64 timestamp
    );

    ActionRecord[] private _actions;
    mapping(address => uint256[]) private _userActionIds;

    function recordAction(
        ActionType actionType,
        address asset,
        uint256 amount,
        bytes32 hcsRef
    ) external returns (uint256 id) {
        require(asset != address(0), "AuditAnchor: zero asset");
        id = _actions.length;
        uint64 ts = uint64(block.timestamp);
        _actions.push(
            ActionRecord({
                user: msg.sender,
                actionType: actionType,
                asset: asset,
                amount: amount,
                hcsRef: hcsRef,
                timestamp: ts
            })
        );
        _userActionIds[msg.sender].push(id);
        emit ActionAnchored(id, msg.sender, actionType, asset, amount, hcsRef, ts);
    }

    function getAction(uint256 id) external view returns (ActionRecord memory) {
        require(id < _actions.length, "AuditAnchor: invalid id");
        return _actions[id];
    }

    function actionCount() external view returns (uint256) {
        return _actions.length;
    }

    function getUserActionIds(address user) external view returns (uint256[] memory) {
        return _userActionIds[user];
    }
}
