import React, { useEffect, useState } from 'react';
import './ClaimWinnings.css'; // Import the CSS file

const ClaimWinnings = ({ marketId, contract, account, market, web3 }) => {
  const [userShares, setUserShares] = useState({ optionAShares: 0, optionBShares: 0 });
  const [claimed, setClaimed] = useState(false);
  const [winnings, setWinnings] = useState(0);
  const [incentive, setIncentive] = useState(0);

  useEffect(() => {
    if (market.resolved && account) {
      // Fetch user shares
      contract.methods.getSharesBalance(marketId, account).call()
        .then(({ optionAShares, optionBShares }) => {
          console.log('Shares balance fetched:', { optionAShares, optionBShares });
          setUserShares({ optionAShares, optionBShares });
          calculateWinnings(optionAShares, optionBShares);
        })
        .catch(error => {
          console.error('Error fetching shares balance:', error);
        });

      // Fetch claimed status for the connected account
      contract.methods.hasUserClaimed(marketId, account).call()
        .then(hasClaimed => {
          console.log("hasClaimed::" + hasClaimed);
          setClaimed(hasClaimed);
        })
        .catch(error => {
          console.error('Error checking claimed status:', error);
        });
    }
  }, [market.resolved, marketId, contract, account]);

  const calculateWinnings = (optionAShares, optionBShares) => {
    let userShares, winningShares, losingShares;
    if (market.outcome == '1') { // OPTION_A
      userShares = optionAShares;
      winningShares = market.totalOptionAShares;
      losingShares = market.totalOptionBShares;
    } else if (market.outcome == '2') { // OPTION_B
      userShares = optionBShares;
      winningShares = market.totalOptionBShares;
      losingShares = market.totalOptionAShares;
    } else {
      setWinnings(0);
      return;
    }
    if (userShares > 0) {
      const userSharesT = web3.utils.fromWei(userShares.toString(), 'ether');
      const losingSharesT = web3.utils.fromWei(losingShares.toString(), 'ether');
      const winningSharesT = web3.utils.fromWei(winningShares.toString(), 'ether');
      const rewardRatio = losingSharesT / winningSharesT;
      const incentive = parseFloat(userSharesT * rewardRatio);
      setIncentive(parseFloat(incentive).toFixed(4));
      const winnings = parseFloat(userSharesT) + parseFloat(userSharesT * rewardRatio);
      setWinnings(parseFloat(winnings).toFixed(4));
      //setWinnings(web3.utils.fromWei(winnings.toString(), 'ether'));
    } else {
      setWinnings(0);
    }
  };

  const claimWinnings = async () => {
    try {
      await contract.methods.claimWinnings(marketId)
        .send({ from: account })
        .then(receipt => {
          console.log('Winnings claimed:', receipt);
          setClaimed(true);
        });
    } catch (error) {
      console.error('Error claiming winnings:', error);
    }
  };

  const hasWinningsToClaim = () => {
    const userAShares = web3.utils.fromWei(userShares.optionAShares.toString(), 'ether');
    const userBShares = web3.utils.fromWei(userShares.optionBShares.toString(), 'ether');
    if (market.outcome == 1 && parseFloat(userAShares) > 0) {
      return true;
    }
    if (market.outcome == 2 && parseFloat(userBShares) > 0) {
      return true;
    }
    return false;
  };

  return (
    <div className="claim-winnings">
      {hasWinningsToClaim() && !claimed && (
        <div>
          <p>Incentive {incentive} BNB.</p>
          <p>Withdraw Total {winnings} BNB.</p>
          <button className="claim-winnings-button" onClick={claimWinnings}>Claim All</button>
        </div>
      )}
      {claimed && (
        <p>All tokens have been claimed.</p>
      )}
    </div>
  );
};

export default ClaimWinnings;
