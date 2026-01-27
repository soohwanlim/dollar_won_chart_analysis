import yfinance as yf
from fredapi import Fred
from core.config import settings
import pandas as pd
import asyncio
from functools import partial

from datetime import datetime, timedelta

# Initialize FRED API
# Note: Ensure FRED_API_KEY is set in your .env file
fred = Fred(api_key=settings.FRED_API_KEY) if settings.FRED_API_KEY else None

import httpx
import json

def _get_mock_cpi_data() -> pd.Series:
    """Helper to generate mock CPI data."""
    print("Using Mock CPI data for demonstration.")
    mock_data = {
        "2013-01-01": 230.28,
        "2014-01-01": 233.91,
        "2015-01-01": 233.70,
        "2016-01-01": 236.91,
        "2017-01-01": 242.83,
        "2018-01-01": 247.86,
        "2019-01-01": 251.71,
        "2020-01-01": 257.97,
        "2021-01-01": 261.58,
        "2022-01-01": 281.14,
        "2023-01-01": 299.17,
        "2024-01-01": 308.41,
        "2025-01-01": 314.00, # Estimated
    }
    return pd.Series(mock_data, index=pd.to_datetime(list(mock_data.keys())))

def _fetch_stock_sync(ticker: str, period: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Synchronous helper to fetch stock data."""
    # Add .KS suffix for Korean stocks if not present
    if ticker.isdigit() and not ticker.endswith(".KS") and not ticker.endswith(".KQ"):
         # Default to KOSPI (.KS) for numeric tickers commonly used for Samsung (005930), etc.
         # This is a heuristic.
         ticker = f"{ticker}.KS"
    
    tick = yf.Ticker(ticker)
    if start_date:
        # yfinance end_date is exclusive, so we add 1 day to include the selected end date
        if end_date:
            try:
                dt_object = datetime.strptime(end_date, "%Y-%m-%d")
                end_date_inclusive = (dt_object + timedelta(days=1)).strftime("%Y-%m-%d")
            except ValueError:
                # If format is wrong, fallback to original end_date (yfinance might error or warn)
                end_date_inclusive = end_date
        else:
            end_date_inclusive = None
            
        df = tick.history(start=start_date, end=end_date_inclusive)
    else:
        df = tick.history(period=period)
    print(f"Stock data fetched for {ticker}: {len(df)} rows")
    return df

def _fetch_exchange_rate_sync(period: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Synchronous helper to fetch USD/KRW exchange rate."""
    tick = yf.Ticker("KRW=X")
    if start_date:
        if end_date:
            try:
                dt_object = datetime.strptime(end_date, "%Y-%m-%d")
                end_date_inclusive = (dt_object + timedelta(days=1)).strftime("%Y-%m-%d")
            except ValueError:
                end_date_inclusive = end_date
        else:
            end_date_inclusive = None

        df = tick.history(start=start_date, end=end_date_inclusive)
    else:
        df = tick.history(period=period)
    print(f"Exchange rate fetched: {len(df)} rows")
    return df

def _fetch_gold_sync(period: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Synchronous helper to fetch Gold Futures."""
    tick = yf.Ticker("GC=F")
    if start_date:
        if end_date:
            try:
                dt_object = datetime.strptime(end_date, "%Y-%m-%d")
                end_date_inclusive = (dt_object + timedelta(days=1)).strftime("%Y-%m-%d")
            except ValueError:
                end_date_inclusive = end_date
        else:
            end_date_inclusive = None
            
        df = tick.history(start=start_date, end=end_date_inclusive)
    else:
        df = tick.history(period=period)
    print(f"Gold data fetched: {len(df)} rows")
    return df

def _fetch_kosis_cpi_sync(country: str = "US") -> pd.Series | None:
    """
    Fetch CPI from KOSIS Open API.
    country: 'US' or 'KR'
    """
    if not settings.KOSIS_API_KEY:
        return None
        
    print(f"Attempting to fetch {country} CPI from KOSIS...")
    
    # Configuration for Tables (To be updated with correct IDs)
    # US CPI Table ID logic is complex without direct search.
    # Korea CPI: Org 101, Tbl DT_1J20003
    
    target_tbl_id = None
    target_org_id = "101" # Default Statistics Korea
    
    if country == "KR":
        target_tbl_id = "DT_1J20003"
    elif country == "US":
        # Placeholder: Need specific International Stats Table ID
        # User implies they are available.
        # Common International Table for CPI might be different.
        # For now, if US, we return None to fall back to FRED unless we find the ID.
        pass
        
    if not target_tbl_id:
        print(f"KOSIS Table ID for {country} not configured.")
        return None

    url = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
    params = {
        "method": "getList",
        "apiKey": settings.KOSIS_API_KEY,
        "itmId": "T+", # All items
        "objL1": "ALL",
        "objL2": "",
        "objL3": "",
        "format": "json",
        "jsonVD": "Y",
        "prdSe": "M", # Monthly
        "startPrdDe": "201301",
        "endPrdDe": datetime.now().strftime("%Y%m"),
        "orgId": target_org_id,
        "tblId": target_tbl_id
    }
    
    try:
        with httpx.Client() as client:
            resp = client.get(url, params=params, timeout=3.0)
            resp.raise_for_status()
            data = resp.json()
            
            if not data:
                return None
                
            # Parse KOSIS JSON
            # Structure: [{"TBL_NM":..., "PRD_DE": "202301", "DT": "109.20", ...}, ...]
            
            dates = []
            values = []
            
            for item in data:
                date_str = item.get("PRD_DE")
                val_str = item.get("DT")
                if date_str and val_str:
                    # Convert 202301 -> 2023-01-01
                    dt = pd.to_datetime(f"{date_str[:4]}-{date_str[4:]}-01")
                    dates.append(dt)
                    values.append(float(val_str))
            
            return pd.Series(values, index=dates).sort_index()

    except Exception as e:
        print(f"Error fetching from KOSIS: {e}")
        return None




def _fetch_fred_cpi_sync(country: str = "US") -> pd.Series:
    """Synchronous helper to fetch CPI data specifically from FRED."""
    if not fred:
        return _get_mock_cpi_data()
        
    try:
        if settings.FRED_API_KEY == "your_api_key_here":
            print("FRED API Key is placeholder. Skipping FRED fetch.")
            return _get_mock_cpi_data()

        print("Fetching CPI from FRED...")
        cpi = fred.get_series('CPIAUCSL')
        if cpi is None or cpi.empty:
             raise ValueError("FRED returned empty data")
        return cpi
    except Exception as e:
        print(f"Error fetching from FRED: {e}. Falling back to Mock Data.")
        return _get_mock_cpi_data()

async def fetch_stock_data(ticker: str, period: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_fetch_stock_sync, ticker, period, start_date, end_date))

async def fetch_exchange_rate(period: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_fetch_exchange_rate_sync, period, start_date, end_date))

async def fetch_gold_data(period: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Fetch Gold Futures (GC=F) data."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_fetch_gold_sync, period, start_date, end_date))

async def fetch_index_data(symbol: str, period: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Fetch Index data (e.g. ^KS11, ^IXIC)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_fetch_stock_sync, symbol, period, start_date, end_date))

async def fetch_cpi_data(country: str = "US") -> pd.Series:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_fetch_fred_cpi_sync if country == "US" else _fetch_kosis_cpi_sync, country))
