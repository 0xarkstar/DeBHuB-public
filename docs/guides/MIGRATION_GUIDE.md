# 🔄 Clean Repository Migration Guide

Private 레포지토리를 Public으로 전환하는 대신, **깨끗한 히스토리로 새 Public 레포지토리**를 생성하는 가이드입니다.

---

## 🎯 목표

- ✅ Private 레포지토리는 그대로 유지 (개발 히스토리 보존)
- ✅ 새로운 Public 레포지토리 생성 (깨끗한 히스토리)
- ✅ 최신 코드만 포함 (민감 정보 완전 제거)
- ✅ Git 히스토리 없이 시작 (단일 initial commit)

---

## 📊 Git 히스토리 분석 결과

### 검사 항목
```bash
총 커밋 수: 46개
검사 기간: 프로젝트 시작 ~ 현재

검색 패턴:
✅ Private Keys (0x[a-f0-9]{64})
✅ API Keys (api_key, apikey, token)
✅ Database URLs (postgresql://...@...)
✅ 환경변수 파일 (.env)
```

### 결과
```
✅ 실제 시크릿 발견: 없음
⚠️  .env.example 플레이스홀더: 있음 (안전함)
⚠️  테스트용 주소: 있음 (0x123..., 0x456... - 안전함)
⚠️  예제 DB URL: username:password@localhost (안전함)

결론: 히스토리는 안전하지만, 100% 확신을 위해 새 레포지토리 권장
```

---

## 🚀 마이그레이션 전략 (3가지 옵션)

### ✅ **옵션 1: 새 레포지토리 + 단일 커밋 (강력 추천)**

**장점:**
- ✅ 완전히 깨끗한 히스토리
- ✅ Git 히스토리 걱정 제로
- ✅ 가장 빠르고 안전
- ✅ Private 레포는 그대로 유지

**단점:**
- 커밋 히스토리 없음 (하지만 Public 용이라면 문제없음)

**절차:**
```bash
# 1. 현재 디렉토리를 백업용 폴더로 복사
cd C:\Users\user
cp -r debhub debhub-backup

# 2. 새 디렉토리 생성
mkdir debhub-public
cd debhub-public

# 3. 최신 코드만 복사 (Git 히스토리 제외)
cp -r ../debhub/* .
cp ../debhub/.gitignore .

# 4. .git 폴더 삭제 (히스토리 제거)
rm -rf .git

# 5. Git 초기화 (새로운 시작)
git init
git branch -M main

# 6. .env 파일들 삭제 확인
find . -name ".env" -o -name ".env.local" | grep -v node_modules
# 출력 없어야 함

# 7. 첫 커밋
git add .
git commit -m "feat: Initial public release

DeBHuB - Serverless Documentation Platform with Permanent Blockchain Storage

Features:
- ✅ Frontend-only mode (fully decentralized)
- ✅ Full-stack mode with GraphQL API
- ✅ Irys DataChain integration
- ✅ Smart contract deployment tools
- ✅ Comprehensive documentation

Tech Stack:
- React 18 + Vite 5
- TypeScript 5
- TailwindCSS + Radix UI
- Irys Upload/Query SDK
- Turborepo monorepo

🚀 Ready for deployment on Vercel/Netlify"

# 8. GitHub에 새 Public 레포지토리 생성
# https://github.com/new
# Repository name: debhub
# Visibility: Public
# ⚠️ Do NOT initialize with README/license (우리가 이미 가지고 있음)

# 9. Remote 추가 및 푸시
git remote add origin https://github.com/YOUR_USERNAME/debhub.git
git push -u origin main
```

---

### 옵션 2: Git Filter-Repo로 히스토리 정리

**장점:**
- 커밋 히스토리 일부 보존 가능
- 기여자 정보 유지

**단점:**
- 복잡함
- 실수 가능성 있음
- 추가 도구 필요

**절차:**
```bash
# 1. git-filter-repo 설치
pip install git-filter-repo

# 2. 레포지토리 복사
cd C:\Users\user
git clone debhub debhub-public
cd debhub-public

# 3. .env 파일 히스토리에서 완전 제거
git filter-repo --path apps/web-vite/.env --invert-paths
git filter-repo --path apps/api/.env --invert-paths

# 4. 민감한 커밋 메시지 수정 (선택사항)
git filter-repo --message-callback '
  return message.replace(b"password", b"***")
'

# 5. 새 원격 추가
git remote add origin https://github.com/YOUR_USERNAME/debhub.git
git push -u origin main
```

---

### 옵션 3: 최근 N개 커밋만 유지

**장점:**
- 최근 개발 히스토리 보존
- 간단함

**단점:**
- 여전히 일부 히스토리 포함

**절차:**
```bash
# 1. 레포지토리 복사
cd C:\Users\user
git clone debhub debhub-public
cd debhub-public

# 2. 최근 10개 커밋만 유지
git checkout --orphan temp_branch
git add -A
git commit -m "feat: Public release with recent history"

# 3. 이전 히스토리 삭제
git branch -D main
git branch -m main

# 4. Force push
git remote add origin https://github.com/YOUR_USERNAME/debhub.git
git push -f origin main
```

---

## 🎯 권장: 옵션 1 상세 가이드

### Step 1: 로컬 준비

```powershell
# PowerShell (Windows)

# 1. 백업 생성
cd C:\Users\user
Copy-Item -Path debhub -Destination debhub-backup -Recurse

# 2. 새 Public용 디렉토리
New-Item -ItemType Directory -Path debhub-public
cd debhub-public

# 3. 파일 복사 (Git 제외)
Copy-Item -Path ..\debhub\* -Destination . -Recurse -Exclude .git
Copy-Item -Path ..\debhub\.gitignore -Destination .

# 4. 불필요한 파일 삭제
Remove-Item -Path .\.claude -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .\apps\*\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .\packages\*\node_modules -Recurse -Force -ErrorAction SilentlyContinue

# 5. .env 파일 확인 및 삭제
Get-ChildItem -Path . -Filter ".env*" -Recurse | Where-Object { $_.Name -ne ".env.example" } | Remove-Item -Force
```

### Step 2: Git 초기화

```bash
# Git Bash or PowerShell

# 1. Git 초기화
git init
git branch -M main

# 2. .env 파일이 없는지 최종 확인
git status | grep ".env"
# 출력 없어야 함 (또는 .env.example만 있어야 함)

# 3. 모든 파일 스테이징
git add .

# 4. 첫 커밋
git commit -m "feat: Initial public release

DeBHuB - Serverless Documentation Platform

A fully decentralized documentation platform powered by Irys DataChain.
Build permanent, verifiable, and interactive documentation without backend servers.

## Features
- Frontend-only mode (completely decentralized)
- Full-stack mode with GraphQL API (optional)
- Permanent storage on Irys DataChain
- Wallet-based authentication (MetaMask)
- Version control with cryptographic proofs
- Real-time collaboration

## Tech Stack
Frontend:
- React 18 + Vite 5
- TypeScript 5
- TailwindCSS + Radix UI
- Irys Upload/Query SDK
- ethers.js + wagmi + RainbowKit

Backend (optional):
- Fastify + GraphQL
- Prisma ORM + PostgreSQL
- Redis for caching
- Blockchain event sync

Infrastructure:
- Turborepo monorepo
- pnpm workspaces
- Smart contracts (Solidity)

## Getting Started
See README.md for installation and setup instructions.

## License
MIT License - see LICENSE file

🚀 Ready for public release
🔒 Security reviewed and verified
📚 Comprehensive documentation included"
```

### Step 3: GitHub Public 레포지토리 생성

1. **GitHub 웹사이트 접속**
   ```
   https://github.com/new
   ```

2. **레포지토리 설정**
   - **Repository name**: `debhub`
   - **Description**: `Serverless Documentation Platform with Permanent Blockchain Storage`
   - **Visibility**: ✅ **Public**
   - **Initialize this repository with:**
     - ❌ README (이미 있음)
     - ❌ .gitignore (이미 있음)
     - ❌ License (이미 있음)

3. **Create repository 클릭**

### Step 4: 푸시

```bash
# YOUR_USERNAME을 실제 GitHub username으로 변경
git remote add origin https://github.com/YOUR_USERNAME/debhub.git
git push -u origin main
```

### Step 5: GitHub 설정

1. **About 섹션 설정**
   - Description: `Serverless Documentation Platform with Permanent Blockchain Storage powered by Irys DataChain`
   - Website: (배포 URL)
   - Topics: `typescript`, `blockchain`, `irys`, `web3`, `documentation`, `arweave`, `decentralized`, `react`, `vite`, `turborepo`

2. **Security Features 활성화**
   - Settings → Security
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Code scanning
   - ✅ Secret scanning

3. **README 확인**
   - 메인 페이지에서 README가 잘 보이는지 확인
   - 이미지/링크 정상 작동 확인

---

## 📊 Before vs After 비교

### Private Repository (debhub - 유지)
```
Purpose: 개발 히스토리 보존
Commits: 46개
History: 전체 개발 과정
Visibility: Private
URL: https://github.com/0xarkstar/DeBHuB (Private)
```

### Public Repository (debhub-public → debhub - 새로 생성)
```
Purpose: 오픈소스 공개
Commits: 1개 (Initial release)
History: 깨끗한 시작
Visibility: Public
URL: https://github.com/YOUR_USERNAME/debhub (Public)
```

---

## ✅ 체크리스트

### 마이그레이션 전
- [ ] Private 레포지토리 백업 완료
- [ ] 최신 코드가 main 브랜치에 있음
- [ ] 모든 변경사항이 커밋됨
- [ ] .env 파일이 로컬에만 있음 (Git 추적 안됨)

### 새 레포지토리 생성
- [ ] 파일 복사 완료 (.git 제외)
- [ ] .claude/, node_modules/ 삭제 확인
- [ ] .env, .env.local 삭제 확인
- [ ] .env.example 파일 존재 확인
- [ ] Git 초기화 완료
- [ ] 첫 커밋 완료

### GitHub 설정
- [ ] Public 레포지토리 생성 완료
- [ ] 푸시 완료
- [ ] README 정상 표시
- [ ] About 섹션 설정
- [ ] Topics 추가
- [ ] Security features 활성화

### 최종 검증
- [ ] Public 레포에 .env 파일 없음
- [ ] Public 레포에 민감 정보 없음
- [ ] README 링크 작동
- [ ] LICENSE 파일 존재
- [ ] SECURITY.md 존재

---

## 🔄 동기화 전략 (추후)

Private과 Public 레포지토리 동기화 방법:

### 수동 동기화
```bash
# Private 레포에서 작업 후
cd C:\Users\user\debhub

# 변경사항 커밋
git add .
git commit -m "feat: New feature"
git push origin master

# Public 레포로 복사
cd C:\Users\user\debhub-public
cp -r ../debhub/* .
git add .
git commit -m "feat: New feature (from private repo)"
git push origin main
```

### 자동화 스크립트 (선택사항)
```bash
# sync-to-public.sh
#!/bin/bash
PRIVATE_DIR="../debhub"
PUBLIC_DIR="."

# 변경된 파일만 복사
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='.env.local' --exclude='.claude' $PRIVATE_DIR/ $PUBLIC_DIR/

echo "Files synced. Review changes:"
git status
```

---

## ⚠️ 주의사항

1. **Private 레포는 삭제하지 마세요**
   - 개발 히스토리 보존용
   - 민감한 설정 보관용

2. **Public 레포에는 절대 푸시하지 마세요**
   - .env 파일
   - Private keys
   - Database credentials
   - API keys

3. **정기적인 동기화**
   - Private에서 개발
   - Public으로 선별적 동기화
   - 릴리스 전 Security 검토

---

## 🎉 완료 후

Public 레포지토리가 준비되었습니다!

### 다음 단계
1. **배포**
   - Vercel/Netlify에 Frontend 배포
   - Backend는 Railway/Render/Fly.io

2. **커뮤니티**
   - Twitter, Reddit에 공유
   - Irys Discord에 소개
   - Dev.to 블로그 포스트

3. **Issues & PRs**
   - Issue templates 추가
   - PR template 추가
   - Contributing guidelines

---

**준비되셨나요? 옵션 1을 따라 시작하세요! 🚀**
