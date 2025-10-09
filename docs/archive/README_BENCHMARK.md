# Irys 성능 벤치마크 테스트

## 🎯 목적

**실제 데이터로 Irys-Only 아키텍처의 실현 가능성을 평가합니다.**

이전에는 추정치(3초)를 사용했으나, 이는 검증되지 않은 정보였습니다.
이제 실제 벤치마크를 통해 정확한 성능을 측정하고 아키텍처 결정을 내립니다.

---

## 🚀 벤치마크 실행 방법

### 1. 사전 준비

```bash
cd apps/api

# 의존성 설치 (이미 설치되어 있을 것)
pnpm install

# 벤치마크 디렉토리 확인
ls src/benchmarks/
# → irys-performance-test.ts
```

### 2. 벤치마크 실행

```bash
# 방법 1: npm script 사용
pnpm benchmark:irys

# 방법 2: 직접 실행
npx ts-node-dev src/benchmarks/irys-performance-test.ts
```

### 3. 결과 확인

테스트는 다음을 출력합니다:
- 각 테스트의 평균/최소/최대 응답 시간
- PostgreSQL과의 비교
- BaaS 적합성 평가
- Markdown 형식의 상세 리포트

---

## 📊 테스트 시나리오

### Test 1: 단일 트랜잭션 조회
```javascript
query.search('irys:transactions').limit(1)
```
- 가장 기본적인 쿼리
- 10회 반복 측정

### Test 2: 태그 기반 검색 (10개 결과)
```javascript
query.search('irys:transactions')
  .tags([{ name: 'Content-Type', values: ['application/json'] }])
  .limit(10)
```
- 일반적인 목록 조회
- 10회 반복 측정

### Test 3: 태그 기반 검색 (100개 결과)
```javascript
query.search('irys:transactions')
  .tags([{ name: 'Content-Type', values: ['application/json'] }])
  .limit(100)
```
- 대량 데이터 조회
- 5회 반복 측정

### Test 4: 복잡한 태그 조합 검색
```javascript
query.search('irys:transactions')
  .tags([
    { name: 'App-Name', values: ['IrysBase'] },
    { name: 'Entity-Type', values: ['document', 'project'] },
    { name: 'Content-Type', values: ['application/json'] }
  ])
  .limit(20)
```
- 실제 BaaS 쿼리와 유사
- 10회 반복 측정

### Test 5: 전체 워크플로우 (쿼리 + 데이터 fetch)
```javascript
// 1. 쿼리 실행
const results = await query.search(...).limit(5)

// 2. 각 결과의 데이터 fetch
await Promise.all(
  results.map(tx => fetch(`https://gateway.irys.xyz/${tx.id}`))
)
```
- 실제 사용 시나리오
- 쿼리 + 5개 fetch 포함
- 5회 반복 측정

### Test 6: N+1 쿼리 시나리오
```javascript
// 1. 프로젝트 10개 조회
const projects = await query.search(...).limit(10)

// 2. 각 프로젝트의 문서 개수 조회
await Promise.all(
  projects.map(p => query.search(...))
)
```
- BaaS에서 가장 흔한 패턴
- 관계형 데이터 조회 시뮬레이션
- 3회 반복 측정

### Test 7: PostgreSQL 비교
```javascript
await prisma.project.findMany({
  take: 10,
  include: { _count: { select: { documents: true } } }
})
```
- 동일한 로직을 PostgreSQL로 실행
- 성능 비교 기준
- 10회 반복 측정

---

## 📈 평가 기준

### BaaS 성능 요구사항:

| 응답 시간 | 평가 | BaaS 적합성 |
|-----------|------|-------------|
| < 100ms | ✅ Excellent | 완벽 - 실시간 협업 가능 |
| 100-300ms | ✅ Good | 양호 - 대부분의 BaaS 케이스 가능 |
| 300-1000ms | ⚠️ Marginal | 제한적 - 일부 케이스만 가능 |
| > 1000ms | ❌ Poor | 부적합 - BaaS로 사용 불가 |

### 비교 기준:

- **Supabase**: 평균 10-50ms
- **Firebase**: 평균 50-150ms
- **목표**: < 300ms (허용 가능한 BaaS 성능)

---

## 🔬 예상 결과 시나리오

### 시나리오 A: Irys가 빠르다 (< 100ms)

```
✅ 결과:
- 평균 응답 시간: 50-80ms
- PostgreSQL과 비슷한 수준

💡 결론:
- Irys-Only 아키텍처 실현 가능!
- 순수 탈중앙화 BaaS 구축 가능
- 클라이언트 캐싱 추가로 최적화

🎯 다음 단계:
- Irys-Only로 리팩토링 시작
- 기존 PostgreSQL 코드 제거
- 완전 탈중앙화 아키텍처 구현
```

### 시나리오 B: Irys가 적당하다 (100-300ms)

```
⚠️ 결과:
- 평균 응답 시간: 150-250ms
- PostgreSQL보다 3-5배 느림

💡 결론:
- Irys-Only는 제한적으로 가능
- 실시간 협업은 어려움
- 문서 관리 중심 BaaS는 가능

🎯 다음 단계:
- 하이브리드 vs Irys-Only 선택
- 캐싱 전략 필수
- UX 고려 (로딩 상태 강화)
```

### 시나리오 C: Irys가 느리다 (> 1초)

```
❌ 결과:
- 평균 응답 시간: 1-3초
- PostgreSQL보다 20-50배 느림

💡 결론:
- Irys-Only는 BaaS로 부적합
- 하이브리드 아키텍처 필수
- PostgreSQL을 주 DB로 유지

🎯 다음 단계:
- 현재 하이브리드 아키텍처 유지
- Irys는 영구 저장/증명 용도
- PostgreSQL로 빠른 쿼리 제공
```

---

## 📝 결과 기록

벤치마크 실행 후 결과를 다음 위치에 저장:

```
docs/IRYS_BENCHMARK_RESULTS.md
```

결과에는 다음이 포함됩니다:
- 모든 테스트의 상세 수치
- PostgreSQL과의 비교
- BaaS 적합성 평가
- 아키텍처 추천 사항
- 원본 JSON 데이터

---

## 🎯 다음 단계

벤치마크 결과에 따라:

1. **결과 분석**
   - `docs/IRYS_BENCHMARK_RESULTS.md` 확인
   - 평균 응답 시간 확인
   - PostgreSQL과 비교

2. **아키텍처 결정**
   - Irys-Only 가능 여부 판단
   - 하이브리드 유지 여부 결정

3. **문서 업데이트**
   - `docs/IRYS_ONLY_ARCHITECTURE.md` 수정
   - `docs/IRYS_BAAS_FEASIBILITY.md` 업데이트
   - `docs/DATABASE_ARCHITECTURE.md` 최신화

4. **구현 계획**
   - 선택한 아키텍처 기반 로드맵 작성
   - 리팩토링 또는 최적화 계획

---

## ⚠️ 주의사항

### 네트워크 의존성
- 결과는 인터넷 속도에 영향받음
- 여러 번 실행해서 평균 확인 권장

### Rate Limiting
- 각 테스트 사이 100ms 대기 포함
- 과도한 요청 방지

### 캐싱 효과
- 첫 실행이 가장 정확
- 반복 실행 시 캐싱으로 빨라질 수 있음

### 데이터 의존성
- 실제 Irys에 데이터가 있어야 함
- 태그가 없으면 일부 테스트 실패 가능

---

## 🚀 시작하기

```bash
cd apps/api
pnpm benchmark:irys
```

**결과를 기다리며...**

이 벤치마크는 IrysBase의 미래를 결정할 것입니다! 🎯
