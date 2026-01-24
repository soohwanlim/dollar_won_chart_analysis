# RealK: The True Value of K-Market

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white)

> "Price is what you pay. Value is what you get." - Warren Buffett

RealK offers a new perspective on the Korean Stock Market by stripping away the illusion of nominal prices. We adjust for Exchange Rates (USD), Inflation (CPI), and even Gold Value to reveal the true purchasing power of your assets.

## 🧐 Project Background

### The Problem: Money Illusion
The Korean market (KOSPI/KOSDAQ) trades in KRW. However, nominal KRW prices often disguise the true performance of an asset due to currency depreciation and inflation.
- **Exchange Rate Risk**: Samsung Electronics might double in price, but if KRW falls 50% against USD, the global value remains flat.
- **Inflation**: If your stock returns 10% but inflation is 15%, your real purchasing power has decreased.

### The Solution: True Value Analysis
RealK Engine analyzes stocks through three distinct lenses:
1.  **Fundamental Reality**: USD Adjusted Price (Global Standard).
2.  **Purchasing Power**: Inflation Adjusted Price (CPI based).
3.  **Gold Standard**: Asset value denominated in pure Gold weight (Don/Oz).

## 🌟 Key Features

### 1. USD & Inflation Adjustment
Real-time conversion of historical prices using daily exchange rates and monthly CPI datasets (interpolated daily).

### 2. Money Illusion Index (Real Gap)
Visualizes the divergence between the Nominal Return (KRW) and the Real Return (USD).
- **Positive Gap**: Indicates "Money Illusion" (Price went up, but value didn't match).
- **Negative Gap**: Indicates "Real Appreciation" or "Currency discount".

### 3. Gold Standard Mode (💰)
Evaluates stock prices not in fiat currency, but in Gold.
- **Korean Mode**: Price in "Don" (돈, 3.75g).
- **Global Mode**: Price in "Troy Ounce" (oz).
- Demonstrates how much gold you could buy with 1 share at any point in history.

## 🏗️ Technical Architecture

This project adopts a **Serverless Architecture** to prioritize cost efficiency and scalability. It processes data on-demand without maintaining a heavy database.

```mermaid
graph LR
    User[Client (React)] -->|Request Chart| Cloudflare[Cloudflare CDN]
    Cloudflare -->|API Call| Vercel[Vercel Serverless Function]
    
    subgraph "Backend (FastAPI)"
        Vercel -->|Fetch Data| YFinance[(Yahoo Finance)]
        Vercel -->|Fetch Macro| FRED[(US Fed API)]
        
        direction TB
        YFinance & FRED --> Pandas[Pandas Data Engine]
        Pandas -->|Vector Operations| Logic[Financial Logic]
    end
    
    Logic -->|JSON Response| User
```

### Core Components
- **Backend (FastAPI)**: Handles API requests, managing concurrent data fetching from Yahoo Finance (Stocks/Gold/Forex) and FRED (CPI).
- **Frontend (React + Vite)**: A lightweight Single Page Application (SPA) hosted on Cloudflare/Vercel.
- **Data Engine (Pandas)**:
    - **Vectorization**: Uses Pandas/NumPy for high-speed calculation of thousands of data points.
    - **Alignment**: Solves the "Time-Series Mismatch" problem (Daily Prices vs Monthly Inflation) using Linear Interpolation (`resample` + `interpolate`).

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+

### Installation & Run

1. **Backend (Python)**
   ```bash
   # Create Virtual Environment
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate

   # Install Dependencies
   pip install -r requirements.txt

   # Run Server
   python -m uvicorn api.index:app --reload
   ```

2. **Frontend (React)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Server running at `http://127.0.0.1:8000`
Frontend running at `http://localhost:5173`

© 2026 RealK Project. Made by nobonobo.
Data provided by Yahoo Finance, FinanceDataReader, and FRED.