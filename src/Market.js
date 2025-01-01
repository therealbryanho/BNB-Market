import React, { useState, useEffect } from 'react';
import BuyShares from './BuyShares';
import ClaimWinnings from './ClaimWinnings';
import WithdrawTokens from './WithdrawTokens';
import './Market.css'; // Import the CSS file
import { createClient } from '@supabase/supabase-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SimpleMarketBar = ({ optionA, optionB, totalOptionAShares, totalOptionBShares }) => {
  const totalShares = parseFloat(totalOptionAShares) + parseFloat(totalOptionBShares);
  const optionAPercentage = totalShares > 0 ? (parseFloat(totalOptionAShares) / totalShares) * 100 : 0;
  const optionBPercentage = totalShares > 0 ? (parseFloat(totalOptionBShares) / totalShares) * 100 : 0;
  
  const getBarColor = () => {
    if (optionAPercentage === 0 && optionBPercentage === 0) {
      return '#202222';  // Grey when no shares
    }
    return {
      optionA: '#21B7CD',  // Green for Option A
      optionB: '#954455'   // Red for Option B
    };
  };

  const barColor = getBarColor();

  return (
    <div style={{ 
      width: '100%', 
      height: '10px', 
      display: 'flex',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '10px',
      backgroundColor: typeof barColor === 'string' ? barColor : 'transparent'
    }}>
      {typeof barColor !== 'string' && (
        <>
          <div 
            style={{
              width: `${optionAPercentage}%`, 
              backgroundColor: barColor.optionA,
              height: '100%'
            }}
          />
          <div 
            style={{
              width: `${optionBPercentage}%`, 
              backgroundColor: barColor.optionB,
              height: '100%'
            }}
          />
        </>
      )}
    </div>
  );
};

const Market = ({ market, marketId, contract, account, web3, contractABI }) => {
  const [marketData, setMarketData] = useState(market);
  const [userShares, setUserShares] = useState({ optionAShares: 0, optionBShares: 0 });
  const [showBuyShares, setShowBuyShares] = useState(true);
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [option, setOption] = useState(null);
  const [newsFeed, setNewsFeed] = useState([]);
  const [activeTab, setActiveTab] = useState('News'); 
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState('');

  const refreshMarket = async () => {
    const updatedMarket = await contract.methods.getMarketInfo(marketId).call();
    setMarketData(updatedMarket);
  };

  const fetchUserShares = async () => {
    if (account) {
      const sharesBalance = await contract.methods.getSharesBalance(marketId, account).call();
      setUserShares({
        optionAShares: web3.utils.fromWei(sharesBalance.optionAShares.toString(), 'ether'),
        optionBShares: web3.utils.fromWei(sharesBalance.optionBShares.toString(), 'ether'),
      });
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('marketid', marketId)
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const marketid = formData.get('marketid');
    const name = formData.get('name');
    const comments = formData.get('comments');
  
    const { data, error } = await supabase
      .from('comments')
      .insert([{ marketid, name, comments }]);
  
    if (error) {
      console.error('Error submitting comment:', error);
      setMessage('Failed to submit comment.');
    } else {
      setMessage('Comment submitted successfully.');
      setName('');
      setCommentText('');
      fetchComments();
    }
  };

  const flagComment = async (id) => {
    console.log('Flagging comment with id:', id);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ flag: true })
        .eq('id', id);
  
      if (error) {
        console.error('Error flagging comment:', error);
      } else {
        setComments(comments.map(comment => comment.id === id ? { ...comment, flag: true } : comment));
      }
    } catch (error) {
      console.error('Unexpected error flagging comment:', error);
    }
  };
  
  

  useEffect(() => {
    if (contract) {
      refreshMarket();
      fetchUserShares();
    }
  }, [contract, marketId, account]);

  useEffect(() => {
    const interval = setInterval(() => {
      const endTime = new Date(Number(marketData.endTime) * 1000);
      const currentTime = new Date();
      if (currentTime > endTime) {
        setShowBuyShares(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [marketData]);

  const endTime = new Date(Number(marketData.endTime) * 1000);
  const currentTime = new Date();
  const timeZoneOffset = Intl.DateTimeFormat('en-US', { timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
    .find(part => part.type === 'timeZoneName')?.value;
  const formattedEndTime = `${timeZoneOffset} ${endTime.getDate().toString().padStart(2, '0')}-${(endTime.getMonth() + 1).toString().padStart(2, '0')}-${endTime.getFullYear()} ${endTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
  const totalOptionAShares = web3.utils.fromWei(marketData.totalOptionAShares.toString(), 'ether');
  const totalOptionBShares = web3.utils.fromWei(marketData.totalOptionBShares.toString(), 'ether');
  const totalShares = parseFloat(totalOptionAShares) + parseFloat(totalOptionBShares);
  const optionAPercentage = totalShares > 0 ? (parseFloat(totalOptionAShares) / totalShares) * 100 : 0;
  const optionBPercentage = totalShares > 0 ? (parseFloat(totalOptionBShares) / totalShares) * 100 : 0;

  useEffect(() => {
    if (marketData.question.includes('BNB')) {
      const script = document.createElement('script');
      script.src = "https://widgets.coingecko.com/gecko-coin-price-chart-widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
    if (marketData.question.includes('BTC')) {
      const script = document.createElement('script');
      script.src = "https://widgets.coingecko.com/gecko-coin-price-chart-widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [marketData.question]);

  useEffect(() => {
    const fetchNewsFeed = async () => {
      try {
        const response = await fetch('https://fpxralnysxcyrjnsvtln.supabase.co/storage/v1/object/public/bnbmarket/NewsFeed.json?t=2025-01-01T23%3A22%3A52.814Z');
        const data = await response.json();
        setNewsFeed(data);
      } catch (error) {
        console.error('Error fetching news feed:', error);
      }
    };

    fetchNewsFeed();
  }, []);

  useEffect(() => {
    fetchComments();
  }, [marketId]);  

  return (
    <div className={`market ${marketData.resolved ? 'resolved' : 'active'}`}>
      {currentTime > endTime && marketData.resolved && <span className="market-resolved">Market Resolved</span>}
      {currentTime < endTime && !marketData.resolved && <span className="market-open">Market Open</span>}
      {currentTime > endTime && !marketData.resolved && <span className="market-ended">Market Ended</span>}
      {currentTime > endTime && !marketData.resolved && <span className="pending-resolution">Pending Resolution</span>}
      <h3>{marketData.question}</h3>
      <div class="market-overview market-blocks">
        <h4>Market Overview</h4>
        <SimpleMarketBar 
          optionA={marketData.optionA}
          optionB={marketData.optionB}
          totalOptionAShares={totalOptionAShares}
          totalOptionBShares={totalOptionBShares}
        />
        <div class="market-overview-text">
          <p className="yes"><span>{optionAPercentage.toFixed(2)}%</span>{marketData.optionA}: {totalOptionAShares} shares</p>
          <p className="no"><span>{optionBPercentage.toFixed(2)}%</span>{marketData.optionB}: {totalOptionBShares} shares</p>
        </div>
      </div>
      {marketData.resolved ? (
  <div className="market-blocks market-outcome">
    <h4>Outcome</h4>
    <p 
      className='outcome-text'
        style={{
          backgroundColor: 
            marketData.outcome === 1n 
              ? '#21B7CD'  // Green for Option A
              : marketData.outcome === 2n 
              ? '#954455'  // Red for Option B
              : marketData.outcome === 3n 
              ? '#2E565D'  // Orange for Cancelled
              : 'transparent',
              fontWeight: '600',
              color: '#E7E7E5',
              padding: '5px 10px',
              borderRadius: '3px',
              display: 'inline-block'
            }}
          >
            {console.log('Resolved:', marketData.resolved, 'Outcome:', marketData.outcome)}
            {marketData.resolved
              ? marketData.outcome === 1n
                ? marketData.optionA
                : marketData.outcome === 2n
                ? marketData.optionB
                : marketData.outcome === 3n
                ? 'CANCELLED'
                : 'CANCELLED'
              : ' - '}
          </p>
        </div>
      ) : (
        <></>
      )}
      {showBuyShares && currentTime < endTime && !marketData.resolved && <BuyShares
        marketId={marketId}
        contract={contract}
        account={account}
        web3={web3}
        contractABI={contractABI}
        market={marketData}
        refreshMarket={refreshMarket}
        fetchUserShares={fetchUserShares}
      />}
      <div class="market-chart market-blocks">
        {marketData.question.includes('BNB') && (
          <gecko-coin-price-chart-widget locale="en" dark-mode="true" transparent-background="true" coin-id="binancecoin" initial-currency="usd"></gecko-coin-price-chart-widget>
        )}
        {marketData.question.includes('BTC') && (
          <gecko-coin-price-chart-widget locale="en" dark-mode="true" transparent-background="true" coin-id="bitcoin" initial-currency="usd"></gecko-coin-price-chart-widget>
        )}
      </div>
      <div className="market-blocks">
        <h4>Your Shares</h4>
        <div className="your-shares">
          <div className="your-share-amt"><span>{marketData.optionA}:</span> <div class="fill-empty-space"></div><span className="amt">{userShares.optionAShares}</span></div>
          <div className="your-share-amt"><span>{marketData.optionB}:</span> <div class="fill-empty-space"></div><span className="amt">{userShares.optionBShares}</span></div>
        </div>
      </div>
      {marketData.resolved && marketData.outcome !== 0 && marketData.outcome !== 3 && account && (
        <ClaimWinnings
          marketId={marketId}
          contract={contract}
          account={account}
          market={marketData}
          web3={web3}
        />
      )}

      {marketData.resolved && marketData.outcome == 3 && (userShares.optionAShares > 0 || userShares.optionBShares > 0) && (
        <WithdrawTokens
          contract={contract}
          account={account}
          marketId={marketId}
        />
      )}

      <p className="end-time">Market Close {formattedEndTime}</p>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'News' ? 'active' : ''}`}
          onClick={() => setActiveTab('News')}
        >
          News
        </button>
        <button
          className={`tab-button ${activeTab === 'Community' ? 'active' : ''}`}
          onClick={() => setActiveTab('Community')}
        >
          Community
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'News' && (
        <div className="news-feed">
          {newsFeed
            .filter(item =>
              marketData.question.includes('BTC')
                ? item.ticker === 'BTC'
                : marketData.question.includes('BNB')
                ? item.ticker === 'BNB'
                : false
            )
            .map((item, index) => (
              <div key={index} className="news-item">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                <h5 className="news-title">{item.title}</h5>
                </a>
                <p className="news-date">{item.date}</p>
                <span className={`sentiment-label ${item.sentiment.toLowerCase()}`}>
                  {item.sentiment}
                </span>
              </div>
            ))}
        </div>
         )}
        {activeTab === 'Community' && (
  <div className="community-feed">
    <form onSubmit={submitComment}>
      <input type="hidden" name="marketid" value={marketId} />
      <p>What do you think?</p>
      <input
        type="text"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
      />
      <textarea
        name="comments"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Your comment"
        required
      ></textarea>
      <button type="submit">Submit</button>
    </form>
    {message && <p>{message}</p>}
    <div className="comments-list">
      {comments.map(comment => (
        !comment.flag && (
          <div key={comment.id} className="comment">
            <div className="comment-meta">
              <p>
              {new Date(comment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              , {new Date(comment.created_at).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
              <button
                className="flag-button"
                onClick={() => flagComment(comment.id)}
                title="Flag as Spam"
              >
                <FontAwesomeIcon icon={faFlag} />
              </button>
            </div>
            <p className="comment-text"><b>{comment.name}</b>: {comment.comments}</p>
            
          </div>
        )
      ))}
    </div>
  </div>
)}


      </div>


    </div>
  );
};

export default Market;
