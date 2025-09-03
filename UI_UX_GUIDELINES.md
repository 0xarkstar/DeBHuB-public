# IrysBase UI/UX Design Guidelines

## 🎯 Core Design Philosophy

IrysBase는 **분산형 BaaS 플랫폼**으로서 **개발자 친화적**이면서도 **블록체인의 복잡성을 추상화**한 사용자 경험을 제공해야 합니다. Supabase의 직관적인 개발자 경험을 벤치마킹하되, 분산형 시스템의 고유한 특성을 반영해야 합니다.

---

## 🏗️ Architecture-Aware Design Principles

### 1. **하이브리드 아키텍처 투명성**
- **Irys (영구 저장소)** vs **PostgreSQL (쿼리 레이어)** 구분을 시각적으로 표현
- 데이터 흐름: `사용자 입력 → Irys 업로드 → 블록체인 검증 → PostgreSQL 동기화`
- 사용자가 각 단계의 상태를 명확하게 인지할 수 있도록 UI 설계

### 2. **블록체인 상태 가시성**
- **네트워크 상태**: IrysVM 연결 여부를 사이드바에 표시
- **트랜잭션 진행**: Submit → Confirm → Finalize 단계별 진행상황
- **가스비 추정**: 실시간 비용 계산 및 잔액 부족 경고

### 3. **데이터 무결성 강조**
- **버전 히스토리**: 가변 참조 체인 시각화
- **검증 상태**: Irys vs PostgreSQL 데이터 일치성 표시
- **영구성 보장**: "Permanently stored on Irys" 같은 신뢰성 메시지

---

## 🎨 Visual Design Standards

### Color Palette
```css
/* Primary Colors - IrysBase Brand */
--irys-primary: #6366f1;      /* Indigo - main brand */
--irys-secondary: #8b5cf6;    /* Purple - accent */
--irys-success: #10b981;      /* Green - success states */
--irys-warning: #f59e0b;      /* Amber - warnings */
--irys-error: #ef4444;        /* Red - errors */

/* Network Status Colors */
--network-connected: #059669;  /* IrysVM connected */
--network-warning: #d97706;    /* Wrong network */
--network-disconnected: #6b7280; /* Disconnected */

/* Data States */
--data-synced: #10b981;       /* Data synchronized */
--data-pending: #f59e0b;      /* Sync pending */
--data-conflict: #ef4444;     /* Sync conflict */
```

### Typography
- **Headings**: Inter, system fonts 지원
- **Body**: 가독성 우선, 14px 기본 사이즈
- **Code**: JetBrains Mono, Fira Code 등 개발자 친화적 폰트

### Iconography
- **Lucide React** 기반 일관된 아이콘 체계
- 블록체인 관련: `Wallet`, `Network`, `Shield`, `Link`
- 데이터 관련: `Database`, `FileText`, `GitBranch` (버전 히스토리)
- 상태 관련: `CheckCircle`, `AlertCircle`, `RefreshCw`

---

## 📱 Component Design Guidelines

### 1. **WalletConnection Component**
```typescript
// Required States to Show:
- isConnected: boolean
- chainId: number (highlight if not IrysVM)
- balance: string (with funding option if low)
- address: string (shortened format)

// Visual Requirements:
- Prominent connect button when disconnected
- Network mismatch warning with switch button
- Balance display with refresh and fund options
```

### 2. **PostCreation Component**
```typescript
// Progressive Disclosure:
1. Content Input (with live cost estimation)
2. Cost Review & Balance Check
3. Transaction Submission with Progress
4. Success with Irys Transaction ID

// Error Handling:
- Insufficient balance → Funding options
- Network issues → Retry mechanisms
- Authentication failure → Re-connect wallet
```

### 3. **DataTable Component**
```typescript
// Essential Features:
- Real-time updates (GraphQL subscriptions)
- Version history indicator
- Sync status per row
- Infinite scroll with virtual scrolling
- Export functionality (CSV, JSON)

// Performance:
- Virtual scrolling for large datasets
- Optimistic updates for better UX
- Loading skeletons during fetch
```

### 4. **StatusIndicators**
```typescript
// Network Status:
<NetworkStatus 
  connected={isIrysVM} 
  chainId={chainId}
  showSwitchButton={!isIrysVM}
/>

// Sync Status:
<SyncIndicator 
  status="synced" | "pending" | "conflict"
  lastSync={timestamp}
  showDetails={boolean}
/>

// Transaction Status:
<TxProgress
  stage="submitting" | "confirming" | "finalized"
  txHash={string}
  explorerUrl={string}
/>
```

---

## 🔧 Interaction Patterns

### 1. **Progressive Enhancement**
- 기본 기능은 MetaMask 없이도 작동 (읽기 전용)
- 지갑 연결 시 점진적으로 기능 활성화
- 네트워크 전환 시 자동 기능 조정

### 2. **Contextual Guidance**
- 첫 방문자를 위한 onboarding flow
- 각 액션마다 예상 비용과 시간 표시
- 에러 상황에서 해결책 제안

### 3. **Feedback & Confirmation**
- 모든 블록체인 트랜잭션은 명시적 확인 필요
- 성공/실패에 대한 명확한 피드백
- Undo 불가능한 액션에 대한 경고

### 4. **Responsive Behavior**
- 데스크톱: 사이드바 + 메인 콘텐츠
- 태블릿: 접을 수 있는 사이드바
- 모바일: 바텀 네비게이션 + 풀스크린

---

## 🎯 User Journey Considerations

### New User Flow
1. **Landing** → 지갑 없이 둘러보기 가능
2. **Connect Wallet** → MetaMask 설치/연결 가이드
3. **Network Setup** → IrysVM 자동 추가
4. **First Post** → 단계별 가이드와 비용 설명
5. **Explore Features** → 고급 기능 점진적 노출

### Developer Flow
1. **API Keys** → GraphQL endpoint 및 인증
2. **Schema Explorer** → 실시간 문서
3. **Query Playground** → 테스트 환경
4. **SDK Integration** → 코드 예시 및 튜토리얼

### Power User Flow
1. **Batch Operations** → 대량 데이터 처리
2. **Advanced Queries** → 복잡한 필터링 및 정렬
3. **Data Export** → 백업 및 분석용 내보내기
4. **Monitoring** → 사용량 및 성능 모니터링

---

## ⚠️ Critical UX Considerations

### 1. **Performance Expectations**
- **Loading States**: 모든 비동기 작업에 로딩 표시
- **Optimistic Updates**: 즉시 UI 반영 후 서버 확인
- **Cache Management**: 적절한 캐싱으로 반응성 향상
- **Error Recovery**: 네트워크 오류 시 자동 재시도

### 2. **Trust & Security**
- **Data Permanence**: Irys 저장의 영구성 강조
- **Transaction Transparency**: 모든 온체인 액션 공개
- **Privacy Controls**: 개인 정보 처리 방침 명시
- **Audit Trail**: 모든 변경 사항 추적 가능

### 3. **Accessibility**
- **Keyboard Navigation**: 모든 기능 키보드로 접근 가능
- **Screen Reader**: 적절한 ARIA 라벨링
- **Color Contrast**: WCAG 2.1 AA 준수
- **Focus Management**: 논리적 탭 순서

### 4. **Error Handling**
- **User-Friendly Messages**: 기술적 오류를 이해하기 쉽게 변환
- **Action Suggestions**: 오류 해결을 위한 구체적 가이드
- **Fallback Options**: 주요 기능 실패 시 대안 제공
- **Support Integration**: 도움말 및 지원 연결

---

## 📋 Implementation Checklist

### Before UI Changes
- [ ] 기존 컴포넌트와 일관성 확인
- [ ] Figma/디자인 시스템과 동기화
- [ ] 접근성 요구사항 검토
- [ ] 성능 영향 평가

### During Development
- [ ] shadcn/ui 컴포넌트 최대 활용
- [ ] Tailwind CSS 유틸리티 클래스 우선
- [ ] TypeScript 타입 안전성 보장
- [ ] Storybook 컴포넌트 문서화

### After Implementation
- [ ] 크로스 브라우저 테스트
- [ ] 반응형 디자인 검증
- [ ] 접근성 자동화 테스트
- [ ] 성능 메트릭 측정

---

## 🔄 Continuous Improvement

### Analytics & Monitoring
- 사용자 여정 분석 (PostHog, Google Analytics)
- 성능 모니터링 (Web Vitals)
- 오류 추적 (Sentry)
- 사용성 테스트 (정기적 실시)

### Feedback Collection
- 인앱 피드백 시스템
- GitHub Issues 연동
- 커뮤니티 Discord/Forum
- 개발자 설문 조사

---

**Remember**: IrysBase는 단순한 웹 애플리케이션이 아닌 **분산형 인프라의 관문**입니다. 사용자가 블록체인의 복잡성을 느끼지 않으면서도 그 혜택을 누릴 수 있는 경험을 제공하는 것이 핵심입니다.