import React, { useState } from 'react';
import './WithdrawTokens.css';

const WithdrawTokens = ({ contract, account, marketId }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [withdrawn, setWithdrawn] = useState(false);

  const handleWithdraw = async () => {
    setLoading(true);
    setMessage('');
    setWithdrawn(false);
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setMessage('MetaMask is not installed');
        setLoading(false);
        return;
      }

      // Check if the market is resolved
      const market = await contract.methods.getMarketInfo(marketId).call();
      if (!market.resolved) {
        setMessage('Market is not resolved yet.');
        setLoading(false);
        return;
      }

      // Check if the user has shares to withdraw
      const shares = await contract.methods.getSharesBalance(marketId, account).call();
      if (shares.optionAShares === '0' && shares.optionBShares === '0') {
        setMessage('No shares to withdraw.');
        setLoading(false);
        return;
      }

      // Manually set a higher gas limit (adjust as needed)
      const gasLimit = 200000; // Example gas limit

      // Withdraw tokens
      await contract.methods.withdrawTokens(marketId).send({ from: account, gas: gasLimit });
      setMessage('Tokens withdrawn successfully!');
      setWithdrawn(true);
    } catch (error) {
      console.error('Error withdrawing tokens:', error);
      setMessage('Error withdrawing tokens: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <>
      {!withdrawn && (
        <>
        <p>Market cancelled. Withdraw your tokens.</p>
          <button className='withdraw-button' onClick={handleWithdraw} disabled={loading}>
            {loading ? 'Withdrawing...' : 'Withdraw Tokens'}
          </button>
          {message && <p>{message}</p>}
        </>
      )}
    </>
  );
  
};

export default WithdrawTokens;
