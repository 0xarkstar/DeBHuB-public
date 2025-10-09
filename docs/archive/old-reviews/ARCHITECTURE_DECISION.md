# IrysBase 아키텍처 최종 결정

**날짜:** 2025-10-08
**결정자:** 실제 벤치마크 데이터 기반
**벤치마크 결과:** [IRYS_BENCHMARK_RESULTS.md](./IRYS_BENCHMARK_RESULTS.md)

---

## 📊 실제 벤치마크 결과 요약

### Irys 성능 (실측):

| 테스트 | 평균 시간 | 평가 |
|--------|----------|------|
| 단순 쿼리 | 287ms | ⚠️ 느림 |
| 복잡한 쿼리 | 201ms | ⚠️ 느림 |
| 쿼리 + Fetch (5개) | 997ms | ❌ 매우 느림 |
| N+1 패턴 | 200ms | ⚠️ 느림 |

### PostgreSQL 성능 (비교):

| 테스트 | 평균 시간 | 평가 |
|--------|----------|------|
| 동일 쿼리 | 6ms | ✅ 빠름 |

### 속도 비교:

- **Irys는 PostgreSQL보다 33-166배 느림**
- **Supabase 목표 (50ms)에 비해 4-20배 느림**

---

## ❌ Irys-Only 아키텍처 - 불가능

### 불가능한 이유:

1. **응답 시간 부적합**
   - 목표: < 100ms
   - 실제: 287ms (쿼리만)
   - 실제: 997ms (전체 워크플로우)

2. **BaaS 기준 미달**
   - Supabase: 10-50ms
   - Firebase: 50-150ms
   - Irys: 200-1000ms ❌

3. **사용자 경험 저하**
   - 로딩 스피너 필수
   - 실시간 협업 불가
   - 대시보드 느림

4. **경쟁력 상실**
   - Supabase 대비 열등
   - 일반 사용자 이탈 예상
   - 특수 니치만 타겟 가능

### Irys-Only가 가능한 유일한 경우:

```
✅ 속도보다 영구성이 절대적으로 중요한 경우:
   - 법률 문서 아카이브
   - 학술 논문 저장소
   - 역사적 기록 보존
   - 증거 자료 관리

⚠️ 조건:
   - 사용자가 300ms+ 지연 허용
   - 읽기 중심 (쓰기 적음)
   - 실시간 불필요
   - 클라이언트 캐싱 적극 활용
```

---

## ✅ 하이브리드 아키텍처 - 최적 선택

### 아키텍처 구성:

```
┌─────────────────────────────────────────────────────────────┐
│              IrysBase 하이브리드 BaaS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [사용자 요청]                                               │
│       ↓                                                     │
│  [PostgreSQL] ← 주 데이터베이스                              │
│   ⚡ 6ms 응답                                                │
│   ✅ 복잡한 쿼리                                             │
│   ✅ 실시간 구독                                             │
│   ✅ JOIN, 집계                                             │
│       ↓                                                     │
│  [즉시 응답] → 사용자                                        │
│       ↓                                                     │
│  [백그라운드]                                                │
│       ↓                                                     │
│  [Irys DataChain] ← 영구 저장소                             │
│   🔒 불변 백업                                               │
│   ✅ 블록체인 증명                                           │
│   ✅ 검열 저항                                               │
│   ✅ 버전 히스토리                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

결과:
- 사용자: 6ms 응답 ✅
- 시스템: 영구 보존 ✅
- 비용: 효율적 ✅
```

### 하이브리드의 장점:

| 항목 | PostgreSQL | Irys | 하이브리드 |
|------|-----------|------|-----------|
| **쿼리 속도** | 6ms | 287ms | **6ms** ✅ |
| **복잡한 쿼리** | ✅ | ❌ | **✅** |
| **실시간 협업** | ✅ | ❌ | **✅** |
| **영구성** | ❌ | ✅ | **✅** |
| **블록체인 증명** | ❌ | ✅ | **✅** |
| **검열 저항** | ❌ | ✅ | **✅** |
| **비용** | $1.20/월 | $0.01/월 | **$1.21/월** |

**하이브리드 = 최고의 속도 + 최고의 영구성**

---

## 🎯 최종 결정

### ✅ **하이브리드 아키텍처 채택**

**이유:**

1. **BaaS 목표 달성**
   - Supabase 수준의 속도 (6ms)
   - Supabase에 없는 기능 (영구성, 블록체인)
   - 진정한 Web3 BaaS

2. **실측 데이터 근거**
   - Irys: 287ms (쿼리), 997ms (fetch)
   - PostgreSQL: 6ms
   - **48배 속도 차이 = 하이브리드 필수**

3. **사용자 경험 최우선**
   - 로딩 시간 최소화
   - 실시간 협업 가능
   - Supabase와 경쟁 가능

4. **차별화 유지**
   - PostgreSQL: 속도
   - Irys: 영구성
   - **= Supabase를 뛰어넘는 가치**

---

## 📐 구현 상세

### 데이터 흐름:

```javascript
// 1. 사용자가 문서 생성
const doc = await createDocument({
  title: "Getting Started",
  content: "# Hello World"
})

// 2. PostgreSQL에 즉시 저장 (6ms)
const saved = await prisma.document.create({ data: doc })

// 3. 사용자에게 즉시 응답 ✅
return saved  // 6ms 총 소요

// 4. 백그라운드에서 Irys 업로드 (비동기)
setImmediate(async () => {
  const irysId = await irysService.upload(doc)  // 300ms (사용자 무관)
  await prisma.document.update({
    where: { id: saved.id },
    data: { irysId, permanentUrl: `https://...${irysId}` }
  })
})

// 5. 사용자 경험: 즉각 반응 ✅
// 6. 시스템 보장: 영구 백업 ✅
```

### 조회 최적화:

```javascript
// PostgreSQL에서 빠르게 조회
const projects = await prisma.project.findMany({
  take: 10,
  include: {
    _count: { select: { documents: true } },
    owner: true
  }
})  // 6ms ✅

// Irys 증명은 필요 시에만
if (needBlockchainProof) {
  const proof = await irysService.getProof(project.irysId)  // 300ms
}
```

### 비용 최적화:

```
월간 사용량 예시 (중소 프로젝트):
- PostgreSQL: $1.20/월 (Supabase Free 또는 Railway)
- Irys: $0.01/월 (1GB 일회성 $2.5)
- 총: $1.21/월

Supabase alone: $25/월 (Pro 플랜)
IrysBase: $1.21/월 + 영구성 보장

→ 95% 비용 절감 + 우월한 기능
```

---

## 🚀 다음 단계

### 1. 현재 아키텍처 유지 및 최적화

```
✅ PostgreSQL + Irys 하이브리드 유지
✅ 백그라운드 업로드 최적화
✅ 캐싱 전략 강화
✅ 에러 처리 개선
```

### 2. Irys 최적화 적용

비록 Irys-Only는 불가능하지만, 하이브리드 내에서 Irys 성능 개선:

```javascript
// 배치 업로드
const uploads = await Promise.all(
  documents.map(doc => irysService.upload(doc))
)  // 병렬 처리

// 클라이언트 캐싱 (블록체인 증명)
const proofCache = new Map()
if (proofCache.has(irysId)) {
  return proofCache.get(irysId)  // 0ms
}
```

### 3. 문서 업데이트

- ✅ `IRYS_BENCHMARK_RESULTS.md` 완료
- ✅ `ARCHITECTURE_DECISION.md` 완료 (이 문서)
- ⏳ `README.md` 업데이트 (하이브리드 강조)
- ⏳ `DATABASE_ARCHITECTURE.md` 실측 데이터 반영

### 4. MVP 준비

```
Phase 1: 코어 기능 안정화
- PostgreSQL 성능 최적화
- Irys 백그라운드 안정성
- 에러 복구 메커니즘

Phase 2: 사용자 테스트
- 베타 사용자 초대
- 성능 모니터링
- 피드백 수집

Phase 3: 정식 출시
- 가격 모델 확정
- 마케팅 준비
- 문서 완성
```

---

## 💭 교훈

### 추정 vs 실측:

| 항목 | 초기 추정 | 실제 측정 | 차이 |
|------|----------|----------|------|
| Irys 쿼리 | "3초?" | 287ms | **10배 빠름** |
| 전체 워크플로우 | "3초?" | 997ms | **3배 빠름** |
| PostgreSQL | "10ms" | 6ms | **거의 정확** |

**교훈:**
- ✅ 추정보다 Irys가 빠름 (긍정적 서프라이즈)
- ❌ 하지만 여전히 BaaS로는 느림
- ✅ 하이브리드 결정은 올바름

### 벤치마크의 중요성:

> "3초 추정"으로 Irys-Only를 포기할 뻔 했으나,
> 실제는 287ms로 **10배 빠름**.
> 하지만 BaaS 기준 (50ms)에는 여전히 **6배 느림**.
> **데이터 없이 결정하지 말 것.**

---

## 🎯 최종 권고

### 단기 (1-3개월):

1. ✅ **하이브리드 아키텍처 유지**
2. ✅ **성능 최적화** (캐싱, 배치)
3. ✅ **MVP 출시**
4. ✅ **사용자 피드백 수집**

### 중기 (3-6개월):

1. 사용 패턴 분석
2. Irys 활용도 확인
3. 비용 최적화
4. 필요시 아키텍처 조정

### 장기 (6-12개월):

1. 스케일업 준비
2. Enterprise 기능 추가
3. 멀티 리전 배포
4. 선택적 Irys-Only 모드 (니치 시장)

---

## 📋 체크리스트

현재 아키텍처 검증:

- [x] 실제 벤치마크 수행
- [x] 데이터 기반 결정
- [x] 하이브리드 선택
- [x] 문서화 완료
- [ ] README 업데이트
- [ ] 팀 공유
- [ ] MVP 준비

---

## 🔐 서명

**결정:** 하이브리드 아키텍처 (PostgreSQL + Irys)
**근거:** 실측 벤치마크 데이터
**날짜:** 2025-10-08
**상태:** **최종 승인** ✅

---

**이 결정은 향후 IrysBase의 모든 개발의 기반이 됩니다.**
