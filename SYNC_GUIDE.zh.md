# DeBHuB 同步指南

> **语言**: [English](SYNC_GUIDE.en.md) | [한국어](SYNC_GUIDE.md) | [中文](SYNC_GUIDE.zh.md)

## 仓库结构

此仓库使用**双 remote** 设置:
- **private**: 开发仓库 (DeBHuB-private)
- **public**: Vercel 部署的生产仓库 (DeBHuB-public)

## 日常工作流程

### 1. 开发 (仅 Private)
```bash
# 功能开发
git add .
git commit -m "feat: 你的功能"
git push private master
```

### 2. 发布到生产环境 (Private + Public)
```bash
# 推送到两个仓库
git push private master
git push public master:main
```

**注意**: 公共仓库使用 `main` 分支作为默认分支。

## Remote URL

```bash
# 查看 remotes
git remote -v

# 输出:
# private   https://github.com/0xarkstar/DeBHuB-private.git
# public    https://github.com/0xarkstar/DeBHuB-public.git
```

## 重要说明

⚠️ **推送到公共仓库之前:**
- 确保没有敏感文件 (.env, API 密钥等)
- .gitignore 已配置为排除:
  - `.env*` 文件
  - `.claude/` 目录
  - `node_modules/`
  - 构建产物

✅ **可安全推送:**
- 所有源代码
- 文档
- 配置示例 (.env.example)
- 包文件 (package.json 等)

## Vercel 部署

Vercel 连接到 **public** 仓库:
- 推送到 `public/main` 时自动部署
- Framework: Vite
- Root Directory: `apps/web-vite`

## 快速命令

```bash
# 仅推送到私有仓库 (开发)
git push private master

# 推送到两者 (发布)
git push private master && git push public master:main

# 检查 remote 状态
git ls-remote private
git ls-remote public
```
