import FinanceDataReader as fdr

# Ticker Cache
stocks_listing_cache = None

def load_stock_data():
    """Explicitly load stock data into cache."""
    global stocks_listing_cache
    if stocks_listing_cache is not None:
        return

    try:
        print("Loading KRX stocks listing... This may take a moment.")
        stocks_listing_cache = fdr.StockListing('KRX')
        print(f"Successfully loaded {len(stocks_listing_cache)} stock codes.")
    except Exception as e:
        print(f"Failed to load stock listings: {e}")

def get_ticker_from_name(name: str) -> str | None:
    """
    Search for ticker symbol by name using FinanceDataReader.
    Returns tuple (ticker code, company name) or (None, None) if not found.
    """
    global stocks_listing_cache
    
    try:
        if stocks_listing_cache is None:
            load_stock_data()
            
        if stocks_listing_cache is None:
             return None

        # Exact match first
        # Exact match first
        match = stocks_listing_cache[stocks_listing_cache['Name'] == name]
        if not match.empty:
            return str(match.iloc[0]['Code']), str(match.iloc[0]['Name'])
            
        # If no exact match, try 'contains'
        mask = stocks_listing_cache['Name'].str.contains(name, na=False)
        candidates = stocks_listing_cache[mask]
        
        if not candidates.empty:
            return str(candidates.iloc[0]['Code']), str(candidates.iloc[0]['Name'])

        return None, None
        
    except Exception as e:
        print(f"Error searching ticker: {e}")
        return None, None

def get_name_from_ticker(ticker_code: str) -> str | None:
    """
    Look up company name by ticker code.
    Input code can be '005930' or '005930.KS'.
    """
    global stocks_listing_cache
    
    try:
        if stocks_listing_cache is None:
            load_stock_data()
            
        if stocks_listing_cache is None:
             return None

        # Clean code
        code = ticker_code.replace('.KS', '').replace('.KQ', '')
        
        match = stocks_listing_cache[stocks_listing_cache['Code'] == code]
        if not match.empty:
            return str(match.iloc[0]['Name'])
            
        return None
        
    except Exception as e:
        print(f"Error looking up name: {e}")
        return None
