# 物理化学 802 刷题站

南京工业大学 802 物理化学刷题与复习网站。第一阶段（2003–2011）已完成内容终审并冻结。

## 最快测试：GitHub Pages

这个 GitHub 上传版已经把本次验证过的静态站点放在 `docs/`，并附带 Pages 部署工作流，因此第一次上线测试**不需要 GitHub 重新安装前端依赖或重新构建**。

1. 新建 GitHub 仓库，并把本目录中的全部文件提交到 `main` 分支。
2. 进入仓库 `Settings -> Pages`。
3. 在 `Build and deployment` 中选择 **GitHub Actions**。
4. 打开 `Actions`，等待 `Deploy verified site to GitHub Pages` 成功。
5. 回到 `Settings -> Pages`，打开生成的网站地址进行测试。

网站使用 `HashRouter` 和相对资源路径，可部署在 GitHub Pages 的仓库子路径下。

## 源码本地运行

建议 Node.js 22。

```bash
npm ci
npm run dev
```

开发服务器默认端口：`3000`。

## 重新生成生产站点

源码修改后可运行：

```bash
npm ci
npm run build
```

构建结果位于 `dist/`。确认新构建版本无误后，可用新的 `dist/` 内容替换仓库中的 `docs/` 再推送。

## 当前内容

- 2026 考纲九模块知识体系
- 2003–2023 历年题库数据
- 第一阶段 2003–2011：284 道真题
- 第一阶段答案、解析和知识点映射完整
- KaTeX 数学公式
- 学习进度、错题和分析功能

## 仓库清理说明

GitHub 上传版已排除原项目中的：

- `node_modules/`
- `dist/`（改由 `docs/` 保存本次已验证的静态站）
- 原 `.git/`
- `_backup/`
- `_temp/`
- 审计临时目录和中间缓存

源码依赖以 `package-lock.json` 为准。
