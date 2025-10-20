# DeBHuB 동기화 가이드

> **언어**: [English](SYNC_GUIDE.en.md) | [한국어](SYNC_GUIDE.md) | [中文](SYNC_GUIDE.zh.md)

## 레포지토리 구조

이 레포지토리는 **이중 remote** 구조를 사용합니다:
- **private**: 개발 레포지토리 (DeBHuB-private)
- **public**: Vercel 배포용 프로덕션 레포지토리 (DeBHuB-public)

## 일상 워크플로우

### 1. 개발 작업 (Private만)
```bash
# 기능 개발
git add .
git commit -m "feat: 새로운 기능"
git push private master
```

### 2. 프로덕션 배포 (Private + Public)
```bash
# 양쪽 레포지토리에 push
git push private master
git push public master:main
```

**참고**: 퍼블릭 레포지토리는 `main` 브랜치를 기본으로 사용합니다.

## Remote URL

```bash
# Remote 확인
git remote -v

# 출력:
# private   https://github.com/0xarkstar/DeBHuB-private.git
# public    https://github.com/0xarkstar/DeBHuB-public.git
```

## 중요 사항

⚠️ **퍼블릭에 push하기 전:**
- 민감한 파일이 없는지 확인 (.env, API 키 등)
- .gitignore가 이미 다음 항목들을 제외하도록 설정되어 있습니다:
  - `.env*` 파일들
  - `.claude/` 디렉토리
  - `node_modules/`
  - 빌드 산출물

✅ **안전하게 push 가능:**
- 모든 소스 코드
- 문서
- 설정 예시 파일 (.env.example)
- 패키지 파일 (package.json 등)

## Vercel 배포

Vercel은 **public** 레포지토리에 연결되어 있습니다:
- `public/main`에 push하면 자동 배포
- Framework: Vite
- Root Directory: `apps/web-vite`

## 빠른 명령어

```bash
# 프라이빗에만 push (개발)
git push private master

# 양쪽에 push (배포)
git push private master && git push public master:main

# Remote 상태 확인
git ls-remote private
git ls-remote public
```
