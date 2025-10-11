# Security Policy

## 🔒 보안 정책

IrysBase는 오픈소스 프로젝트로서 보안을 최우선으로 생각합니다.

---

## 🚨 보안 취약점 신고

보안 취약점을 발견하셨다면, **공개 이슈로 등록하지 말고** 다음 방법으로 비공개 신고해주세요:

### 신고 방법

1. **GitHub Security Advisories** (권장)
   - Repository → Security → Advisories → "Report a vulnerability"
   - 또는 직접 링크: `https://github.com/your-org/irysbase/security/advisories/new`

2. **이메일**
   - 이메일: security@your-domain.com
   - 제목: `[SECURITY] 취약점 신고 - [간단한 설명]`

### 신고 시 포함할 정보

다음 정보를 포함해주시면 빠른 대응이 가능합니다:

- 취약점 유형 및 심각도
- 영향받는 컴포넌트/파일
- 재현 방법 (PoC)
- 예상되는 영향
- 가능하다면 해결 방법 제안

### 응답 시간

- 초기 응답: 48시간 이내
- 상세 분석: 1주일 이내
- 패치 배포: 심각도에 따라 결정

---

## ⚠️ 보안 모범 사례

### 1. Private Key 관리

**절대 금지:**
```bash
# ❌ Git에 커밋 금지
git add .env
git commit -m "Add env file"  # NEVER DO THIS!

# ❌ 하드코딩 금지
const privateKey = "0x1234...";  # NEVER DO THIS!
```

**권장 사항:**
```bash
# ✅ 환경변수로 관리
echo "PRIVATE_KEY=0x..." >> .env

# ✅ .gitignore 확인
cat .gitignore | grep .env

# ✅ 테스트용 지갑 분리
# Development: 소액만 보유
# Production: Hardware wallet 또는 KMS 사용
```

### 2. 환경변수 보안

**개발 환경:**
```bash
# .env 파일 권한 제한
chmod 600 .env

# .env 파일이 Git에 추적되지 않는지 확인
git ls-files | grep ".env$"  # 출력 없어야 정상
```

**프로덕션 환경:**
- AWS Secrets Manager
- Google Cloud Secret Manager
- HashiCorp Vault
- Kubernetes Secrets

### 3. 스마트 컨트랙트 보안

```solidity
// ✅ 권장: 접근 제어
modifier onlyOwner() {
    require(msg.sender == owner, "Not authorized");
    _;
}

// ✅ 권장: Reentrancy 방지
nonReentrant modifier 사용

// ✅ 권장: 감사 받은 라이브러리 사용
import "@openzeppelin/contracts/...";
```

### 4. Frontend 보안

```typescript
// ❌ 민감한 데이터 localStorage 저장 금지
localStorage.setItem('privateKey', key);  // NEVER!

// ✅ 권장: 세션 타임아웃 설정
const SESSION_TIMEOUT = 30 * 60 * 1000;  // 30분

// ✅ 권장: XSS 방지
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### 5. API 보안 (백엔드 사용 시)

```typescript
// ✅ Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 100  // 최대 100 요청
});

// ✅ CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// ✅ Input validation
import Joi from 'joi';
const schema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/)
});
```

---

## 🔍 보안 체크리스트

### 배포 전 확인사항

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] Git 히스토리에 Private Key가 없는가?
- [ ] 프로덕션 환경변수가 별도로 관리되는가?
- [ ] API Rate limiting이 설정되어 있는가?
- [ ] CORS가 적절히 설정되어 있는가?
- [ ] 사용자 입력에 대한 검증이 있는가?
- [ ] 스마트 컨트랙트 감사를 받았는가?
- [ ] 의존성 취약점 스캔을 했는가? (`npm audit`)

### 코드 검토 체크리스트

- [ ] `process.env` 외에 하드코딩된 시크릿이 없는가?
- [ ] Private key를 로그에 출력하지 않는가?
- [ ] 민감한 데이터가 localStorage에 저장되지 않는가?
- [ ] SQL Injection 방지가 되어 있는가? (Prisma ORM 사용)
- [ ] XSS 방지가 되어 있는가?

---

## 🛡️ 의존성 보안

### 정기적인 업데이트

```bash
# 취약점 스캔
npm audit
pnpm audit

# 자동 수정
npm audit fix
pnpm audit --fix

# 의존성 업데이트
pnpm update
```

### 보안 도구

**추천 도구:**
- [Snyk](https://snyk.io/) - 의존성 취약점 스캔
- [Dependabot](https://github.com/dependabot) - 자동 업데이트
- [Socket Security](https://socket.dev/) - Supply chain 보안
- [Mythril](https://github.com/ConsenSys/mythril) - 스마트 컨트랙트 분석

---

## 🔐 지갑 보안 (사용자 가이드)

### MetaMask 사용자

1. **시드 문구 보관**
   - 종이에 적어서 안전한 곳에 보관
   - 절대 디지털로 저장하지 마세요
   - 사진 찍지 마세요

2. **피싱 방지**
   - 항상 URL 확인: `https://your-domain.com`
   - 의심스러운 서명 요청 거부
   - MetaMask 팝업에서 내용 꼼꼼히 확인

3. **지갑 분리**
   - 고액 자산: Hardware wallet
   - 일상 사용: Hot wallet (소액만)
   - 테스트: 별도 지갑

---

## 📚 추가 리소스

### 보안 가이드
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Web3 Security Guide](https://github.com/Quillhash/Web3-Security)

### 감사 서비스
- [OpenZeppelin](https://openzeppelin.com/security-audits/)
- [Trail of Bits](https://www.trailofbits.com/)
- [Consensys Diligence](https://consensys.net/diligence/)

---

## 🏆 보안 기여자

보안 취약점을 책임감 있게 신고해주신 분들께 감사드립니다:

<!-- 기여자 목록은 여기에 추가됩니다 -->
- (아직 없음)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경사항 |
|------|------|----------|
| 2025-01-10 | 1.0.0 | 초기 보안 정책 수립 |

---

**보안은 모두의 책임입니다. 안전한 Web3 생태계를 함께 만들어갑시다! 🔒**
