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
    gold_df: pd.DataFrame = None
) -> pd.DataFrame:
    """
    Calculate Real Price based on Exchange Rate and CPI.
    Formula:
    1. USD Price = Nominal KRW Price / Exchange Rate
    2. Real Price (Inflation Adjusted) = USD Price * (Base CPI / Current CPI) 
       OR KRW Price * (Base CPI / Current CPI) depending on definition.
       
    README says:
    P_real(t) = (P_nominal(t) / E(t)) * (CPI(t_base) / CPI(t))
    This implies we are converting to "Real USD".
    """
    
    # 1. Clean and Prepare Exchange Rate
    # Exchange rate data (KRW=X) 'Close' column represents KRW per 1 USD
    # Align Exchange Rate to Stock Data
    
    # Ensure timezone naivety
    if stock_df.index.tz is not None:
        stock_df.index = stock_df.index.tz_localize(None)
    if exchange_rate_df.index.tz is not None:
        exchange_rate_df.index = exchange_rate_df.index.tz_localize(None)
        
    # Merge Stock and Exchange Rate
    # Rename Close columns to avoid collision
    stock_df = stock_df[['Close']].rename(columns={'Close': 'Close_KRW'})
    exchange_rate_df = exchange_rate_df[['Close']].rename(columns={'Close': 'Exchange_Rate'})
    
    # Combine Stock and Exchange Rate first
    df = pd.merge(stock_df, exchange_rate_df, left_index=True, right_index=True, how='inner')
    
    # 2. Calculate USD Price
    df['Close_USD'] = df['Close_KRW'] / df['Exchange_Rate']
    
    # 3. Align and Merge CPI
    # Do this after getting daily data
    # Note: align_data takes stock_df, but we can pass our current 'df'
    
    if cpi_series.empty:
        # Without CPI, we can only provide Nominal and USD Adjusted
        df['Real_Price'] = np.nan
        df['CPI'] = np.nan
        # Continue to Gold calculation even if CPI is missing
    else:
        df_with_cpi = align_data(df, cpi_series)
        
        # 4. Calculate Real Price (Inflation Adjusted)
        # Base CPI: typically the most recent CPI or a fixed point (e.g. 2010). 
        # Let's use the most recent available CPI in the dataset as the base (t_base).
        # This means "What is the past price worth in TODAY's dollars?"
        base_cpi = df_with_cpi['CPI'].iloc[-1]
        
        # Real Price = Nominal(USD) * (Base CPI / Current CPI)
        df_with_cpi['Real_Price'] = df_with_cpi['Close_USD'] * (base_cpi / df_with_cpi['CPI'])
        
        df = df_with_cpi

    # 5. Calculate Gold Standard Price
    if gold_df is not None and not gold_df.empty:
        if gold_df.index.tz is not None:
            gold_df.index = gold_df.index.tz_localize(None)
        
        gold_df = gold_df[['Close']].rename(columns={'Close': 'Gold_USD_oz'})
        
        # Merge Gold Data
        # Use left join from existing valid stock days
        df = pd.merge(df, gold_df, left_index=True, right_index=True, how='left')
        
        # Forward fill Gold (market might be closed on some days stock is open, though rare for Futures)
        df['Gold_USD_oz'] = df['Gold_USD_oz'].ffill()
        
        # Calculate Stock Price in Gold Oz
        # Stock (USD) / Gold (USD/oz) = Stock in Oz
        df['Close_Gold_oz'] = df['Close_USD'] / df['Gold_USD_oz']
        
        # Calculate Stock Price in Gold Don
        # 1 Oz = 31.1035 g
        # 1 Don = 3.75 g
        # 1 Oz = (31.1035 / 3.75) Don ~= 8.294 Don
        # Price (Don) = Price (Oz) * (Oz per Don factor?) 
        # Wait. 
        # Price in Oz is "Mass of Gold equal to Stock".
        # Mass in Don = Mass in Oz * (31.1035 / 3.75).
        # Yes, if I have 1 Oz of value, I have 8.29 Don of value.
        df['Close_Gold_don'] = df['Close_Gold_oz'] * (31.1035 / 3.75)
    else:
        df['Gold_USD_oz'] = np.nan
        df['Close_Gold_oz'] = np.nan
        df['Close_Gold_don'] = np.nan
    
    return df
