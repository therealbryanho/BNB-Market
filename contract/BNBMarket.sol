// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Ownable} from "@thirdweb-dev/contracts/extension/Ownable.sol";
import {ReentrancyGuard} from "@thirdweb-dev/contracts/external-deps/openzeppelin/security/ReentrancyGuard.sol";

contract BNBMarket is Ownable, ReentrancyGuard {
    enum MarketOutcome {
        UNRESOLVED,
        OPTION_A,
        OPTION_B,
        CANCELLED
    }

    struct Market {
        string question;
        uint256 endTime;
        MarketOutcome outcome;
        string optionA;
        string optionB;
        uint256 totalOptionAShares;
        uint256 totalOptionBShares;
        bool resolved;
        mapping(address => uint256) optionASharesBalance;
        mapping(address => uint256) optionBSharesBalance;
        mapping(address => bool) hasClaimed;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;

    // Fee state variables
    uint256 public feePercentage; // Fee in basis points (1% = 100)
    address public feeRecipient;

    event MarketCreated(uint256 indexed marketId, string question, string optionA, string optionB, uint256 endTime);
    event SharesPurchased(uint256 indexed marketId, address indexed buyer, bool isOptionA, uint256 amount);
    event MarketResolved(uint256 indexed marketId, MarketOutcome outcome);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event FeeUpdated(uint256 newFeePercentage, address newFeeRecipient);
    event Withdrawn(uint256 indexed marketId, address indexed user, uint256 amount);

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
        feePercentage = 100; // Set fee to 1%
        _setupOwner(msg.sender);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return msg.sender == owner();
    }

    function setFee(uint256 _feePercentage, address _feeRecipient) external onlyOwner {
        require(_feePercentage <= 10000, "Fee percentage cannot exceed 100%");
        feePercentage = _feePercentage;
        feeRecipient = _feeRecipient;
        emit FeeUpdated(_feePercentage, _feeRecipient);
    }

    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        feeRecipient = _newFeeRecipient;
        emit FeeUpdated(feePercentage, _newFeeRecipient);
    }

    function createMarket(string memory _question, string memory _optionA, string memory _optionB, uint256 _duration) external onlyOwner returns (uint256) {
        require(_duration > 0, "Duration must be positive");
        require(bytes(_optionA).length > 0 && bytes(_optionB).length > 0, "Options cannot be empty");

        uint256 marketId = marketCount++;
        Market storage market = markets[marketId];

        market.question = _question;
        market.optionA = _optionA;
        market.optionB = _optionB;
        market.endTime = block.timestamp + _duration;
        market.outcome = MarketOutcome.UNRESOLVED;

        emit MarketCreated(marketId, _question, _optionA, _optionB, market.endTime);
        return marketId;
    }

    function buyShares(uint256 _marketId, bool _isOptionA) external payable {
        Market storage market = markets[_marketId];
        require(block.timestamp < market.endTime, "Market trading period has ended");
        require(!market.resolved, "Market already resolved");
        require(msg.value > 0, "Amount must be positive");

        // Calculate fee and net amount
        uint256 fee = (msg.value * feePercentage) / 10000;
        uint256 netAmount = msg.value - fee;

        payable(feeRecipient).transfer(fee);

        if (_isOptionA) {
            market.optionASharesBalance[msg.sender] += netAmount;
            market.totalOptionAShares += netAmount;
        } else {
            market.optionBSharesBalance[msg.sender] += netAmount;
            market.totalOptionBShares += netAmount;
        }

        emit SharesPurchased(_marketId, msg.sender, _isOptionA, netAmount);
    }

    /**
     * @notice Resolves a market by setting the outcome.
     * @param _marketId The ID of the market to resolve.
     * @param _outcome The outcome to set for the market.
     */
    function resolveMarket(uint256 _marketId, MarketOutcome _outcome) external {
        require(msg.sender == owner(), "Only owner can resolve markets");
        Market storage market = markets[_marketId];
        require(!market.resolved, "Market already resolved");
        require(_outcome != MarketOutcome.UNRESOLVED, "Invalid outcome");

        market.outcome = _outcome;
        market.resolved = true;

        emit MarketResolved(_marketId, _outcome);
    }

    function hasUserClaimed(uint256 _marketId, address _user) external view returns (bool) {
        return markets[_marketId].hasClaimed[_user];
    }

    /**
     * @notice Claims winnings for the caller if they participated in a resolved market.
     * @param _marketId The ID of the market to claim winnings from.
     */
    function claimWinnings(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved yet");

        uint256 userShares;
        uint256 winningShares;
        uint256 losingShares;

        if (market.outcome == MarketOutcome.OPTION_A) {
            userShares = market.optionASharesBalance[msg.sender];
            winningShares = market.totalOptionAShares;
            losingShares = market.totalOptionBShares;
            market.optionASharesBalance[msg.sender] = 0;
        } else if (market.outcome == MarketOutcome.OPTION_B) {
            userShares = market.optionBSharesBalance[msg.sender];
            winningShares = market.totalOptionBShares;
            losingShares = market.totalOptionAShares;
            market.optionBSharesBalance[msg.sender] = 0;
        } else {
            revert("Market outcome is not valid");
        }

        require(userShares > 0, "No winnings to claim");

        // Calculate the reward ratio
        uint256 rewardRatio = (losingShares * 1e18) / winningShares; // Using 1e18 for precision

        // Calculate winnings: original stake + proportional share of losing funds
        uint256 winnings = userShares + (userShares * rewardRatio) / 1e18;

        payable(msg.sender).transfer(winnings);

        emit Claimed(_marketId, msg.sender, winnings);
    }

    /**
     * @notice Allows users to withdraw their tokens if the market is resolved and there are no winners.
     * @param _marketId The ID of the market to withdraw from.
     */
    function withdrawTokens(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved yet");

        uint256 userAShares;
        uint256 userBShares;
        uint256 userShares;

        if (market.outcome == MarketOutcome.CANCELLED) {
            userAShares = market.optionASharesBalance[msg.sender];
            market.optionASharesBalance[msg.sender] = 0;
            userBShares = market.optionBSharesBalance[msg.sender];
            market.optionBSharesBalance[msg.sender] = 0;
            userShares = userAShares + userBShares;
        } else {
            revert("Market outcome is not valid");
        }

        require(userShares > 0, "No tokens to withdraw");

        payable(msg.sender).transfer(userShares);

        emit Withdrawn(_marketId, msg.sender, userShares);
    }

    /**
     * @notice Returns detailed information about a specific market.
     * @param _marketId The ID of the market to retrieve information for.
     * @return question The market's question.
     * @return optionA The first option for the market.
     * @return optionB The second option for the market.
     * @return endTime The end time of the market.
     * @return outcome The outcome of the market.
     * @return totalOptionAShares Total shares bought for Option A.
     * @return totalOptionBShares Total shares bought for Option B.
     * @return resolved Whether the market has been resolved.
     */
    function getMarketInfo(
        uint256 _marketId
    )
        external
        view
        returns (
            string memory question,
            string memory optionA,
            string memory optionB,
            uint256 endTime,
            MarketOutcome outcome,
            uint256 totalOptionAShares,
            uint256 totalOptionBShares,
            bool resolved
        )
    {
        Market storage market = markets[_marketId];
        return (
            market.question,
            market.optionA,
            market.optionB,
            market.endTime,
            market.outcome,
            market.totalOptionAShares,
            market.totalOptionBShares,
            market.resolved
        );
    }

    /**
     * @notice Returns the shares balance for a specific user in a market.
     * @param _marketId The ID of the market to check.
     * @param _user The address of the user to check balance for.
     * @return optionAShares The user's shares for Option A.
     * @return optionBShares The user's shares for Option B.
     */
    function getSharesBalance(
        uint256 _marketId,
        address _user
    ) external view returns (uint256 optionAShares, uint256 optionBShares) {
        Market storage market = markets[_marketId];
        return (
            market.optionASharesBalance[_user],
            market.optionBSharesBalance[_user]
        );
    }

    /**
     * @notice Allows multiple users to claim their winnings in a batch for a given market.
     * @param _marketId The ID of the market for which winnings are claimed.
     * @param _users Array of user addresses who wish to claim their winnings.
     */
    function batchClaimWinnings(
        uint256 _marketId,
        address[] calldata _users
    ) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved yet");

        for (uint256 i = 0; i < _users.length; i++) {
            address user = _users[i];

            // Skip if the user already claimed
            if (market.hasClaimed[user]) {
                continue;
            }

            uint256 userShares;
            uint256 winningShares;
            uint256 losingShares;

            // Determine user shares and winning/losing shares based on the outcome
            if (market.outcome == MarketOutcome.OPTION_A) {
                userShares = market.optionASharesBalance[user];
                winningShares = market.totalOptionAShares;
                losingShares = market.totalOptionBShares;
                market.optionASharesBalance[user] = 0; //Reset user shares after claim
            } else if (market.outcome == MarketOutcome.OPTION_B) {
                userShares = market.optionBSharesBalance[user];
                winningShares = market.totalOptionBShares;
                losingShares = market.totalOptionAShares;
                market.optionBSharesBalance[user] = 0; // Reset user's shares after claim
            } else {
                revert("Market outcome is not valid");
            }

            // We need to ensure the user has winnings to claim
            if (userShares == 0) {
                continue;
            }

            // Calculate the reward ratio and user's winnings
            uint256 rewardRatio = (losingShares * 1e18) / winningShares;
            uint256 winnings = userShares + (userShares * rewardRatio) / 1e18;

            // Mark the user as having claimed winnings
            market.hasClaimed[user] = true;

            // Transfer winnings to the user
            payable(user).transfer(winnings);

            // emit and event for each user who claimed winnings
            emit Claimed(_marketId, user, winnings);
        }
    }

    /**
     * @notice Returns the total amount of tokens locked in all markets.
     * @return totalLocked The total amount of tokens locked in all markets.
     */
    function getTotalLocked() external view returns (uint256 totalLocked) {
        uint256 total = 0;
        for (uint256 i = 0; i < marketCount; i++) {
            Market storage market = markets[i];
            total += market.totalOptionAShares + market.totalOptionBShares;
        }
        return total;
    }
}
