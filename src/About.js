import React from 'react';
import './About.css';
import Footer from './Footer'; // Import the Footer component

const About = () => {
  return (
    <>
    <div className="about-page">
      <div className="left">
        <ul>
          <li><a href="#intro">Introduction</a></li>
          <li><a href="#overview">Overview</a></li>
          <li><a href="#fees">Fees</a></li>
          <li><a href="#contact">Contact Us</a></li>
        </ul>
      </div>
      <div className="right">
        <h1 className="anchor" id="intro">What is BNBMarket?</h1>
        <p>
        BNBMarket is a prediction market platform built on the BNB Smart Chain. It enables you to stay informed and profit from your insights by betting on the outcomes of future events across diverse topics.
        </p>
        <p>Prediction markets, according to studies, often outperform individual experts. They do this by aggregating news, polls, and expert opinions into a single, real-time probability for each event. BNBMarket's markets provide accurate, unbiased, and up-to-date event probabilities that matter to you. After all, markets exist to uncover truth.</p>
        <h2 className="anchor" id="overview">Quick Overview</h2>
        <p>
        On BNBMarket, you can buy and sell shares representing future event outcomes (e.g. "Will BTC hit 100k in 2024?").
        </p>
        <p>
        Markets are manually resolved by our team once conditions are met. When dates are used, they refer to end of day UTC. For example, if the market is about BTC hitting 100k by 2024, it means that if BTC hits 100k before UTC Jan 1, 2025, it will be resolved as Yes. All values are based on USD unless otherwise stated.
        </p>
        <p>
        The winning reward distribution formula works like this: Imagine you and some friends bet on two options, A and B. If Option A wins, everyone who bet on Option A gets a reward. The reward is calculated by taking the total amount bet on the losing option (Option B) and distributing it proportionally among the winners based on how much each person bet on Option A.
        </p>
        <p>
        Here's a simple breakdown:</p>
        <p>
  1. Calculate the Reward Ratio: This is like figuring out how much of the losing bets each winner gets. You divide the total losing bets (Option B shares) by the total winning bets (Option A shares). This gives you a ratio that tells you how much each unit of the winning bet is worth in terms of the losing bets.</p>
        <p>
  2. Calculate Each Winner's Reward: For each winner, you multiply their bet (their shares in Option A) by this ratio. This gives you the additional reward they get from the losing bets. Then, you add their original bet back to this amount. So, each winner gets back their original bet plus a share of the losing bets, proportional to how much they bet on the winning option.

  </p>
  <p>
  In simple terms, it's like dividing a pie (the losing bets) among the winners based on how big their slices (their winning bets) are. The more you bet on the winning option, the bigger your slice of the pie!
  </p>
        <p>
        BNB token is the gas token and also used for buying shares.
        </p>
        <h3 className="anchor" id="fees">Fees</h3>
        <p>
        1% fee is paid to our developer wallet for each buy transaction. This helps us to continue funding and building the platform.
        </p>
        <h3>Terms of Use</h3>
        <p>
        You may use the Services only if you are at least 18 years old and not otherwise barred from using the Services under applicable law.
        </p>
        <p>
        Before participating in BNBMarket, please be aware of the inherent risks associated with smart contracts. While we strive to ensure the security and reliability of our platform, smart contracts are complex and can be subject to vulnerabilities, bugs, and unforeseen issues. Here are some key points to consider:</p>
        <p>Technical Risks: Smart contracts are code-based and can contain errors or vulnerabilities that may be exploited.</p>
        <p>Security Risks: Despite rigorous audits, smart contracts can still be targeted by malicious actors.</p>
        <p>Regulatory Risks: The legal and regulatory environment for smart contracts and blockchain technology is evolving and may impact your participation.</p>
        <p>Financial Risks: Engaging in prediction markets involves financial risk. Market conditions and event outcomes can be unpredictable, leading to potential losses.</p>
        <p>We strongly advise you to:</p>
        <p>Conduct Your Own Research: Understand the risks and implications of smart contracts and prediction markets.</p>
        <p>Use Caution: Only invest what you can afford to lose.</p>
        <p>Stay Informed: Keep up-to-date with the latest developments and security practices in the blockchain and smart contract space.</p>
        <p>By using BNBMarket, you acknowledge and accept these risks. </p>
        <h3 className="anchor" id="contact">Contact Us</h3>
        <p>
          If you have any questions or need assistance, reach out on X.
        </p>
        <p><strong>X:</strong> <a href="https://x.com/BNBMarket" target='_blank'>@BNBMarket</a></p>
      </div>
    </div>
    <Footer /> {/* Include the Footer component */}
    </>
  );
};

export default About;
