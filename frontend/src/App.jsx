
import React, { useState } from 'react';
import RealPriceChart from './components/RealPriceChart';
import './App.css';

import { useLanguage } from './contexts/LanguageContext';

function App() {
  const [ticker, setTicker] = useState('005930'); // Default to Samsung Electronics
  const [searchInput, setSearchInput] = useState('005930');
  const { t, language, setLanguage } = useLanguage();

  const handleSearch = (e) => {
    e.preventDefault();
    setTicker(searchInput);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ko' : 'en');
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">📈</span>
          <span className="logo-text">RealK <span className="logo-sub">Market View</span></span>
        </div>
        <div className="links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="button-group">
            <button
              className={`group-btn ${language === 'ko' ? 'active' : ''}`}
              onClick={() => setLanguage('ko')}
            >
              KOR
            </button>
            <button
              className={`group-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              ENG
            </button>
          </div>
          <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </nav>

      <main className="main-content">
        <div className="hero-section">
          <h1>{t('hero.title')} <span className="highlight">{t('hero.highlight')}</span></h1>
          <p className="subtitle">
            {t('hero.subtitle')}
          </p>

          <form onSubmit={handleSearch} className="search-box">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('hero.searchPlaceholder')}
            />
            <button type="submit">{t('hero.searchButton')}</button>
          </form>
        </div>

        <section className="chart-section">
          <RealPriceChart ticker={ticker} />
        </section>

        <section className="info-section">
          <div className="info-card">
            <h3>{t('cards.dollarTitle')}</h3>
            <p>{t('cards.dollarDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('cards.inflationTitle')}</h3>
            <p>{t('cards.inflationDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('cards.illusionTitle')}</h3>
            <p>{t('cards.illusionDesc')}</p>
          </div>
        </section>
      </main>

      <footer className="footer" style={{ textAlign: 'left', padding: '2rem', color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.35' }}>
        <p>© 2026 RealK Project</p>
        <p>made by nobonobo</p>
        <p>Data Based on yfinance, FinanceDataReader, FRED</p>

      </footer>
    </div>
  );
}

export default App;
