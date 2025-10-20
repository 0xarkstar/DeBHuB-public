# DeBHuB 문서

> **언어**: [English](README.en.md) | [한국어](README.md) | [中文](README.zh.md)

---

## 🚀 시작하기

### 1. 설치

```bash
git clone https://github.com/0xarkstar/DeBHuB.git
cd DeBHuB
pnpm install
```

### 2. 환경 변수 설정

```bash
cd apps/web-vite
cp .env.example .env
```

`.env` 파일에서 다음을 설정하세요:
```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

**접속**: http://localhost:5173

---

## 🎯 핵심 개념

### IrysVM Testnet
- **Chain ID**: 1270
- **RPC URL**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **Native Token**: IRYS
- **Block Explorer**: https://explorer.irys.xyz

### 메타마스크 네트워크 추가

1. 메타마스크 열기
2. 네트워크 추가 클릭
3. 다음 정보 입력:
   - Network Name: `IrysVM Testnet`
   - RPC URL: `https://testnet-rpc.irys.xyz/v1/execution-rpc`
   - Chain ID: `1270`
   - Currency Symbol: `IRYS`

### 테스트 토큰 받기

Irys Faucet: https://irys.xyz/faucet

---

## 💡 주요 기능

### 자동 네트워크 전환
- 앱 접속 시 자동으로 IrysVM 네트워크 감지
- 다른 네트워크일 경우 자동 전환 프롬프트
- 2초 후 자동으로 네트워크 전환

### 완전 탈중앙화
- 백엔드 서버 불필요
- 데이터베이스 불필요
- 모든 데이터는 IrysVM 블록체인에 저장

---

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/0xarkstar/DeBHuB/issues)
- **토론**: [GitHub Discussions](https://github.com/0xarkstar/DeBHuB/discussions)

---

**마지막 업데이트**: 2025-10-20
