import React, { useState } from 'react';
import RealPriceChart from '../components/RealPriceChart';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage = () => {
    const [ticker, setTicker] = useState('005930');
    const [searchInput, setSearchInput] = useState('005930');
    const { t } = useLanguage();

    const handleSearch = (e) => {
        e.preventDefault();
        setTicker(searchInput);
    };

    return (
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
    );
};

export default HomePage;
