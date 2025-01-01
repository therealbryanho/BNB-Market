import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CreateMarket from './CreateMarket';
import Market from './Market';
import About from './About';
import BNBMarketContract from './BNBMarketContract.json';
import ERC20ABI from './ERC20ABI.json';
import './App.css'; // Import the CSS file
import Footer from './Footer'; // Import the Footer component

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [owner, setOwner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('open');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    } else {
      alert('MetaMask is not installed!');
    }
  }, []);

  const filterMarkets = () => {
    const currentTime = new Date();
    return markets.filter(market => {
      const endTime = new Date(Number(market.endTime) * 1000);
      
      switch(activeTab) {
        case 'open':
          return currentTime < endTime && !market.resolved;
        case 'ended':
          return currentTime > endTime && !market.resolved;
        case 'resolved':
          return market.resolved;
        default:
          return currentTime < endTime && !market.resolved; // Default to open markets
      }
    });
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);

        const web3Instance = new Web3(window.ethereum);
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = BNBMarketContract.networks[networkId];
        if (deployedNetwork) {
          const contractInstance = new web3Instance.eth.Contract(
            BNBMarketContract.abi,
            deployedNetwork.address,
          );
          setContract(contractInstance);
          const ownerAddress = await contractInstance.methods.owner().call();
          setOwner(ownerAddress);
        } else {
          alert('Contract not deployed on the selected network');
        }
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('MetaMask is not installed!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
  };

  const addBNBTestnet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x61', // Chain ID in hexadecimal
              chainName: 'BNB Testnet',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18,
              },
              rpcUrls: ['https://bsc-testnet-dataseed.bnbchain.org'],
              blockExplorerUrls: ['https://testnet.bscscan.com'],
            },
          ],
        });
      } catch (error) {
        console.error('Error adding BNB Testnet:', error);
      }
    } else {
      alert('MetaMask is not installed!');
    }
  };

  useEffect(() => {
    if (contract) {
      contract.methods.marketCount().call()
        .then(marketCount => {
          const marketPromises = [];
          for (let i = 0; i < marketCount; i++) {
            marketPromises.push(contract.methods.getMarketInfo(i).call());
          }
          Promise.all(marketPromises)
            .then(marketsInfo => {
              setMarkets(marketsInfo);
            })
            .catch(error => {
              console.error('Error fetching markets:', error);
            });
        })
        .catch(error => {
          console.error('Error fetching market count:', error);
        });
    }
  }, [contract]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDropdown = () => {
    console.log("Dropdown toggled. Previous state:", isDropdownOpen);
  setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <Router>
      <div className="App">
        <div className="top-menu">
          <a href="#" onClick={addBNBTestnet} className="top-menu-link">
            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="arrow-up-right" class="svg-inline--fa fa-arrow-up-right fa-fw fa-1x " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M328 96c13.3 0 24 10.7 24 24V360c0 13.3-10.7 24-24 24s-24-10.7-24-24V177.9L73 409c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l231-231H88c-13.3 0-24-10.7-24-24s10.7-24 24-24H328z"></path></svg>
            Add BNB Testnet to MetaMask
          </a>
          <a href="https://docs.bnbchain.org/bnb-smart-chain/developers/faucet/" target="_blank" rel="noopener noreferrer" className="top-menu-link">
            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="arrow-up-right" class="svg-inline--fa fa-arrow-up-right fa-fw fa-1x " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M328 96c13.3 0 24 10.7 24 24V360c0 13.3-10.7 24-24 24s-24-10.7-24-24V177.9L73 409c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l231-231H88c-13.3 0-24-10.7-24-24s10.7-24 24-24H328z"></path></svg>
            Faucet
          </a>
        </div>
        <header>
          <Link to="/" className="logo-link">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="logo" />
          </Link>

          <div className="header-right">
            {isConnected ? (
              <div className="wallet-info">
                <span>Connected: {account.substring(0, 4) + '...' + account.substring(account.length - 4)}</span>
                <button onClick={disconnectWallet} className="connect-button">Disconnect</button>
                {account && owner && account.toLowerCase() === owner.toLowerCase() && <CreateMarket web3={web3} contract={contract} account={account} />}
              </div>
            ) : (
              <button onClick={connectWallet} className="connect-button">Connect Wallet</button>
            )}
            <Link to="/about" className="about-link">Docs</Link>
            </div>
            {isMobileView && (
                <div className="dropdown-container">
                  <div className="thumbnail" onClick={toggleDropdown}>
                    <svg
                      className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
              {isDropdownOpen && (
                <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
                {isConnected ? (
                  <>
                    <div className="dropdown-item">
                      Connected: {account.substring(0, 4) + '...' + account.substring(account.length - 4)}
                    </div>
                    <div className="dropdown-item" onClick={disconnectWallet}>Disconnect</div>
                    {account && owner && account.toLowerCase() === owner.toLowerCase() && <div className="dropdown-item">Create Market</div>}
                  </>
                ) : (
                  <div className="dropdown-item" onClick={connectWallet}>Connect Wallet</div>
                )}
                <Link to="/about" className="dropdown-item">Docs</Link>
              </div>
              )}
            </div>
          )}
        </header>
        <Routes>
          <Route path="/" element={
            <>
            <div className='app-body'>
              <h1>Make your Prediction at BNBMarket</h1>
              <p>Ready to turn your knowledge into rewards? Join BNBMarket today and start trading on the outcomes of future events.</p>
              <p>Our prediction market platform combines the power of crowdsourced insights and real-time data to deliver accurate, unbiased probabilities.</p>
              <p>Note: BNBMarket is in BNB Testnet.</p>
              {isConnected ? (
                <div className="market-tabs">
                  <button 
                    className={activeTab === 'open' ? 'active' : ''} 
                    onClick={() => setActiveTab('open')}
                  >
                    Market Open
                  </button>
                  <button 
                    className={activeTab === 'ended' ? 'active' : ''} 
                    onClick={() => setActiveTab('ended')}
                  >
                    Market Ended
                  </button>
                  <button 
                    className={activeTab === 'resolved' ? 'active' : ''} 
                    onClick={() => setActiveTab('resolved')}
                  >
                    Market Resolved
                  </button>
                </div>
              ) : (
                <h4>Connect Wallet to Get Started.</h4>
              )}

              <div className="markets">
                {filterMarkets().reverse().map((market, index) => (
                  <Market
                    key={index}
                    market={market}
                    marketId={markets.indexOf(market)}
                    contract={contract}
                    account={account}
                    web3={web3}
                    contractABI={ERC20ABI}
                  />
                ))}
              </div>
              </div>
              <Footer /> {/* Include the Footer component */}
            </>
          } />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
