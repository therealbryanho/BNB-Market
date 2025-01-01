import React, { useEffect, useState } from 'react';

const TotalLocked = ({ contract, web3 }) => {
  const [totalLocked, setTotalLocked] = useState(0);

  useEffect(() => {
    const fetchTotalLocked = async () => {
      try {
        const totalLocked = await contract.methods.getTotalLocked().call();
        const tvlShares = web3.utils.fromWei(totalLocked.toString(), 'ether');
        const total = parseFloat(tvlShares);
        setTotalLocked(total);
      } catch (error) {
        console.error('Error fetching total locked:', error);
      }
    };

    fetchTotalLocked();
  }, [contract]);

  return (
    <div>
      <h4>{totalLocked} shares traded till date</h4>
    </div>
  );
};

export default TotalLocked;
