# 🚀 Public Release Guide

DeBHuB 프로젝트를 퍼블릭 레포지토리로 안전하게 전환하는 가이드입니다.

---

## ✅ 완료된 보안 작업

### 1. 환경변수 보안
- [x] `.env` 파일 전체 삭제 (Git 추적 제거)
- [x] `.env.example` 템플릿 작성 및 업데이트
  - `apps/api/.env.example` - 백엔드 환경변수 템플릿
  - `apps/web-vite/.env.example` - 프론트엔드 환경변수 템플릿
  - `packages/contracts/.env.example` - 스마트 컨트랙트 배포용 템플릿

### 2. .gitignore 강화
- [x] `.env` 파일 패턴 차단
- [x] Private key 패턴 추가 (`*.key`, `*.pem`, `mnemonic.txt` 등)
- [x] 민감한 설정 파일 패턴 추가 (`*-secret.json`, `credentials/` 등)
- [x] `.env.example` 파일만 명시적으로 허용

### 3. Git 히스토리 검증
- [x] Private Key 히스토리 검색 - ✅ 안전 (발견되지 않음)
- [x] API Key 히스토리 검색 - ✅ 안전 (발견되지 않음)
- [x] Database URL 히스토리 검색 - ✅ 안전 (.env.example만 존재)

### 4. 코드 보안 검증
- [x] 하드코딩된 시크릿 검색 - ✅ 안전 (모두 `process.env` 사용)
- [x] Prisma 스키마 확인 - ✅ 안전 (민감 정보 없음)
- [x] 스마트 컨트랙트 설정 확인 - ✅ 안전 (환경변수 사용)

### 5. 문서화
- [x] README.md 업데이트 (환경변수 설정 가이드 추가)
- [x] SECURITY.md 작성 (보안 정책 및 베스트 프랙티스)
- [x] LICENSE 업데이트 (2025년으로 갱신)
- [x] PUBLIC_RELEASE_GUIDE.md 작성 (이 문서)

---

## 📋 퍼블릭 전환 체크리스트

### 변경사항 커밋 전 최종 확인

```bash
# 1. 민감한 파일이 없는지 확인
find . -name ".env" -o -name ".env.local" | grep -v node_modules
# 출력 없어야 정상 ✅

# 2. .env 파일이 Git에 추적되지 않는지 확인
git ls-files | grep "\.env$"
# 출력 없어야 정상 ✅

# 3. 변경사항 확인
git status
git diff

# 4. .gitignore가 제대로 작동하는지 테스트
echo "TEST_KEY=secret" > test.env
git status | grep "test.env"
# Untracked files에 나타나지 않아야 정상 ✅
rm test.env
```

### 커밋 및 푸시

```bash
# 1. 변경사항 스테이징
git add .gitignore
git add LICENSE
git add README.md
git add SECURITY.md
git add PUBLIC_RELEASE_GUIDE.md
git add apps/api/.env.example
git add apps/web-vite/.env.example
git add packages/contracts/.env.example

# 2. 커밋
git commit -m "chore: Prepare for public release

- Update .gitignore with comprehensive security patterns
- Create detailed .env.example templates for all components
- Add SECURITY.md with security best practices
- Update README.md with environment setup guide
- Update LICENSE to 2025
- Add PUBLIC_RELEASE_GUIDE.md

Security improvements:
- Remove all .env files from repository
- Add Private Key protection patterns
- Add sensitive file patterns
- Explicitly allow .env.example files
- Verify no secrets in Git history"

# 3. 푸시 (현재는 private이므로 안전)
git push origin master
```

### GitHub에서 퍼블릭으로 전환

1. **GitHub 레포지토리 설정으로 이동**
   ```
   https://github.com/your-org/debhub/settings
   ```

2. **Danger Zone으로 스크롤**
   - "Change repository visibility" 섹션 찾기

3. **"Change visibility" 클릭**
   - "Make public" 선택
   - 레포지토리 이름 입력하여 확인

4. **최종 확인 사항**
   - [ ] README.md가 제대로 보이는가?
   - [ ] SECURITY.md가 보이는가?
   - [ ] LICENSE가 보이는가?
   - [ ] .env 파일들이 보이지 않는가?
   - [ ] .env.example 파일들이 보이는가?

---

## 🔀 Repository Split 옵션

현재는 모노레포로 공개하는 것을 권장하지만, 분리가 필요하다면:

### 옵션 A: 모노레포 유지 (권장)

**장점:**
- ✅ 전체 아키텍처 공유 가능
- ✅ Turborepo + pnpm workspace 베스트 프랙티스
- ✅ 공유 패키지 재사용
- ✅ 단일 이슈/PR 관리

**단점:**
- 레포지토리 크기가 큼
- 사용자가 불필요한 코드도 클론

**현재 구조:**
```
debhub/
├── apps/
│   ├── api/           # Backend (GraphQL API)
│   └── web-vite/      # Frontend (React + Vite)
├── packages/
│   ├── contracts/     # Smart Contracts
│   ├── shared/        # 공유 타입/유틸
│   └── ...
```

### 옵션 B: Frontend + Backend 분리

**Frontend Repository: `debhub-frontend`**
```bash
# 새 레포지토리 생성
git clone --no-hardlinks debhub debhub-frontend
cd debhub-frontend

# Frontend만 유지
git filter-repo --path apps/web-vite --path packages/contracts --path packages/shared

# 리네임
mv apps/web-vite/* .
rm -rf apps packages

# 새 원격 추가
git remote add origin https://github.com/your-org/debhub-frontend.git
git push -u origin master
```

**Backend Repository: `debhub-backend`**
```bash
# 새 레포지토리 생성
git clone --no-hardlinks debhub debhub-backend
cd debhub-backend

# Backend만 유지
git filter-repo --path apps/api --path packages/shared

# 리네임
mv apps/api/* .
rm -rf apps packages

# 새 원격 추가
git remote add origin https://github.com/your-org/debhub-backend.git
git push -u origin master
```

---

## 🎯 추천 전략: 모노레포 유지

DeBHuB는 다음 이유로 **모노레포 공개**를 권장합니다:

1. **듀얼 아키텍처 지원**
   - Frontend-only (Serverless)
   - Full-stack (Backend + Frontend)

2. **교육적 가치**
   - 전체 시스템 구조 학습 가능
   - 패키지 관리 베스트 프랙티스

3. **개발 편의성**
   - 단일 레포지토리 관리
   - 공유 타입/유틸리티

---

## 📊 공개 후 할 일

### 즉시

- [ ] GitHub Repository 설명 업데이트
- [ ] Topics/Tags 추가 (typescript, blockchain, irys, web3, documentation)
- [ ] README.md 뱃지 URL 업데이트
- [ ] About 섹션 작성

### 단기 (1주일 내)

- [ ] CONTRIBUTING.md 작성
- [ ] Issue Templates 추가
- [ ] PR Template 추가
- [ ] GitHub Actions CI/CD 설정
- [ ] Vercel/Netlify 배포

### 중기 (1개월 내)

- [ ] 데모 사이트 배포
- [ ] 비디오 튜토리얼 제작
- [ ] 블로그 포스트 작성
- [ ] SNS 공유 (Twitter, Reddit, Dev.to)
- [ ] Irys 커뮤니티에 공유

---

## 🔒 보안 모니터링

공개 후 지속적인 보안 관리:

### GitHub Security Features 활성화

1. **Dependabot**
   - Settings → Security → Dependabot alerts 활성화
   - Dependabot security updates 활성화

2. **Code Scanning**
   - Settings → Security → Code scanning 활성화
   - CodeQL analysis 설정

3. **Secret Scanning**
   - Settings → Security → Secret scanning 활성화
   - Push protection 활성화

### 정기 보안 점검

```bash
# 매주 실행
pnpm audit
pnpm update

# Git 히스토리 재검사 (선택사항)
git log --all --full-history -p -S "PRIVATE_KEY"
git log --all --full-history -p -S "0x[a-f0-9]{64}"
```

---

## 📞 문제 발생 시

### 실수로 민감 정보를 커밋한 경우

```bash
# ⚠️ IMMEDIATE ACTION REQUIRED

# 1. 즉시 Private으로 전환 (GitHub Settings)

# 2. Git 히스토리에서 제거
git filter-repo --path apps/api/.env --invert-paths
# 또는
bfg --delete-files .env

# 3. Force push
git push --force

# 4. 민감 정보 교체
# - Private Key 재생성
# - API Key 무효화 및 재발급
# - 데이터베이스 비밀번호 변경

# 5. 안전 확인 후 다시 Public으로 전환
```

### 커뮤니티 신고

누군가 fork한 레포지토리에서 민감 정보를 발견한 경우:
1. GitHub에 DMCA Takedown 요청
2. 관련 서비스 (Irys, WalletConnect) 키 무효화
3. 영향 범위 분석 및 대응

---

## ✅ 준비 완료!

모든 보안 조치가 완료되었습니다. 이제 안전하게 퍼블릭으로 전환할 수 있습니다!

### 최종 체크

- [x] .env 파일 모두 제거
- [x] .env.example 템플릿 작성
- [x] .gitignore 강화
- [x] Git 히스토리 검증
- [x] 문서 업데이트 (README, SECURITY)
- [x] LICENSE 확인

**준비되셨다면 위의 "퍼블릭 전환 체크리스트"를 따라 진행하세요!**

---

**Questions?** SECURITY.md를 참고하거나 이슈를 등록해주세요.

**Good luck with your public release! 🎉**
