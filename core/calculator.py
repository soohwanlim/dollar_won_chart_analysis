import pandas as pd
import numpy as np

def align_data(stock_df: pd.DataFrame, cpi_df: pd.Series) -> pd.DataFrame:
    """
    Align monthly CPI data to daily stock data using linear interpolation.
    """
    # Create a DataFrame for CPI to easily handle resampling
    # CPI comes as a Series with a DatetimeIndex usually for the first day of the month
    cpi_frame = cpi_df.to_frame(name='CPI')
    
    # Resample to Daily frequency and interpolate
    # Forward fill? Linear? README said Linear.
    # Linear interpolation between points.
    cpi_daily = cpi_frame.resample('D').interpolate(method='linear')
    
    # Ensure indices are timezone-naive or aware in the same way
    if stock_df.index.tz is not None:
        stock_df.index = stock_df.index.tz_localize(None)
    if cpi_daily.index.tz is not None:
        cpi_daily.index = cpi_daily.index.tz_localize(None)

    # Merge stock data with interpolated CPI
    # We use left join to keep all stock data, filling missing CPI if necessary
    merged_df = pd.merge(stock_df, cpi_daily, left_index=True, right_index=True, how='left')
    
    # If using Mock Data or if CPI lags, we might have NaNs at the end.
    # Forward fill the last known CPI value to estimate recent days.
    merged_df['CPI'] = merged_df['CPI'].ffill()
    
    return merged_df

def calculate_real_price(
    stock_df: pd.DataFrame, 
    exchange_rate_df: pd.DataFrame, 
    cpi_series: pd.Series,
    gold_df: pd.DataFrame = None,
    benchmark_df: pd.DataFrame = None
) -> pd.DataFrame:
    """
    Calculate Real Price based on Exchange Rate and CPI, and optional Benchmark comparison.
    """
    
    # Ensure timezone naivety
    if stock_df.index.tz is not None:
        stock_df.index = stock_df.index.tz_localize(None)
    if exchange_rate_df.index.tz is not None:
        exchange_rate_df.index = exchange_rate_df.index.tz_localize(None)
    if gold_df is not None and gold_df.index.tz is not None:
        gold_df.index = gold_df.index.tz_localize(None)
    if benchmark_df is not None and benchmark_df.index.tz is not None:
        benchmark_df.index = benchmark_df.index.tz_localize(None)
        
    # 1. Clean and Prepare Exchange Rate
    stock_df_trimmed = stock_df[['Close']].rename(columns={'Close': 'Close_KRW'})
    exchange_rate_df_trimmed = exchange_rate_df[['Close']].rename(columns={'Close': 'Exchange_Rate'})
    
    # Merge Stock and Exchange Rate
    df = pd.merge(stock_df_trimmed, exchange_rate_df_trimmed, left_index=True, right_index=True, how='inner')
    
    # 2. Calculate USD Price
    df['Close_USD'] = df['Close_KRW'] / df['Exchange_Rate']
    
    # 3. Align and Merge CPI
    if cpi_series.empty:
        df['Real_Price'] = np.nan
        df['CPI'] = np.nan
    else:
        df_with_cpi = align_data(df, cpi_series)
        base_cpi = df_with_cpi['CPI'].iloc[-1]
        df_with_cpi['Real_Price'] = df_with_cpi['Close_USD'] * (base_cpi / df_with_cpi['CPI'])
        df = df_with_cpi

    # 4. Calculate Gold Standard Price
    if gold_df is not None and not gold_df.empty:
        gold_df_trimmed = gold_df[['Close']].rename(columns={'Close': 'Gold_USD_oz'})
        df = pd.merge(df, gold_df_trimmed, left_index=True, right_index=True, how='left')
        df['Gold_USD_oz'] = df['Gold_USD_oz'].ffill()
        df['Close_Gold_oz'] = df['Close_USD'] / df['Gold_USD_oz']
        df['Close_Gold_don'] = df['Close_Gold_oz'] * (31.1035 / 3.75)
    else:
        df['Gold_USD_oz'] = np.nan
        df['Close_Gold_oz'] = np.nan
        df['Close_Gold_don'] = np.nan
        
    # 5. Benchmark & Alpha calculation
    if benchmark_df is not None and not benchmark_df.empty:
        benchmark_close = benchmark_df[['Close']].rename(columns={'Close': 'Bench_Close'})
        df = pd.merge(df, benchmark_close, left_index=True, right_index=True, how='left')
        df['Bench_Close'] = df['Bench_Close'].ffill()
        
        # Calculate Benchmark Real Price (USD/CPI adjusted)
        # Note: Some benchmarks might be already in USD (like SPY), but let's assume they might need adjustment
        # For simplicity, if it's a Korean index (^KS11), we adjust by USD/CPI.
        # If it's US index, we just adjust by CPI.
        
        # Heuristic: if index is ^GSPC, ^IXIC, or contains SPY/QQQ, assume USD based.
        # Actually, let's look at the caller to decide, or just use the same logic if it's KRW index.
        # For now, let's assume the user wants to compare "Real Power".
        
        # If Benchmark is ^KS11 (KOSPI), it's in KRW.
        # Let's check if the index is numeric (KOSPI) or not.
        # Hardcode some logic for now:
        is_us_index = any(x in benchmark_df.index.name or "" for x in ["GSPC", "IXIC", "DJI", "SPY", "QQQ"]) 
        # Actually, let's just check if Bench_Close values are "small" (USD) or "large" (KRW) or use the symbol.
        # Let's pass a flag or just use the symbol logic in the endpoint.
        
        # Simplified: Use the same Real Price logic if it's a KRW-based benchmark.
        # We'll assume ^KS11, ^KQ11 are KRW based.
        
        # We need a way to know if benchmark is KRW or USD.
        # Let's assume for now we provide a 'benchmark_currency' or just use the same adjustment as stock if both are KR.
        # For now, let's just calculate Benchmark_Real_Price using the same CPI/Exchange logic for simplicity (assuming KR index).
        df['Benchmark_Real_Price'] = (df['Bench_Close'] / df['Exchange_Rate']) * (base_cpi / df['CPI']) if 'CPI' in df and not pd.isna(df['CPI'].iloc[0]) else (df['Bench_Close'] / df['Exchange_Rate'])
        
        # Calculate cumulative returns for Alpha
        # Return = (Current Real Price / Start Real Price) - 1
        stock_start = df['Real_Price'].iloc[0]
        bench_start = df['Benchmark_Real_Price'].iloc[0]
        
        if pd.notna(stock_start) and pd.notna(bench_start) and stock_start != 0 and bench_start != 0:
            df['Stock_Return'] = (df['Real_Price'] / stock_start) - 1
            df['Bench_Return'] = (df['Benchmark_Real_Price'] / bench_start) - 1
            df['Alpha'] = df['Stock_Return'] - df['Bench_Return']
        else:
            df['Alpha'] = 0
    else:
        df['Benchmark_Real_Price'] = np.nan
        df['Alpha'] = np.nan

    return df
