from fastapi import APIRouter, HTTPException, Query
from core.data_loader import fetch_stock_data, fetch_exchange_rate, fetch_cpi_data, fetch_gold_data
from core.calculator import calculate_real_price
from api.v1.models import ChartResponse, ChartDataPoint
import pandas as pd
from typing import Optional

router = APIRouter()

@router.get("/chart/{ticker}", response_model=ChartResponse)
async def get_chart_data(
    ticker: str,
    period: str = Query("10y", description="Data period (e.g., 1y, 5y, 10y, max)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get Real Price Chart Data.
    """
    try:
        # Check if ticker is a name (non-numeric)
        company_name = None
        
        # Check if ticker is a name (non-numeric)
        if not ticker.replace('.KS', '').replace('.KQ', '').isdigit():
            # Attempt to resolve name
            from core.stock_search import get_ticker_from_name
            resolved_code, resolved_name = get_ticker_from_name(ticker)
            if resolved_code:
                # Update ticker
                print(f"Resolved '{ticker}' to code '{resolved_code}' ({resolved_name})")
                ticker = resolved_code
                company_name = resolved_name
            else:
                # If resolution failed, maybe it's US stock or symbol?
                # Just proceed, yfinance might handle it or fail.
                pass
        else:
            # If ticker is numeric (e.g. 005930), try to find its name
            from core.stock_search import get_name_from_ticker
            company_name = get_name_from_ticker(ticker)

        # 1. Fetch Data in Parallel
        # (Actually asyncio.gather runs them concurrently)
        import asyncio
        stock_task = fetch_stock_data(ticker, period, start_date, end_date)
        exchange_task = fetch_exchange_rate(period, start_date, end_date)
        cpi_task = fetch_cpi_data()
        gold_task = fetch_gold_data(period, start_date, end_date)
        
        stock_df, exchange_df, cpi_series, gold_df = await asyncio.gather(stock_task, exchange_task, cpi_task, gold_task)
        
        if stock_df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for ticker {ticker}")
            
        # 2. Calculate
        result_df = calculate_real_price(stock_df, exchange_df, cpi_series, gold_df)
        
        # 3. Format Response
        data_points = []
        for index, row in result_df.iterrows():
            # index is datetime
            data_points.append(ChartDataPoint(
                date=index.strftime('%Y-%m-%d'),
                close=format(row['Close_KRW'], ".0f"), # Nominal KRW
                real_price_usd=row['Close_USD'] if pd.notna(row['Close_USD']) else None,
                real_price_cpi=row['Real_Price'] if pd.notna(row['Real_Price']) else None,
                gold_price_don=row['Close_Gold_don'] if 'Close_Gold_don' in row and pd.notna(row['Close_Gold_don']) else None,
                gold_price_oz=row['Close_Gold_oz'] if 'Close_Gold_oz' in row and pd.notna(row['Close_Gold_oz']) else None,
                gold_base_price=row['Gold_USD_oz'] if 'Gold_USD_oz' in row and pd.notna(row['Gold_USD_oz']) else None
            ))
            
        return ChartResponse(
            ticker=ticker,
            company_name=company_name,
            period=period,
            data=data_points
        )
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
