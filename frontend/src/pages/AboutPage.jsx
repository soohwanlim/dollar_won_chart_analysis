import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AboutPage = () => {
    const { t, language } = useLanguage();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: '#e5e7eb', lineHeight: '1.8' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
                {language === 'ko' ? '서비스 소개' : 'About RealK'}
            </h1>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#60a5fa', marginBottom: '1rem' }}>
                    1. 화폐 환상 (Money Illusion)이란?
                </h2>
                <p>
                    <strong>화폐 환상(Money Illusion)</strong>은 미국의 경제학자 <em>어빙 피셔(Irving Fisher)</em>가 1928년 저서
                    &lt;The Money Illusion&gt;에서 처음 정립한 개념입니다. 사람들이 자신의 부나 소득을 실질적인 구매력(Real Purchasing Power)이 아닌,
                    명목 화폐 가치(Nominal Value)로 착각하는 인지적 편향을 의미합니다.
                </p>
                <div style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '8px', margin: '1.5rem 0', borderLeft: '4px solid #60a5fa' }}>
                    <p style={{ fontStyle: 'italic', margin: 0 }}>
                        "Ordinary people, in general, fail to perceive that the dollar, or any other unit of money, expands or shrinks in value."
                        <br />
                        <span style={{ fontSize: '0.9rem', color: '#9ca3af', display: 'block', marginTop: '0.5rem' }}>
                            - Irving Fisher, &lt;The Money Illusion&gt; (1928)
                        </span>
                    </p>
                </div>
                <p>
                    한국 주식 시장(KOSPI)이 10년 전보다 올랐더라도, 원화의 가치가 하락하고 물가가 상승했다면
                    여러분의 <strong>실질적인 부(Real Wealth)</strong>는 오히려 줄어들었을 수 있습니다.
                    RealK는 이러한 착시를 걷어내고 자산의 진짜 가치를 보여줍니다.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '1rem' }}>
                    2. 왜 '금(Gold)' 기준인가?
                </h2>
                <p>
                    세계적인 헤지펀드 매니저 <em>레이 달리오(Ray Dalio)</em>는 "현금은 쓰레기(Cash is Trash)"라고 말하며,
                    정부의 부채 증가와 통화량 팽창이 필연적으로 화폐 가치 하락을 초래한다고 경고합니다.
                </p>
                <p>
                    그는 금을 <strong>"가장 안전한 가치 저장 수단(Store of Value)"</strong>으로 정의하며,
                    변동성이 심한 법정 화폐(Fiat Currency) 대신 금을 기준으로 자산을 평가할 것을 제안합니다.
                </p>
                <div style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '8px', margin: '1.5rem 0', borderLeft: '4px solid #fbbf24' }}>
                    <p style={{ fontStyle: 'italic', margin: 0 }}>
                        "If you don't own gold, you know neither history nor economics."
                        <br />
                        <span style={{ fontSize: '0.9rem', color: '#9ca3af', display: 'block', marginTop: '0.5rem' }}>
                            - Ray Dalio
                        </span>
                    </p>
                </div>
                <p>
                    RealK의 <strong>Gold Standard Mode</strong>는 주가를 원화가 아닌 '금 무게(돈/oz)'로 환산하여 보여줍니다.
                    이는 인플레이션 헤지 관점에서 내가 보유한 주식이 실제로 금보다 가치가 커지고 있는지 검증하는 강력한 도구입니다.
                </p>
            </section>

            <section>
                <h2 style={{ fontSize: '1.8rem', color: '#34d399', marginBottom: '1rem' }}>
                    3. RealK의 알고리즘
                </h2>
                <p>
                    RealK는 단순한 환율 계산기가 아닙니다. <strong>Pandas 벡터 연산</strong>을 통해
                    세 가지 차원의 데이터를 실시간으로 동기화합니다.
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '1rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Nominal Price:</strong> 시장에서 거래되는 원화 가격</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>USD Adjusted:</strong> 일별 원/달러 환율을 적용한 글로벌 가치</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Inflation Adjusted:</strong> 한국/미국 CPI(소비자물가지수)를 일별로 보간(Interpolation)하여 산출한 실질 구매력</li>
                </ul>
            </section>
        </div>
    );
};

export default AboutPage;
