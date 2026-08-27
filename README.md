# Yuang Cao · 曹宇昂 — 个人主页（GitHub Pages）

公开学术主页：AI × 认知科学 × 生物医学工程。
部署地址：`https://anmicky.github.io/`

本仓库**只包含公开内容**（无私人信息）。私有员工通道（全量科研树/申请面板）托管在阿里云，不在此仓库。

## 更新流程

```bash
cd ~/personal_work/website-github
./deploy_github.sh "更新说明"     # 从 ~/personal_work/website 同步公开文件并推送
```

## 结构

- `index.html` — 公开页（中英双语）
- `assets/` — 样式/脚本/字体（全本地，无 CDN）
- `tree_public.json` — 公开科研树数据（脱敏）
- `paper/` — 论文 PDF（CogSci 2025，来源：本地个人主档案）
- `.nojekyll` — 禁用 Jekyll 处理
