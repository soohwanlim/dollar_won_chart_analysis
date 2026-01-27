import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ReferenceLine,
    AreaChart
} from 'recharts';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../config';

const RealPriceChart = ({ ticker }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('10y');
    const [isIndexed, setIsIndexed] = useState(false); // New state for Indexing Mode
    const [isGoldMode, setIsGoldMode] = useState(false); // Gold Standard Mode
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [companyName, setCompanyName] = useState(null);
    const [isSimulated, setIsSimulated] = useState(false);
    const [simulationRate, setSimulationRate] = useState(1300);
    const [investmentDate, setInvestmentDate] = useState('');
    const [investmentPrice, setInvestmentPrice] = useState('');
    const [showDisparity, setShowDisparity] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, date: null, price: null });
    const [isGhostMode, setIsGhostMode] = useState(false); // Ghost Mode (Index Comparison)
    const [benchmark, setBenchmark] = useState('^KS11'); // KOSPI default
    const [overallAlpha, setOverallAlpha] = useState(0);
    const { t, language } = useLanguage();

    // Helper to normalise data to base 100
    // Helper to normalise data to base 100
    const getIndexedData = (rawData) => {
        if (!rawData || rawData.length === 0) return [];

        let base = rawData[0]; // Default base is the first data point

        // If Investment Info is provided, find the closest data point
        if (investmentDate && investmentPrice) {
            // Find data point matching date or closest after
            const target = rawData.find(d => d.date >= investmentDate);
            if (target) {
                // We use the User's Price as Base for KRW
                // For USD, we need to estimate the exchange rate at that time.
                // Exchange Rate = target.close / target.real_price_usd
                // So Base USD = UserPrice / (target.close / target.real_price_usd)

                const exchangeRate = target.close / target.real_price_usd;

                base = {
                    ...target,
                    close: parseFloat(investmentPrice),
                    real_price_usd: parseFloat(investmentPrice) / exchangeRate,
                    real_price_cpi: target.real_price_cpi // CPI Logic is complex, keep relative to date for now or ignore
                };
            }
        }

        // Avoid division by zero
        const baseClose = base.close || 1;
        const baseUsd = base.real_price_usd || 1;
        const baseCpi = base.real_price_cpi || 1;
        const baseBench = base.benchmark_real_price || 1;

        return rawData.map(item => {
            const idxClose = (item.close / baseClose) * 100;
            const idxUsd = (item.real_price_usd / baseUsd) * 100;
            return {
                ...item,
                close: idxClose,
                real_price_usd: idxUsd,
                real_price_cpi: (item.real_price_cpi / baseCpi) * 100,
                benchmark_real_price: item.benchmark_real_price ? (item.benchmark_real_price / baseBench) * 100 : null,
                // Disparity: (Nominal Index - Real Index)
                // Positive = Money Illusion (Bubble)
                // Negative = Real Gain > Nominal Gain (or less loss)
                disparity: idxClose - idxUsd
            };
        });
    };

    const getProcessedData = () => {
        if (!data || data.length === 0) return [];

        let processed = data;

        // Apply Simulation if Active
        if (isSimulated) {
            processed = data.map(item => ({
                ...item,
                // item.close is a number (from JSON float), so we use it directly.
                // If it were a formatted string with commas, we'd need replace, but API sends float.
                real_price_usd: (item.close / simulationRate)
            }));
        }

        // Apply Indexing if Active
        if (isIndexed) {
            return getIndexedData(processed);
        }
        return processed;
    };

    const displayData = getProcessedData();

    // 2. Dynamic Gradient Offset Logic
    const gradientOffset = () => {
        if (displayData.length <= 0) return 0;
        const dataMax = Math.max(...displayData.map(i => i.disparity || 0));
        const dataMin = Math.min(...displayData.map(i => i.disparity || 0));

        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;

        return dataMax / (dataMax - dataMin);
    };

    const off = gradientOffset();

    const handleCustomSearch = () => {
        if (customStartDate) {
            setPeriod('custom');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            // Reset company name on new search to avoid stale check
            // setCompanyName(null); // Optional: keep old name until new one loads?
            try {
                let url = `${API_BASE_URL}/api/v1/chart/${ticker}?period=${period}&benchmark=${benchmark}`;
                if (period === 'custom' && customStartDate) {
                    url += `&start_date=${customStartDate}`;
                    if (customEndDate) {
                        url += `&end_date=${customEndDate}`;
                    }
                }
                const response = await axios.get(url, { timeout: 10000 });
                setData(response.data.data);
                if (response.data.company_name) {
                    setCompanyName(response.data.company_name);
                } else {
                    setCompanyName(null);
                }
                if (response.data.overall_alpha !== undefined) {
                    setOverallAlpha(response.data.overall_alpha);
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                if (err.code === 'ECONNABORTED') {
                    setError(t('chart.error_timeout'));
                } else {
                    setError(t('chart.error'));
                }
            } finally {
                setLoading(false);
            }
        };

        if (ticker) {
            // Avoid fetching if custom mode but no date selected (though button handles this)
            if (period === 'custom' && !customStartDate) return;
            fetchData();
        }
    }, [ticker, period, (period === 'custom' ? customStartDate + customEndDate : null), benchmark, t]);
    // Dependency includes dates only if in custom mode to trigger refetch on "Go" effectively if I set period to custom

    if (loading && period !== 'custom') return <div className="loading-container">{t('chart.loading')}</div>; // Keep UI responsive for custom updates
    if (error) return <div className="error-message">{error}</div>;

    const periodOptions = [
        { label: t('chart.period.1W'), value: '5d' },
        { label: t('chart.period.1M'), value: '1mo' },
        { label: t('chart.period.1Y'), value: '1y' },
        { label: t('chart.period.5Y'), value: '5y' },
        { label: t('chart.period.10Y'), value: '10y' },
        { label: t('chart.period.MAX'), value: 'max' }
    ];

    // Determine Display Title
    // If companyName exists: "Samsung Electronics (005930) Analysis"
    // If not: "005930 Analysis" or "Samsung Analysis" (fallback to ticker prop)
    const displayTitle = companyName
        ? `${companyName} (${ticker.replace('.KS', '')})`
        : ticker.replace('.KS', '');

    const benchmarkOptions = [
        { label: 'KOSPI', value: '^KS11' },
        { label: 'KOSDAQ', value: '^KQ11' },
        { label: 'S&P 500', value: '^GSPC' },
        { label: 'Nasdaq', value: '^IXIC' }
    ];

    return (
        <div className="chart-container">
            <div className="chart-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>{displayTitle} {t('chart.analysis')}</h3>
                        <div className="button-group" style={{ flexWrap: 'wrap' }}>
                            <button
                                className={`group-btn ${!isIndexed && !isGoldMode ? 'active' : ''}`}
                                onClick={() => { setIsIndexed(false); setIsGoldMode(false); }}
                            >
                                📈 {t('chart.price')}
                            </button>
                            <button
                                className={`group-btn ${isIndexed ? 'active' : ''}`}
                                onClick={() => { setIsIndexed(true); setIsGoldMode(false); }}
                            >
                                📊 {t('chart.indexed')}
                            </button>
                            <button
                                className={`group-btn ${isGoldMode ? 'active' : ''}`}
                                onClick={() => {
                                    setIsGoldMode(true);
                                    setIsIndexed(false);
                                    setShowDisparity(false);
                                }}
                            >
                                💰 {t('chart.gold')}
                            </button>
                            {isIndexed && (
                                <button
                                    className={`group-btn ${showDisparity ? 'active' : ''}`}
                                    onClick={() => setShowDisparity(!showDisparity)}
                                    style={{ marginLeft: '10px', fontSize: '0.9rem' }}
                                >
                                    📉 {t('chart.disparity')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="period-selector" style={{ flexShrink: 0 }}>
                        {periodOptions.map((p) => (
                            <button
                                key={p.value}
                                className={period === p.value ? 'active' : ''}
                                onClick={() => {
                                    setPeriod(p.value);
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {isIndexed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className={`group-btn ${isGhostMode ? 'active' : ''}`}
                                onClick={() => setIsGhostMode(!isGhostMode)}
                                style={{
                                    padding: '4px 12px',
                                    fontSize: '0.85rem',
                                    background: isGhostMode ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                                title={language === 'ko' ? '시장과 비교' : 'Compare with Market'}
                            >
                                {language === 'ko' ? 'VS 시장' : 'VS Market'}
                            </button>

                            {isGhostMode && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Benchmark:</span>
                                    <select
                                        value={benchmark}
                                        onChange={(e) => setBenchmark(e.target.value)}
                                        style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', outline: 'none' }}
                                    >
                                        {benchmarkOptions.map(opt => (
                                            <option key={opt.value} value={opt.value} style={{ background: '#1f2937' }}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <div style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: overallAlpha >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: overallAlpha >= 0 ? '#10b981' : '#ef4444',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                    }}>
                                        Alpha: {(overallAlpha * 100).toFixed(2)}%
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Simulation Control */}
                {/* Simulation Control - Deprecated/Hidden
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    width: '100%'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
                        <input
                            type="checkbox"
                            checked={isSimulated}
                            onChange={(e) => setIsSimulated(e.target.checked)}
                        />
                        {t('chart.simulation_toggle')}
                    </label>

                    {isSimulated && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span style={{ fontSize: '0.9rem', color: '#ccc' }}>900₩</span>
                            <input
                                type="range"
                                min="900"
                                max="2000"
                                step="10"
                                value={simulationRate}
                                onChange={(e) => setSimulationRate(Number(e.target.value))}
                                style={{ flex: 1 }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#ccc' }}>2000₩</span>
                            <span style={{
                                background: '#3b82f6',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                minWidth: '80px',
                                textAlign: 'center'
                            }}>
                                1$ = {simulationRate}₩
                            </span>
                        </div>
                    )}
                </div>
                */}

                {/* Custom Date Inputs */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>{t('chart.custom')}</span>
                    <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #444', background: '#1f2937', color: 'white' }}
                    />
                    <span style={{ color: '#9ca3af' }}>~</span>
                    <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #444', background: '#1f2937', color: 'white' }}
                    />
                    <button
                        onClick={handleCustomSearch}
                        className={period === 'custom' ? 'active' : ''}
                        style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #444', background: period === 'custom' ? '#3b82f6' : 'transparent', color: period === 'custom' ? 'white' : '#9ca3af', cursor: 'pointer' }}
                    >
                        {t('chart.go')}
                    </button>
                </div>

                {/* My Investment Analysis Input */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 'bold' }}>{t('chart.my_investment')}:</span>
                    <input
                        type="date"
                        value={investmentDate}
                        onChange={(e) => setInvestmentDate(e.target.value)}
                        placeholder="Date"
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#1f2937', color: 'white' }}
                    />
                    <input
                        type="number"
                        value={investmentPrice}
                        onChange={(e) => setInvestmentPrice(e.target.value)}
                        placeholder={t('chart.my_price_placeholder')}
                        style={{ padding: '4px', width: '100px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#1f2937', color: 'white' }}
                    />
                    <button
                        onClick={() => {
                            if (investmentDate && investmentPrice) {
                                // Auto-set period to "Investment Date ~ Today"
                                const today = new Date().toISOString().split('T')[0];
                                setCustomStartDate(investmentDate);
                                setCustomEndDate(today);
                                setPeriod('custom');
                                setIsIndexed(true);
                            }
                        }}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            background: (investmentDate && investmentPrice) ? '#3b82f6' : '#4b5563',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                        }}
                    >
                        {t('chart.apply')}
                    </button>
                </div>
            </div>

            <div className="chart-wrapper">
                {loading ? (
                    <div className="loading-container" style={{ height: 500 }}>{t('chart.loading')}</div>
                ) : (
                    <ResponsiveContainer width="100%" height={500}>
                        <LineChart
                            data={displayData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            onClick={(e) => {
                                if (e && e.activePayload && e.activePayload.length > 0) {
                                    const { date, close } = e.activePayload[0].payload;
                                    // Use window.confirm to ask user
                                    // Note: close price in indexed mode is index value (e.g. 100).
                                    // But we need the ORIGINAL price to set as base.
                                    // Problem: displayData has modified values if indexed. 
                                    // Solution: We need access to raw 'close' or 'real_price_usd' before indexing?
                                    // Actually, getProcessedData modifies it.
                                    // Let's look at the payload structure.
                                    // The payload contains the object from displayData.
                                    // If isIndexed is true, 'close' is 100 based.
                                    // We need to store original price in data?
                                    // Let's assume we can't easily get original price here if it's overwritten.
                                    // Wait, getIndexedData overwrites 'close'.
                                    // FIX: Update getIndexedData to preserve 'original_close' or just use the logic that we can't do it easily without refetching or storing raw.
                                    // Better approach: When indexing, store original as 'nominal_close'.

                                    // For now, let's just use the date and ask user to confirm. 
                                    // To get price, we might need to find it in 'data' state (which is raw) by date.

                                    const rawPoint = data.find(d => d.date === date);
                                    if (rawPoint) {
                                        setConfirmModal({
                                            isOpen: true,
                                            date: date,
                                            price: rawPoint.close
                                        });
                                    }
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#888' }}
                                tickFormatter={(str) => {
                                    // Dynamic formatting based on period or data range
                                    if (period === '5d' || period === '1mo') {
                                        return str.substring(5, 10).replace('-', '.'); // 01.23
                                    } else if (period === 'custom') {
                                        // Heuristic: check duration
                                        if (displayData.length > 0) {
                                            const startYear = displayData[0].date.substring(0, 4);
                                            const endYear = displayData[displayData.length - 1].date.substring(0, 4);
                                            if (startYear !== endYear) return str.substring(0, 4); // YYYY if multi-year
                                            // If data length is small (< 60 points), show MM.DD
                                            if (displayData.length < 60) return str.substring(5, 10).replace('-', '.');
                                            return str.substring(0, 7).replace('-', '.'); // YYYY.MM
                                        }
                                        return str.substring(0, 10);
                                    } else if (period === '1y' || period === '5y') {
                                        return str.substring(0, 7).replace('-', '.'); // 2025.01
                                    }
                                    return str.substring(0, 4); // 2016
                                }}
                                minTickGap={30}
                                interval={0}
                                ticks={(() => {
                                    if (!displayData || displayData.length === 0) return undefined;

                                    const tickData = displayData;
                                    const ticks = [];

                                    // Helper to add tick
                                    const addTick = (date) => ticks.push(date);

                                    if (period === 'custom') {
                                        // Dynamic ticks for custom range
                                        const len = tickData.length;
                                        if (len <= 20) {
                                            // Show all/most
                                            tickData.forEach(d => addTick(d.date));
                                        } else if (len <= 100) {
                                            // Show reasonable subset (weekly-ish)
                                            tickData.forEach((item, index) => {
                                                if (index % 5 === 0) addTick(item.date);
                                            });
                                        } else {
                                            // Monthly or Yearly
                                            // Check if spans multiple years
                                            const startYear = parseInt(tickData[0].date.substring(0, 4));
                                            const endYear = parseInt(tickData[len - 1].date.substring(0, 4));

                                            if (endYear - startYear >= 3) {
                                                // Yearly
                                                let lastYear = '';
                                                tickData.forEach(item => {
                                                    const y = item.date.substring(0, 4);
                                                    if (y !== lastYear) { addTick(item.date); lastYear = y; }
                                                });
                                            } else {
                                                // Monthly
                                                let lastMonth = '';
                                                tickData.forEach(item => {
                                                    const m = item.date.substring(0, 7);
                                                    if (m !== lastMonth) { addTick(item.date); lastMonth = m; }
                                                });
                                            }
                                        }
                                    } else if (period === '5d') {
                                        tickData.forEach(item => ticks.push(item.date));
                                    } else if (period === '1mo') {
                                        tickData.forEach((item, index) => {
                                            if (index % 5 === 0) ticks.push(item.date);
                                        });
                                    } else if (period === '1y') {
                                        let lastMonth = '';
                                        tickData.forEach(item => {
                                            const month = item.date.substring(0, 7);
                                            if (month !== lastMonth) {
                                                ticks.push(item.date);
                                                lastMonth = month;
                                            }
                                        });
                                    } else if (period === '5y') {
                                        let lastYearHalf = '';
                                        tickData.forEach(item => {
                                            const year = item.date.substring(0, 4);
                                            const month = parseInt(item.date.substring(5, 7));
                                            const half = month <= 6 ? 'H1' : 'H2';
                                            const key = `${year}-${half}`;
                                            if (key !== lastYearHalf) {
                                                if (month === 1 || month === 7) {
                                                    ticks.push(item.date);
                                                    lastYearHalf = key;
                                                }
                                            }
                                        });
                                    } else if (period === '10y') {
                                        let lastYear = '';
                                        tickData.forEach(item => {
                                            const year = item.date.substring(0, 4);
                                            if (year !== lastYear) {
                                                ticks.push(item.date);
                                                lastYear = year;
                                            }
                                        });
                                    }
                                    return ticks.length > 0 ? ticks : undefined;
                                })()}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fill: '#888' }}
                                domain={isIndexed ? ['auto', 'auto'] : (isGoldMode ? ['auto', 'auto'] : ['auto', 'auto'])}
                                tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)}
                                label={{
                                    value: isIndexed ? t('chart.yLabelIndex') : (isGoldMode ? (language === 'ko' ? t('chart.yLabelGoldDon') : t('chart.yLabelGoldOz')) : t('chart.yLabelPrice')),
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: '#888',
                                    dy: 50,
                                    dx: -10
                                }}
                            />
                            {/* When Indexed, we can use a single axis or sync them. For simplicity, keep right axis but make it follow same scale or hide if redundant */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fill: isIndexed || isGoldMode ? 'transparent' : '#888' }}
                                domain={isIndexed ? ['auto', 'auto'] : ['auto', 'auto']}
                                width={isIndexed || isGoldMode ? 0 : 60}
                                label={isIndexed || isGoldMode ? '' : { value: t('chart.yLabelReal'), angle: 90, position: 'insideRight', fill: '#888', dy: 50, dx: 10 }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        // Filter out disparity if it's accidentally in main chart payload (though it shouldn't be)
                                        const mainPayload = payload.filter(p => p.dataKey !== 'disparity');
                                        // Sort by value descending so higher one is on top
                                        const sortedPayload = [...mainPayload].sort((a, b) => b.value - a.value);
                                        return (
                                            <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                                                <p style={{ color: '#9ca3af', marginBottom: '8px', fontWeight: 'bold' }}>{label}</p>
                                                {sortedPayload.map((entry, index) => (
                                                    <p key={index} style={{ color: entry.color, margin: '4px 0', fontSize: '0.95rem', fontWeight: '600' }}>
                                                        {entry.name}: {new Intl.NumberFormat('en-US').format(entry.value.toFixed(2))}
                                                        {isIndexed ? '' : (isGoldMode ? (language === 'ko' ? ' Don' : ' Oz') : (entry.dataKey === 'close' ? ' KRW' : ' USD'))}
                                                    </p>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend
                                formatter={(value, entry) => (
                                    <span style={{ color: entry.color, fontWeight: '600', marginRight: '10px' }}>{value}</span>
                                )}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey={isGoldMode ? (language === 'ko' ? "gold_price_don" : "gold_price_oz") : "close"}
                                name={isGoldMode ? (language === 'ko' ? t('chart.legendGoldDon') : t('chart.legendGoldOz')) : t('chart.legendNominal')}
                                stroke={isGoldMode ? "#fbbf24" : "#ff2a6d"}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 8, onClick: (e, payload) => {
                                        if (payload && payload.payload) {
                                            const { date } = payload.payload;
                                            const rawPoint = data.find(d => d.date === date);
                                            if (rawPoint) {
                                                setConfirmModal({
                                                    isOpen: true,
                                                    date: date,
                                                    price: rawPoint.close
                                                });
                                            }
                                        }
                                    }
                                }}
                                animationDuration={1000}
                            />
                            {!isGoldMode && (
                                <Line
                                    yAxisId={isIndexed ? "left" : "right"}
                                    type="monotone"
                                    dataKey="real_price_usd"
                                    name={t('chart.legendDollar')}
                                    stroke="#05f2db"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                        r: 8, onClick: (e, payload) => {
                                            if (payload && payload.payload) {
                                                const { date } = payload.payload;
                                                const rawPoint = data.find(d => d.date === date);
                                                if (rawPoint) {
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        date: date,
                                                        price: rawPoint.close
                                                    });
                                                }
                                            }
                                        }
                                    }}
                                    animationDuration={1000}
                                />
                            )}
                            {isGhostMode && (
                                <Line
                                    yAxisId={isIndexed ? "left" : "right"}
                                    type="monotone"
                                    dataKey="benchmark_real_price"
                                    name={`Real ${benchmarkOptions.find(o => o.value === benchmark)?.label || benchmark}`}
                                    stroke="rgba(255, 255, 255, 0.4)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    animationDuration={1000}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
            {/* Disparity Oscillator Chart */}
            {
                isIndexed && showDisparity && !loading && displayData.length > 0 && (
                    <div className="chart-wrapper" style={{ height: 200, marginTop: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                            <h4 style={{ color: '#9ca3af', margin: 0 }}>
                                {t('chart.disparity_title')}
                            </h4>
                            <div className="tooltip-container" style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}>
                                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>ⓘ</span>
                                <div className="tooltip-text" style={{
                                    visibility: 'hidden',
                                    width: '280px',
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    color: '#d1d5db',
                                    textAlign: 'left',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    position: 'absolute',
                                    zIndex: 1,
                                    bottom: '125%',
                                    left: '50%',
                                    marginLeft: '-140px',
                                    fontSize: '0.8rem',
                                    border: '1px solid #374151',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    pointerEvents: 'none'
                                }}>
                                    {t('chart.disparity_desc')}
                                </div>
                                <style jsx>{`
                                .tooltip-container:hover .tooltip-text {
                                    visibility: visible !important;
                                    opacity: 1;
                                }
                            `}</style>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="date" hide />
                                <YAxis
                                    tick={{ fill: '#888', fontSize: 10 }}
                                    label={{ value: t('chart.disparity_label'), angle: -90, position: 'insideLeft', fill: '#888' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const val = payload[0].value;
                                            return (
                                                <div style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', border: '1px solid #374151' }}>
                                                    <p style={{ color: '#9ca3af' }}>{label}</p>
                                                    <p style={{ color: val > 0 ? '#ef4444' : '#10b981' }}>
                                                        {t('chart.disparity')}: {val.toFixed(2)}%p
                                                    </p>
                                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                        {val > 0 ? t('chart.disparity_pos') : t('chart.disparity_neg')}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <ReferenceLine y={0} stroke="#666" />
                                <Area
                                    type="monotone"
                                    dataKey="disparity"
                                    stroke="#888"
                                    fill="url(#splitColor)"
                                    name={t('chart.disparity')}
                                />
                                <defs>
                                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset={off} stopColor="#ef4444" stopOpacity={0.6} />
                                        <stop offset={off} stopColor="#10b981" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )
            }
            {/* Custom Modal */}
            {
                confirmModal.isOpen && (
                    <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>{t('chart.modal.title')}</h3>
                            <p>
                                {t('chart.modal.desc')} <strong>{confirmModal.date}</strong><br />
                                (Price: {new Intl.NumberFormat('en-US').format(confirmModal.price)} KRW)
                            </p>
                            <div className="modal-buttons">
                                <button
                                    className="modal-btn cancel"
                                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                >
                                    {t('chart.modal.cancel')}
                                </button>
                                <button
                                    className="modal-btn confirm"
                                    onClick={() => {
                                        const { date, price } = confirmModal;
                                        setInvestmentDate(date);
                                        setInvestmentPrice(price);
                                        const today = new Date().toISOString().split('T')[0];
                                        setCustomStartDate(date);
                                        setCustomEndDate(today);
                                        setPeriod('custom');
                                        setIsIndexed(true);
                                        setConfirmModal({ ...confirmModal, isOpen: false });
                                    }}
                                >
                                    {t('chart.modal.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RealPriceChart;
