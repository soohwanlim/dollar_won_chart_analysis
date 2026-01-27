
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import './App.css';
import { useLanguage } from './contexts/LanguageContext';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

function App() {
  const { language, setLanguage } = useLanguage();

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            <span className="logo-icon">📈</span>
            <span className="logo-text">RealK <span className="logo-sub">Market View</span></span>
          </Link>

          <div className="links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Navigation Menus */}
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} style={{ color: '#e5e7eb', textDecoration: 'none' }}>Home</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} style={{ color: '#e5e7eb', textDecoration: 'none' }}>About</NavLink>

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
            <a href="https://github.com/soohwanlim/dollar_won_chart_analysis" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af' }}>GitHub</a>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
        </Routes>

        <footer className="footer" style={{ textAlign: 'left', padding: '2rem', color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.35', borderTop: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <Link to="/about" style={{ color: '#9ca3af', textDecoration: 'none' }}>서비스 소개</Link>
            <Link to="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>개인정보처리방침</Link>
          </div>
          <p>© 2026 RealK Project</p>
          <p>made by nobonobo</p>
          <p>Data Based on yfinance, FinanceDataReader, FRED</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
