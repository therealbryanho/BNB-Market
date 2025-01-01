import React, { useState } from 'react';

const CreateMarket = ({ web3, contract, account }) => {
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [duration, setDuration] = useState('');

  const createMarket = async () => {
    try {
      await contract.methods.createMarket(question, optionA, optionB, duration)
        .send({ from: account })
        .then(receipt => {
          console.log('Market created:', receipt);
        });
    } catch (error) {
      console.error('Error creating market:', error);
    }
  };

  return (
    <div className="create-market">
      <h2>Create a New Market</h2>
      <input type="text" placeholder="Question" value={question} onChange={e => setQuestion(e.target.value)} />
      <input type="text" placeholder="Option A" value={optionA} onChange={e => setOptionA(e.target.value)} />
      <input type="text" placeholder="Option B" value={optionB} onChange={e => setOptionB(e.target.value)} />
      <input type="number" placeholder="Duration (in seconds)" value={duration} onChange={e => setDuration(e.target.value)} />
      <button onClick={createMarket}>Create Market</button>
    </div>
  );
};

export default CreateMarket;
