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
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    benchmark: str = Query("^KS11", description="Benchmark index symbol (e.g., ^KS11, ^GSPC)")
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

        # Map common benchmark aliases if needed
        benchmark_map = {
            "KOSPI": "^KS11",
            "KOSDAQ": "^KQ11",
            "S&P500": "^GSPC",
            "NASDAQ": "^IXIC"
        }
        benchmark_symbol = benchmark_map.get(benchmark.upper(), benchmark)

        # 1. Fetch Data in Parallel
        import asyncio
        from core.data_loader import fetch_index_data, _get_mock_cpi_data
        
        # Essential tasks (Stock and Exchange Rate)
        stock_task = fetch_stock_data(ticker, period, start_date, end_date)
        exchange_task = fetch_exchange_rate(period, start_date, end_date)
        
        # Concurrent execution for essentials
        stock_df, exchange_df = await asyncio.gather(stock_task, exchange_task)
        
        if stock_df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for ticker {ticker}")
            
        # Optional tasks (with aggressive timeouts to prevent total failure)
        # CPI, Gold, and Benchmark are nice to have but shouldn't block the main chart.
        cpi_task = fetch_cpi_data()
        gold_task = fetch_gold_data(period, start_date, end_date)
        benchmark_task = fetch_index_data(benchmark_symbol, period, start_date, end_date)
        
        # Helper to run optional task with timeout
        async def run_optional(task, fallback_val, name):
            try:
                # Increased timeout to 7.0s to accommodate slower FRED/KOSIS responses
                return await asyncio.wait_for(task, timeout=7.0)
            except Exception as e:
                print(f"Warning: Optional task '{name}' failed or timed out: {e}")
                return fallback_val

        cpi_series, gold_df, benchmark_df = await asyncio.gather(
            run_optional(cpi_task, _get_mock_cpi_data(), "CPI"),
            run_optional(gold_task, pd.DataFrame(), "GOLD"),
            run_optional(benchmark_task, pd.DataFrame(), "BENCHMARK")
        )
            
        # 2. Calculate
        result_df = calculate_real_price(stock_df, exchange_df, cpi_series, gold_df, benchmark_df)
        
        # 3. Format Response
        data_points = []
        overall_alpha = 0
        
        if 'Alpha' in result_df and not result_df['Alpha'].empty:
            overall_alpha = result_df['Alpha'].iloc[-1]

        for index, row in result_df.iterrows():
            data_points.append(ChartDataPoint(
                date=index.strftime('%Y-%m-%d'),
                close=format(row['Close_KRW'], ".0f"), # Nominal KRW
                real_price_usd=row['Close_USD'] if pd.notna(row['Close_USD']) else None,
                real_price_cpi=row['Real_Price'] if pd.notna(row['Real_Price']) else None,
                gold_price_don=row['Close_Gold_don'] if 'Close_Gold_don' in row and pd.notna(row['Close_Gold_don']) else None,
                gold_price_oz=row['Close_Gold_oz'] if 'Close_Gold_oz' in row and pd.notna(row['Close_Gold_oz']) else None,
                gold_base_price=row['Gold_USD_oz'] if 'Gold_USD_oz' in row and pd.notna(row['Gold_USD_oz']) else None,
                benchmark_real_price=row['Benchmark_Real_Price'] if 'Benchmark_Real_Price' in row and pd.notna(row['Benchmark_Real_Price']) else None,
                alpha=row['Alpha'] if 'Alpha' in row and pd.notna(row['Alpha']) else None
            ) )
            
        return ChartResponse(
            ticker=ticker,
            company_name=company_name,
            benchmark_name=benchmark,
            period=period,
            data=data_points,
            overall_alpha=float(overall_alpha) if pd.notna(overall_alpha) else 0
        )
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
