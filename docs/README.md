# DeBHuB 문서

> **언어**: [English](README.en.md) | [한국어](README.md) | [中文](README.zh.md)

DeBHuB (탈중앙화 Backend-as-a-Service) 프로젝트의 완전한 문서입니다.

---

## 📚 문서 구조

### 🏗️ Architecture (아키텍처)
시스템 설계 및 기술 분석 문서

- **[IRYS_ARCHITECTURE_ANALYSIS.md](./architecture/IRYS_ARCHITECTURE_ANALYSIS.md)** - Irys 3계층 아키텍처 완전 분석
- **[IRYSVM_STATUS_REPORT.md](./architecture/IRYSVM_STATUS_REPORT.md)** - IrysVM 테스트넷 배포 현황
- **[PURE_IRYS_SETUP.md](./architecture/PURE_IRYS_SETUP.md)** - Pure Irys 스택 설정 가이드

### 📖 Guides (가이드)
사용자 및 개발자를 위한 단계별 가이드

- **[USER_GUIDE_NEXT_STEPS.md](./guides/USER_GUIDE_NEXT_STEPS.md)** - IrysVM 테스트넷 시작하기
- **[MIGRATION_GUIDE.md](./guides/MIGRATION_GUIDE.md)** - 하이브리드에서 Pure Irys로 마이그레이션
- **[PUBLIC_RELEASE_GUIDE.md](./guides/PUBLIC_RELEASE_GUIDE.md)** - 공개 릴리스 준비
- **[VECTOR_DB_GUIDE.md](./guides/VECTOR_DB_GUIDE.md)** - 벡터 데이터베이스 사용 가이드

### 🧪 Testing (테스팅)
테스트 리포트 및 품질 보증 문서

- **[FRONTEND_TESTING_REPORT.md](./testing/FRONTEND_TESTING_REPORT.md)** - Playwright 테스트 결과
- **[PLAYWRIGHT_TEST_SUMMARY.md](./testing/PLAYWRIGHT_TEST_SUMMARY.md)** - 프론트엔드 테스팅 요약
- **[VECTOR_DB_TEST_RESULTS.md](./testing/VECTOR_DB_TEST_RESULTS.md)** - Vector DB 통합 테스트 결과
- **[IRYS_INTEGRATION_FIX_REPORT.md](./testing/IRYS_INTEGRATION_FIX_REPORT.md)** - Irys SDK ethers v6 호환성 수정

### 💻 Development (개발)
내부 개발 문서 및 구현 리포트

- **[IRYSVM_MIGRATION_PLAN.md](./development/IRYSVM_MIGRATION_PLAN.md)** - IrysVM 마이그레이션 전략
- **[NETWORK_AUTO_SWITCH_IMPLEMENTATION.md](./development/NETWORK_AUTO_SWITCH_IMPLEMENTATION.md)** - 자동 네트워크 전환 기능
- **[CRITICAL_FIXES_NEEDED.md](./development/CRITICAL_FIXES_NEEDED.md)** - 설정 수정 가이드
- **[POST_RELEASE_CHECKLIST.md](./development/POST_RELEASE_CHECKLIST.md)** - 릴리스 체크리스트
- **[PROJECT_ANALYSIS_REPORT.md](./development/PROJECT_ANALYSIS_REPORT.md)** - 프로젝트 분석 및 로드맵

---

## 🚀 빠른 시작

### 신규 사용자
1. [USER_GUIDE_NEXT_STEPS.md](./guides/USER_GUIDE_NEXT_STEPS.md)로 시작
2. [IRYS_ARCHITECTURE_ANALYSIS.md](./architecture/IRYS_ARCHITECTURE_ANALYSIS.md)로 시스템 이해
3. [IRYSVM_STATUS_REPORT.md](./architecture/IRYSVM_STATUS_REPORT.md)에서 현재 배포 상태 확인

### 개발자
1. [PURE_IRYS_SETUP.md](./architecture/PURE_IRYS_SETUP.md)로 설정
2. [MIGRATION_GUIDE.md](./guides/MIGRATION_GUIDE.md)로 마이그레이션 단계 검토
3. [NETWORK_AUTO_SWITCH_IMPLEMENTATION.md](./development/NETWORK_AUTO_SWITCH_IMPLEMENTATION.md)에서 UX 기능 확인

### QA/테스터
1. [FRONTEND_TESTING_REPORT.md](./testing/FRONTEND_TESTING_REPORT.md)에서 테스트 커버리지 확인
2. [PLAYWRIGHT_TEST_SUMMARY.md](./testing/PLAYWRIGHT_TEST_SUMMARY.md)에서 요약 검토
3. [VECTOR_DB_TEST_RESULTS.md](./testing/VECTOR_DB_TEST_RESULTS.md)에서 Vector DB 테스트 확인

---

## 📊 문서 통계

- **총 문서**: 16개
  - **README**: 3개 (한/영/중)
  - **Architecture**: 3개
  - **Guides**: 4개
  - **Testing**: 4개
  - **Development**: 5개

---

## 🎯 유지 관리

이 문서는 DeBHuB 개발팀이 관리합니다.

**마지막 업데이트**: 2025-10-20
**문서 버전**: 2.0
