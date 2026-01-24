export const translations = {
    en: {
        nav: {
            github: "GitHub"
        },
        hero: {
            title: "Discover the",
            highlight: "Real Value",
            subtitle: "See beyond the illusion of nominal prices. Adjust for exchange rates and inflation instantly.",
            searchPlaceholder: "Enter Ticker (e.g. 005930)",
            searchButton: "Analyze"
        },
        chart: {
            analysis: "Analysis",
            indexed: "Indexed (Base 100)",
            gold: "Gold Standard",
            price: "Price",
            yLabelGoldDon: "Price (Don)",
            yLabelGoldOz: "Price (oz)",
            legendGoldDon: "Gold Value (Don)",
            legendGoldOz: "Gold Value (oz)",
            custom: "Custom:",
            simulation_toggle: "Exchange Rate Simulation",
            my_investment: "My Investment",
            my_price_placeholder: "Avg Price (KRW)",
            apply: "Apply",
            go: "Go",
            loading: "Loading Chart...",
            error: "Failed to load data. Please check the ticker code.",
            error_timeout: "Request timed out. Please try again.",
            yLabelPrice: "Price (KRW)",
            yLabelReal: "Real Value (USD)",
            yLabelIndex: "Index (Base 100)",
            legendNominal: "Nominal (KRW)",
            legendDollar: "Dollar Adjusted (USD)",
            legendReal: "Real Value (Inflation Adj.)",
            disparity: "Real Gap",
            disparity_title: "Money Illusion",
            disparity_desc: "Difference between Nominal Return (KRW) and Real Return (USD). High value means high Money Illusion.",
            disparity_label: "Gap (%p)",
            disparity_pos: "Positive (+) = Money Illusion (Bubble)",
            disparity_neg: "Negative (-) = Real Gain (Appreciation)",
            customError: "Data load failed",
            modal: {
                title: "Set Base Date",
                desc: "Do you want to set this date as your investment baseline?\nDate: ",
                confirm: "Confirm",
                cancel: "Cancel"
            },
            period: {
                '1W': '1W',
                '1M': '1M',
                '1Y': '1Y',
                '5Y': '5Y',
                '10Y': '10Y',
                'MAX': 'MAX'
            }
        },
        cards: {
            dollarTitle: "💵 Dollar Adjusted",
            dollarDesc: "Converts KRW stock price to USD using historical exchange rates. Shows performance for global investors.",
            inflationTitle: "🍔 Inflation Adjusted",
            inflationDesc: "Adjusts the Dollar value using US CPI data. Shows the true purchasing power of your investment over time.",
            illusionTitle: "📉 Money Illusion",
            illusionDesc: "Visualizes the gap between nominal price growth and real value growth."
        },
        footer: "© 2024 RealK Project. Built with FastAPI & React."
    },
    ko: {
        nav: {
            github: "GitHub"
        },
        hero: {
            title: "진정한",
            highlight: "가치를 발견하세요",
            subtitle: "명목 가격의 환상을 넘어, 환율과 물가 상승을 반영한 실제 가치를 확인하세요.",
            searchPlaceholder: "티커 입력 (예: 005930)",
            searchButton: "분석"
        },
        chart: {
            analysis: "분석",
            indexed: "지수화 (Base 100)",
            gold: "금 본위제 (Gold)",
            price: "가격",
            yLabelGoldDon: "가격 (금/돈)",
            yLabelGoldOz: "가격 (금/oz)",
            legendGoldDon: "금 환산 (돈 - 3.75g)",
            legendGoldOz: "금 환산 (oz)",
            custom: "기간 설정:",
            simulation_toggle: "환율 시뮬레이션",
            my_investment: "내 투자 기준",
            my_price_placeholder: "평단가 (KRW)",
            apply: "적용",
            go: "조회",
            loading: "차트 로딩 중...",
            error: "데이터를 불러오지 못했습니다. 티커 코드를 확인해주세요.",
            error_timeout: "응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
            yLabelPrice: "주가 (KRW)",
            yLabelReal: "실질 가치 (USD)",
            yLabelIndex: "지수 (Base 100)",
            legendNominal: "명목 주가 (KRW)",
            legendDollar: "달러 환산 (USD)",
            legendReal: "실질 가치 (물가 반영)",
            disparity: "실질 격차 (Real Gap)",
            disparity_title: "화폐 환상 (Money Illusion)",
            disparity_desc: "원화 기준 수익률과 달러 기준 실질 수익률의 차이(Real Gap)입니다. 이 수치가 높을수록 환율 효과로 인한 착시(Illusion)가 큼을 의미합니다.",
            disparity_label: "격차 (%p)",
            disparity_pos: "양수(+) = 화폐 착시 (거품)",
            disparity_neg: "음수(-) = 실질 이득 (절상)",
            customError: "데이터 로드 실패",
            modal: {
                title: "기준일 설정",
                desc: "이 날짜를 내 투자 기준점(100)으로 설정하시겠습니까?\n날짜: ",
                confirm: "확인",
                cancel: "취소"
            },
            period: {
                '1W': '1주',
                '1M': '1달',
                '1Y': '1년',
                '5Y': '5년',
                '10Y': '10년',
                'MAX': '전체'
            }
        },
        cards: {
            dollarTitle: "💵 달러 환산 가격",
            dollarDesc: "과거 환율을 적용하여 원화 주가를 달러로 환산합니다. 글로벌 투자자 관점의 성과를 보여줍니다.",
            inflationTitle: "🍔 물가 반영 실질 가치",
            inflationDesc: "미국 CPI(소비자 물가 지수)를 반영하여 달러 가치를 조정합니다. 투자의 실제 구매력을 보여줍니다.",
            illusionTitle: "📉 화폐 환상",
            illusionDesc: "명목 주가 상승과 실질 가치 성장 사이의 괴리를 시각화합니다."
        },
        footer: "© 2024 RealK Project. FastAPI & React로 제작됨."
    }
};
