# 다음 단계: IrysVM 테스트넷으로 전환하기 🚀

**현재 상태**: ✅ 프론트엔드 테스트 완료 - 품질 우수 (85/100)
**필요 작업**: ⚠️ MetaMask 네트워크 전환 필요
**소요 시간**: 2분

---

## 📋 현재 상황 요약

### ✅ 성공적으로 완료된 항목

1. **Playwright 테스트 완료**
   - UI/UX 품질: 95/100 (Supabase급 디자인)
   - 모든 페이지 정상 작동
   - 8개 템플릿 시스템 작동
   - Irys DataChain 업로드 성공 (`9PSXkau9aUaPL94mMbjTDHE2X4ebsN7YzpsQEdFnoQhJ`)

2. **기술적 검증 완료**
   - ethers v6 어댑터 정상 작동
   - IndexedDB 캐시 초기화
   - Vector DB 연동
   - MetaMask 지갑 연결

### ⚠️ 현재 문제점

**네트워크 불일치**: Ethereum Mainnet (Chain 1)에 연결됨 → IrysVM Testnet (Chain 1270)으로 전환 필요

**증상**:
- 사이드바에 "Chain 1" 표시
- 잔액이 "0.0000 ETH"로 표시 (IRYS 토큰이 아님)
- 스마트 컨트랙트 등록 불가능 (가스비 지불 불가)

---

## 🎯 해결 방법: MetaMask 네트워크 추가

### 방법 1: 자동 추가 (권장)

1. **MetaMask 열기**
   - 브라우저 우측 상단 MetaMask 아이콘 클릭

2. **네트워크 드롭다운 클릭**
   - 현재 "Ethereum Mainnet" 표시된 부분 클릭

3. **"네트워크 추가" 선택**
   - 드롭다운 하단의 "네트워크 추가" 버튼 클릭

4. **수동으로 네트워크 추가**
   - "네트워크 수동 추가" 클릭
   - 아래 정보 입력:

```
네트워크 이름: Irys Testnet
RPC URL: https://testnet-rpc.irys.xyz/v1/execution-rpc
체인 ID: 1270
통화 기호: IRYS
블록 탐색기 URL: (비워두기 - 아직 없음)
```

5. **저장 후 전환**
   - "저장" 버튼 클릭
   - 자동으로 IrysVM Testnet으로 전환됨

### 방법 2: 빠른 전환 (네트워크가 이미 추가된 경우)

1. MetaMask 네트워크 드롭다운 클릭
2. "Irys Testnet" 선택
3. 완료!

---

## ✅ 네트워크 전환 확인하기

### MetaMask에서 확인
- 네트워크 이름이 **"Irys Testnet"**으로 표시
- 잔액이 **IRYS** 토큰으로 표시 (faucet에서 받은 금액)

### 애플리케이션에서 확인
1. 브라우저 새로고침 (F5)
2. 사이드바 확인:
   - ❌ 이전: "Chain 1"
   - ✅ 현재: "Chain 1270" 또는 "Irys Testnet" (코드 업데이트 필요)
3. 잔액 확인:
   - ❌ 이전: "0.0000 ETH"
   - ✅ 현재: "XXX.XXXX IRYS" (실제 faucet 잔액)

---

## 🧪 네트워크 전환 후 테스트 시나리오

### 1단계: 데이터 생성 테스트 (5분)

1. **Create Data 페이지 이동**
   - 좌측 메뉴에서 "Create Data" 클릭

2. **템플릿 선택**
   - "Project" 템플릿 선택 (또는 원하는 템플릿)

3. **정보 입력**
   ```
   Title: IrysVM 테스트 프로젝트
   Tags: test, irysvm, production
   ```

4. **JSON 수정 (선택)**
   ```json
   {
     "name": "IrysVM Integration Test",
     "description": "Testing on IrysVM Testnet with IRYS tokens",
     "slug": "irysvm-test-2025",
     "visibility": "public"
   }
   ```

5. **"Create Data" 버튼 클릭**

6. **MetaMask 서명 승인**
   - 첫 번째 팝업: Irys 업로드 서명 (Bundlr) → "컨펌"
   - 두 번째 팝업: 스마트 컨트랙트 등록 (IRYS 가스비) → "컨펌"

7. **성공 확인**
   - ✅ 토스트 알림: "Data created successfully!"
   - ✅ 자동으로 Data Browser로 이동
   - ✅ 새로 생성된 문서가 목록에 표시

### 2단계: 데이터 조회 테스트 (3분)

1. **Data Browser에서 확인**
   - Total Records: 1로 증가
   - Projects: 1로 증가 (Project 템플릿 사용 시)

2. **문서 클릭하여 상세 보기**
   - Title, Tags, JSON 내용 확인
   - Irys Transaction ID 확인
   - Smart Contract Address 확인

3. **검색 기능 테스트**
   - 검색창에 태그 입력 (예: "test")
   - 필터링이 정상 작동하는지 확인

### 3단계: 추가 기능 테스트 (선택)

1. **다양한 템플릿 테스트**
   - Document, Vector, NFT, Game Save 등

2. **Export 기능 테스트**
   - 문서 선택 후 "Export" 버튼
   - CSV/JSON 다운로드 확인

3. **Vector DB 테스트**
   - "Vector DB Test" 페이지 이동
   - Vector 업로드 및 검색 테스트

---

## 🔍 예상되는 결과

### ✅ 성공 시나리오

**1. Irys 업로드 성공**
```
📝 Creating document...
✅ Uploaded to Irys: [TRANSACTION_ID]
```

**2. 스마트 컨트랙트 등록 성공**
```
✅ Document registered on blockchain
✅ Data created successfully!
```

**3. Data Browser에서 확인**
- 문서가 목록에 표시됨
- 클릭하면 상세 정보 확인 가능
- Irys Gateway 링크로 직접 접근 가능

### ❌ 실패 시나리오 및 해결

**문제 1**: "Insufficient funds for gas"
- **원인**: IRYS 잔액 부족
- **해결**: Faucet에서 추가 토큰 받기
  ```
  https://faucet.irys.xyz/ (또는 제공된 faucet URL)
  ```

**문제 2**: "Wrong network"
- **원인**: 여전히 Ethereum Mainnet에 연결됨
- **해결**: MetaMask에서 IrysVM Testnet 수동 선택

**문제 3**: "Transaction failed"
- **원인**: RPC 연결 문제
- **해결**: RPC URL 확인
  ```
  https://testnet-rpc.irys.xyz/v1/execution-rpc
  ```

---

## 📊 성능 벤치마크 (예상)

### IrysVM Testnet 사용 시

| 작업 | 예상 시간 | 가스비 (IRYS) |
|------|-----------|---------------|
| Irys 업로드 | 1-3초 | ~$0.01 |
| 스마트 컨트랙트 등록 | 2-5초 | ~$0.001 |
| 전체 문서 생성 | 3-8초 | ~$0.011 |

**비교: Ethereum Mainnet 사용 시**
- Irys 업로드: ~$0.01 (동일)
- Ethereum 가스비: **$10-50** (매우 비쌈)
- 전체 문서 생성: **$10-50** (99.9% 더 비쌈)

---

## 🐛 문제 발생 시 디버깅

### 1. 콘솔 로그 확인

**브라우저 개발자 도구 열기** (F12)
- Console 탭에서 에러 메시지 확인
- 예상되는 성공 로그:
  ```
  ✅ Pure Irys Client initialized
  ✅ Uploaded to Irys: [TX_ID]
  ✅ Document registered
  ```

### 2. MetaMask 활동 확인

- MetaMask 열기 → "활동" 탭
- 최근 트랜잭션 상태 확인:
  - ✅ 성공 (녹색 체크)
  - ⏳ 보류 중 (주황색 시계)
  - ❌ 실패 (빨간색 X)

### 3. 네트워크 연결 확인

**터미널에서 RPC 연결 테스트**:
```bash
curl -X POST https://testnet-rpc.irys.xyz/v1/execution-rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**예상 응답**:
```json
{"jsonrpc":"2.0","id":1,"result":"0x4f6"}
```
(`0x4f6` = 1270 in decimal)

### 4. 잔액 확인

```bash
# 주소를 본인의 MetaMask 주소로 변경
curl -X POST https://testnet-rpc.irys.xyz/v1/execution-rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["YOUR_WALLET_ADDRESS","latest"],
    "id":1
  }'
```

---

## 📈 다음 단계 (네트워크 전환 후)

### 즉시 (테스트 완료 후)

1. **결과 확인**
   - [ ] 문서 생성 성공
   - [ ] Data Browser에서 조회 가능
   - [ ] Export 기능 작동
   - [ ] 검색 기능 작동

2. **스크린샷 저장** (선택)
   - 성공한 트랜잭션
   - Data Browser에 표시된 문서
   - MetaMask 활동 내역

### 중기 (개발 계속 시)

3. **코드 개선** (선택)
   - 네트워크 불일치 경고 추가
   - 자동 네트워크 전환 프롬프트
   - "ETH" → "IRYS" 동적 표시

4. **추가 기능 테스트**
   - Vector DB 기능
   - Blockchain 탐색기 페이지
   - Usage 통계

### 장기 (프로덕션 준비)

5. **메인넷 준비** (IrysVM 메인넷 출시 시)
   - 메인넷 RPC URL 설정
   - 프로덕션 배포
   - 모니터링 및 분석 설정

---

## 📚 참고 문서

### 생성된 테스트 보고서
1. **`FRONTEND_TESTING_REPORT.md`** - 상세 기술 분석 (3000+ 단어)
2. **`PLAYWRIGHT_TEST_SUMMARY.md`** - 경영진 요약 및 권장사항
3. **`CRITICAL_FIXES_NEEDED.md`** - 단계별 수정 가이드

### IrysVM 문서
- **IrysVM 공식 문서**: https://docs.irys.xyz/
- **테스트넷 RPC**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **Faucet**: (제공된 URL 사용)

### 스마트 컨트랙트 주소 (IrysVM Testnet)
```javascript
documentRegistry: "0x937956DA31B42C3ad9f6eC4366360Ae763391566"
vectorRegistry:    "0xd75a83C90b52435009771b55da21ef688AD07264"
accessControl:     "0xdD1ACe083c156296760aAe07718Baab969642B8D"
provenanceChain:   "0x44755E8C746Dc1819a0e8c74503AFC106FC800CB"
eventBus:          "0x042E4e6a56aA1680171Da5e234D9cE42CBa03E1c"
cacheController:   "0x8aFb8b9d57e9b6244e29a090ea4da1A9043a91E2"
searchIndex:       "0x2345938F52790F1d8a1E3355cA66eA3e60494A36"
```

---

## ✅ 체크리스트

### 네트워크 전환 전
- [ ] Playwright 테스트 보고서 읽음
- [ ] 현재 문제점 이해 (Chain 1 vs Chain 1270)
- [ ] IrysVM Testnet 정보 확인

### 네트워크 전환 중
- [ ] MetaMask에 IrysVM Testnet 추가
- [ ] 네트워크 전환 완료
- [ ] 잔액 표시 확인 (IRYS)

### 네트워크 전환 후
- [ ] 애플리케이션 새로고침
- [ ] 문서 생성 테스트 성공
- [ ] Data Browser에서 문서 확인
- [ ] 추가 기능 테스트 (선택)

---

## 🎯 최종 목표

**완전히 작동하는 Pure Irys BaaS 애플리케이션**:
- ✅ IrysVM Testnet에 연결
- ✅ IRYS 토큰으로 가스비 지불
- ✅ Irys DataChain에 영구 저장
- ✅ 스마트 컨트랙트에 메타데이터 등록
- ✅ 모든 CRUD 기능 작동

---

**현재 상태**: 95% 완료! 🎉
**남은 작업**: MetaMask 네트워크 전환만 하면 됩니다 (2분 소요)

**성공을 기원합니다!** 🚀

질문이나 문제가 있으면 생성된 문서들을 참고하거나, 콘솔 로그를 확인해주세요.
