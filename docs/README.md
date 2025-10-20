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
