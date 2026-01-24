# RealK: The True Value of K-Market

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-Data_Analysis-150458?style=for-the-badge&logo=pandas&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white)

> **"Price is what you pay. Value is what you get."** - Warren Buffett
>
> 한국 주식 시장의 **화폐 환상(Money Illusion)**을 걷어내고, 달러(USD)와 인플레이션(CPI)을 반영한 **실질 구매력 기준의 주가 차트**를 제공하는 핀테크 서비스입니다.

## 🧐 Project Background

### The Problem: 착시 현상 (Illusion of Return)
한국 코스피 시장은 원화(KRW)를 기준으로 거래됩니다. 하지만 외국인 투자자의 수급과 거시 경제적 관점에서 원화 기준 주가는 실제 가치를 왜곡할 수 있습니다.
- **사례**: 삼성전자가 10년간 2배 올랐지만, 원/달러 환율이 50% 상승했다면 외국인 투자자 입장에서의 수익률은 반토막이 납니다.
- **사례**: 주가가 올랐어도 물가가 더 빠르게 올랐다면, 내 자산의 실질 구매력(Purchasing Power)은 오히려 감소한 것입니다.

### The Solution: RealK Engine
RealK는 **Serverless Python Architecture**를 기반으로 실시간 환율 및 거시 경제 지표를 수집하고, Pandas를 활용한 고속 벡터 연산을 통해 **세 가지 관점의 차트**를 제공합니다.
1.  **Nominal View**: 일반적인 원화 주가
2.  **USD Adjusted View**: 환율 변동을 반영한 달러 환산 주가 (외국인 수급 분석용)
3.  **Inflation Adjusted View**: CPI(소비자물가지수)를 반영한 실질 가치 주가 (장기 투자 분석용)

## 🏗️ Architecture

이 프로젝트는 **'가벼움'**과 **'데이터 처리 효율성'**에 초점을 맞춘 **Serverless Architecture**를 채택했습니다. 무거운 DB 관리 없이 API 요청 시점에 즉각적으로 데이터를 수집하고 가공(On-demand Processing)합니다.

```mermaid
graph LR
    User[Client (React)] -->|Request Chart| Cloudflare[Cloudflare CDN]
    Cloudflare -->|API Call| Vercel[Vercel Serverless Function]
    
    subgraph "Backend (FastAPI)"
        Vercel -->|Fetch Data| YFinance[(Yahoo Finance API)]
        Vercel -->|Fetch Macro| FRED[(US Fed API)]
        
        direction TB
        YFinance & FRED --> Pandas[Pandas Data Engine]
        Pandas -->|Resampling & Interpolation| Logic[Financial Logic]
    end
    
    Logic -->|JSON Response| User
## 🗝️ Key Technical Decisions

- **Python & FastAPI**: 금융 데이터 처리에 최적화된 생태계(Pandas, Numpy) 활용을 위해 채택. 비동기(Async) 처리를 통해 외부 API 호출 대기 시간을 최소화.
- **Pandas for ETL**: Java 스트림으로 처리하기 복잡한 시계열 데이터의 리샘플링(Resampling), 결측치 보간(Interpolation), **동적 병합(Merge)**을 벡터 연산으로 처리하여 퍼포먼스 극대화.
- **Serverless (Vercel)**: 트래픽이 없을 때 비용이 '0'인 비용 효율적 구조. 상태를 저장하지 않는(Stateless) 아키텍처 구현.

## 🛠️ Tech Stack

| Category | Tech | Description |
|---|---|---|
| **Language** | Python 3.11 | Type Hinting을 적극 활용한 Modern Python 개발 |
| **Framework** | FastAPI | 고성능 비동기 웹 프레임워크, 자동화된 API 문서(Swagger) 제공 |
| **Data Engine** | Pandas / NumPy | 시계열 데이터 전처리, 벡터 연산, 결측치 제어 |
| **Data Source** | yfinance, fredapi | 주식, 환율, 거시경제 지표 수집 라이브러리 |
| **Frontend** | React, Recharts | Vercel/Vite 기반의 SPA, 인터랙티브 차트 시각화 |
| **Deployment** | Vercel, Cloudflare Pages | Backend & Frontend의 분산 Serverless 배포 |

## 🧮 Financial Logic & Algorithm

RealK의 핵심 가치는 단순 데이터 조회가 아닌 금융 공학적 보정 로직에 있습니다.

### 1. 실질 주가 산출 (Real Price Calculation)

특정 시점($t$)의 주가를 기준 시점($t_{base}$)의 가치로 환산합니다.

$$ P_{real}(t) = \frac{P_{nominal}(t)}{E(t)} \times \frac{CPI(t_{base})}{CPI(t)} $$

- $P_{real}(t)$: 보정된 실질 주가
- $P_{nominal}(t)$: 시장 명목 주가 (Close Price)
- $E(t)$: USD/KRW 환율 (Exchange Rate)
- $CPI(t)$: 소비자 물가 지수 (Consumer Price Index)

### 2. 데이터 보간 (Linear Interpolation)

주식 데이터는 일별(Daily), CPI 데이터는 월별(Monthly) 발표되므로 시계열 불일치가 발생합니다. 이를 해결하기 위해 Pandas의 선형 보간을 사용합니다.

```python
# Pandas 활용 예시 (핵심 로직)
def align_data(stock_df, cpi_df):
    # 1. 월별 CPI 데이터를 일별로 확장 (빈 값 생성)
    cpi_daily = cpi_df.resample('D').asfreq()
    
    # 2. 선형 보간법을 사용하여 빈 날짜의 CPI 추정치 계산
    # (월초와 월말 사이의 물가는 선형적으로 변한다고 가정)
    cpi_interpolated = cpi_daily.interpolate(method='linear')
    
    # 3. 주가 데이터와 병합 (Inner Join으로 거래일만 남김)
    return pd.merge(stock_df, cpi_interpolated, left_index=True, right_index=True)
📦 Project StructureBashreal-k-lite/
├── api/                        # Backend Application Entry
│   ├── index.py                # Vercel Handler & FastAPI App
│   └── v1/
│       ├── endpoints/          # API Routers (Chart, Ticker)
│       └── models.py           # Pydantic DTO Schemas
├── core/                       # Core Business Logic
│   ├── config.py               # Settings (Env Variables)
│   ├── data_loader.py          # Yahoo/FRED Fetcher (Async)
│   └── calculator.py           # Pandas Data Processing Logic
├── tests/                      # Pytest Suites
├── requirements.txt            # Python Dependencies
└── vercel.json                 # Serverless Configuration
🚀 Getting StartedPrerequisitesPython 3.9+Node.js 18+ (for Frontend)Backend Setup (Local)Bash# 1. Clone the repository
git clone [https://github.com/username/real-k-market.git](https://github.com/username/real-k-market.git)
cd real-k-market

# 2. Create Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install Dependencies
pip install -r requirements.txt

# 4. Run Development Server
uvicorn api.index:app --reload
# Access Swagger UI at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
## 📊 API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chart/{ticker}` | 특정 종목의 보정 차트 데이터 조회 (Params: `period`, `mode`) |
| `GET` | `/api/stats/disparity` | 현재 명목 주가와 실질 주가 간의 괴리율(%) 조회 |
| `GET` | `/api/search` | 종목 코드/이름 검색 |

## 🚧 Future Improvements (Roadmap)

- [ ] **Data Caching**: Redis(Upstash)를 도입하여 중복된 API 호출(Yahoo Finance) 최소화 및 응답 속도 개선.
- [ ] **Quant Metrics**: MDD(Maximum Drawdown), Sharpe Ratio 등 퀀트 투자 지표 추가 제공.
- [ ] **Comparison Mode**: 삼성전자 vs 마이크론 등 글로벌 경쟁사와의 달러 기준 성과 비교 기능.
- [ ] **Mobile Support**: PWA(Progressive Web App) 적용으로 앱과 유사한 UX 제공.

## 📄 License

MIT License

## 👨‍💻 Contact

- **Email**: (Your Email)
- **Github**: (Your Github Profile)
- **Portfolio**: (Your Portfolio Link)

This project is part of a portfolio demonstrating Full-Stack Financial Engineering capabilities.
### 💡 작성 포인트 (Tip)

1.  **"Quant-Friendly"**: 설명 부분에 수식($LaTeX$)과 코드 스니펫(Pandas 로직)을 포함하여, 단순 개발자가 아니라 금융 데이터를 이해하는 개발자임을 강조했습니다.
2.  **기술 결정의 이유**: 아키텍처 섹션에서 "왜 Serverless인가?", "왜 Pandas인가?"를 명확히 하여 면접관의 질문에 대비했습니다.
3.  **시각적 요소**: 배지(Shields.io)와 Mermaid 다이어그램 코드를 포함하여, Github에 올렸을 때