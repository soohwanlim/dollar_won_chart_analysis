import React from 'react';

const PrivacyPolicyPage = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: '#e5e7eb', lineHeight: '1.6' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>개인정보처리방침 (Privacy Policy)</h1>

            <p><strong>시행일: 2026년 1월 24일</strong></p>

            <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>1. 개인정보의 수집 및 이용</h2>
            <p>
                RealK(이하 '서비스')는 별도의 회원가입 없이 이용 가능한 서비스이며,
                사용자의 직접적인 개인정보(이름, 이메일 등)를 서버에 저장하지 않습니다.
            </p>

            <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>2. 쿠키(Cookie) 및 광고</h2>
            <p>
                본 서비스는 사용자 경험 개선을 위해 쿠키를 사용할 수 있습니다.
                또한, 구글 애드센스(Google AdSense)를 통해 광고가 게재될 수 있습니다.
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '1rem' }}>
                <li>Google을 포함한 제3자 공급업체는 쿠키를 사용하여 사용자의 당사 웹사이트 또는 다른 웹사이트 방문 기록을 기반으로 광고를 게재합니다.</li>
                <li>Google의 광고 쿠키 사용으로 인해 Google 및 파트너는 사용자의 당사 사이트 또는 인터넷의 다른 사이트 방문 기록을 기반으로 사용자에게 광고를 게재할 수 있습니다.</li>
                <li>사용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>광고 설정</a>에서 맞춤 광고를 해제할 수 있습니다.</li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>3. 로그 데이터</h2>
            <p>
                서비스 이용 과정에서 방문 기록, IP 주소, 브라우저 정보 등이 자동 생성되어 수집될 수 있으며,
                이는 서비스 안정성 및 통계 목적으로만 사용됩니다.
            </p>

            <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>4. 문의처</h2>
            <p>
                본 방침에 관한 문의사항은 아래 연락처로 문의 바랍니다.<br />
                Email: swtee0506@gmail.com
            </p>
        </div>
    );
};

export default PrivacyPolicyPage;
