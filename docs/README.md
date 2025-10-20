# DeBHuB 문서

> **언어**: [English](README.en.md) | [한국어](README.md) | [中文](README.zh.md)

---

## 💡 개요

**DeBHuB**는 세계 최초로 Pure Irys L1 DataChain만으로 동작하는 완전 탈중앙화 Backend-as-a-Service 플랫폼입니다.

**Zero Backend. Zero Database. Pure Blockchain.**

전통적인 백엔드 서버와 데이터베이스 없이, 오직 블록체인 스마트 컨트랙트와 영구 저장소만으로 모든 백엔드 기능을 제공합니다.

---

## 🏗️ 아키텍처

```
Frontend (React + Vite)
    ↓ Direct RPC Connection
Irys L1 DataChain (Chain ID: 1270)
    ├─ Smart Contracts Layer (6개 컨트랙트)
    │  ├─ DocumentRegistry    - 문서 등록 및 관리
    │  ├─ AccessControl        - 권한 및 접근 제어
    │  ├─ ProvenanceChain      - 데이터 출처 추적
    │  ├─ EventBus             - 이벤트 발행/구독
    │  ├─ CacheController      - 캐시 무효화 제어
    │  └─ SearchIndex          - 검색 인덱스 관리
    └─ Permanent Storage (Irys Native)
        └─ 불변 데이터 영구 저장
```

### 기술 스택
- **Frontend**: React 18, Vite 5, TypeScript 5, TailwindCSS
- **Blockchain**: Irys L1 DataChain, ethers.js v6, wagmi v2
- **Caching**: IndexedDB (idb v8.0.0)
- **Storage**: Irys Native Permanent Storage

---

## 🔄 유저 플로우

### 1. 지갑 연결 및 네트워크 설정
```
사용자 앱 접속
    ↓
IrysVM 네트워크 자동 감지
    ↓
[다른 네트워크 사용 중?]
    ├─ YES → 자동 전환 프롬프트 (2초 후 자동 전환)
    └─ NO → 지갑 연결 요청
        ↓
    MetaMask/WalletConnect 연결
        ↓
    대시보드 진입
```

### 2. 문서 작성 플로우
```
문서 작성 시작
    ↓
1. IndexedDB 캐시 확인 (5분 TTL)
    ├─ 캐시 있음 → 즉시 로드
    └─ 캐시 없음 → 블록체인 조회
        ↓
2. 문서 내용 입력
    ↓
3. DocumentRegistry.registerDocument() 호출
    ↓
4. 트랜잭션 서명 (사용자)
    ↓
5. 블록체인에 영구 저장
    ↓
6. EventBus에서 DocumentCreated 이벤트 발행
    ↓
7. SearchIndex 자동 업데이트
    ↓
8. IndexedDB 캐시 갱신
    ↓
문서 등록 완료
```

### 3. 문서 조회 플로우
```
문서 조회 요청
    ↓
1. IndexedDB 캐시 확인
    ├─ 캐시 유효 (< 5분) → 캐시에서 반환
    └─ 캐시 만료/없음
        ↓
2. DocumentRegistry.getDocument() RPC 호출
    ↓
3. 블록체인에서 데이터 조회
    ↓
4. AccessControl 권한 검증
    ↓
5. 데이터 반환 및 IndexedDB 캐싱
    ↓
문서 표시
```

### 4. 권한 관리 플로우
```
권한 설정 요청
    ↓
1. AccessControl.grantAccess() 호출
    ↓
2. 소유자 검증
    ↓
3. 권한 레벨 설정 (READ/WRITE/ADMIN)
    ↓
4. 트랜잭션 서명
    ↓
5. 권한 정보 블록체인 저장
    ↓
6. EventBus에서 AccessGranted 이벤트 발행
    ↓
7. CacheController를 통해 관련 캐시 무효화
    ↓
권한 설정 완료
```

---

## 📊 시스템 플로우 차트

### 전체 데이터 흐름
```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 (User)                          │
│                    (MetaMask/WalletConnect)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ RPC Call
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                       │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  React UI Layer  │ ←─────→ │  State Manager   │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                             │                     │
│           ↓                             ↓                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ ethers.js Client │         │  IndexedDB Cache │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
            │ Direct RPC                  │ 5min TTL
            ↓                             ↓
┌─────────────────────────────────────────────────────────────┐
│              Irys L1 DataChain (Chain ID: 1270)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Smart Contracts Layer (6 Contracts)          │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Document    │  │   Access     │  │ Provenance  │ │ │
│  │  │  Registry    │  │   Control    │  │   Chain     │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │ │
│  │         │                  │                  │        │ │
│  │         └──────────────────┼──────────────────┘        │ │
│  │                            ↓                           │ │
│  │         ┌──────────────────────────────────┐          │ │
│  │         │          Event Bus               │          │ │
│  │         │    (Publish/Subscribe)           │          │ │
│  │         └──────────┬───────────────────────┘          │ │
│  │                    │                                   │ │
│  │         ┌──────────┴───────────┐                      │ │
│  │         ↓                      ↓                      │ │
│  │  ┌──────────────┐      ┌──────────────┐             │ │
│  │  │    Cache     │      │    Search    │             │ │
│  │  │  Controller  │      │    Index     │             │ │
│  │  └──────────────┘      └──────────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Irys Native Permanent Storage                │ │
│  │              (Immutable Data Layer)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 스마트 컨트랙트 상호작용
```
DocumentRegistry ←→ AccessControl
        ↓                  ↓
        └────→ EventBus ←──┘
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
  CacheController    SearchIndex
        ↓                   ↓
   ProvenanceChain ←────────┘
```

---

## ✨ 핵심 기능

### 완전 탈중앙화
- 백엔드 서버 불필요
- 데이터베이스 불필요
- 모든 로직이 스마트 컨트랙트로 구현
- 클라이언트에서 블록체인으로 직접 RPC 호출

### 스마트 컨트랙트 기반 데이터 관리
- 6개의 Solidity 컨트랙트로 모든 백엔드 기능 제공
- 문서 등록, 권한 관리, 출처 추적, 이벤트 처리
- 블록체인에서 직접 실행되는 프로그래머블 데이터 로직

### 영구 저장
- Irys L1의 네이티브 영구 저장소 활용
- 불변성이 보장되는 데이터 저장
- 데이터 소유권이 사용자에게 완전히 귀속

### 고성능 캐싱
- IndexedDB 클라이언트 사이드 캐싱
- 5분 TTL로 빠른 데이터 접근
- 네트워크 부하 최소화

### 자동 네트워크 전환
- IrysVM 네트워크 자동 감지
- 다른 네트워크 사용 시 자동 전환 프롬프트
- 원활한 사용자 경험 제공

---

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **토론**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)

---

<div align="center">

**Made with ❤️ by DeBHuB Team**

**마지막 업데이트**: 2025-10-20

</div>
