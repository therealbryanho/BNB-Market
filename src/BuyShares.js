import React, { useState } from 'react';
import './BuyShares.css';

const BuyShares = ({ marketId, contract, account, web3, market, refreshMarket, fetchUserShares }) => {
  const [step, setStep] = useState(0);
  const [isOptionA, setIsOptionA] = useState(true);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOptionClick = (option) => {
    setIsOptionA(option);
    setStep(1);
  };

  const handleCancel = () => {
    setStep(0);
    setAmount('');
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      try {
        const value = web3.utils.toWei(amount, 'ether');
        await contract.methods.buyShares(marketId, isOptionA)
          .send({ from: account, value })
          .then(receipt => {
            console.log('Shares bought:', receipt);
            handleCancel();
            refreshMarket(); // Refresh the market values
            fetchUserShares();
          });
      } catch (error) {
        console.error('Error buying shares:', error);
        setLoading(false);
      }
    }
  };

  return (
    <div className="buy-shares">
      {step === 0 && (
        <>
          <button className="option-button green" onClick={() => handleOptionClick(true)}>
            Buy {market.optionA} ⇈
          </button>
          <button className="option-button red" onClick={() => handleOptionClick(false)}>
            Buy {market.optionB} ⇊
          </button>
        </>
      )}
      {step === 1 && (
        <>
          <input type="number" placeholder="BNB" value={amount} onChange={e => setAmount(e.target.value)} />
          <p>Please enter amount.</p>
          <button className="confirm-button" onClick={handleConfirm}>Confirm</button>
          <button className="cancel-button" onClick={handleCancel}>Cancel</button>
          <p className="fine-print">0.001 BNB = 0.99 SHARE<br></br>1% fee applies for each purchase</p>
        </>
      )}
      {step === 2 && (
        <>
          <p>Please confirm the transaction.</p>
          <button className="confirm-button" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
          <button className="cancel-button" onClick={handleCancel} disabled={loading}>Cancel</button>
        </>
      )}
    </div>
  );
};

export default BuyShares;
