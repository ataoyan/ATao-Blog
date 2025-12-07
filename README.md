# T-Blog

一个基于 Astro 框架的简约个人博客主题。简单干净，专注于内容展示。

## 🛠️ 技术栈

- [Astro](https://astro.build/) - 静态站点生成器
- [React](https://react.dev/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Lucide React](https://lucide.dev/) - 图标库
- [Twikoo](https://twikoo.js.org/) - 评论系统

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:4321](http://localhost:4321) 查看网站。

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist/` 目录。

### 预览构建结果

```bash
npm run preview
```

### 快速创建文章

使用命令行工具快速创建新文章模板：

```bash
npm run new
```

脚本会提示你输入：
- 文章标题（必填）
- 发布日期（可选，格式：YYYY-MM-DD，默认使用今天）

文章会自动创建到对应年月的文件夹中（如 `src/content/blog/2025/12/`），并生成包含基本 frontmatter 的模板文件。

## 📝 添加文章

在 `src/content/blog/` 目录下创建新的 Markdown 文件。文件需要包含以下 frontmatter：

```markdown
---
title: '文章标题'
summary: '文章摘要'
date: '2023年10月24日'
tags: ['标签1', '标签2']
---

文章内容...
```

## 📁 项目结构

```
t-blog/
├── public/              # 静态资源
│   ├── favicon.svg     # 网站图标
│   └── 404/            # 404 页面图片
├── src/
│   ├── components/     # React 组件
│   │   ├── AuthorCard.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── PostCard.tsx
│   │   └── ...
│   ├── content/        # Markdown 文章
│   │   └── blog/      # 博客文章目录
│   ├── layouts/        # 页面布局
│   │   └── BaseLayout.astro
│   ├── pages/          # 页面路由
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── archive.astro
│   │   ├── link.astro
│   │   └── posts/
│   ├── scripts/        # 客户端脚本
│   ├── styles/         # 全局样式
│   ├── utils/          # 工具函数
│   ├── config.ts       # 配置文件
│   └── friends.ts      # 友链配置
├── astro.config.mjs    # Astro 配置
├── tailwind.config.mjs # Tailwind 配置
└── package.json
```

## ⚙️ 配置说明

### 基础配置

编辑 `src/config.ts` 文件进行配置：

- **BLOG_NAME** - 博客名称
- **SITE_DESCRIPTION** - 网站描述
- **AUTHOR_PROFILE** - 作者信息（头像、社交链接、技能等）
- **NAVBAR** - 导航栏配置
- **HOME_PAGE** - 首页配置
- **FEATURES** - 功能开关
- **TWIKOO** - 评论系统配置
- **ICP_INFO** - 备案信息

### 友链配置

编辑 `src/friends.ts` 文件添加友链：

```typescript
{
    name: "友链名称",
    description: "友链描述",
    url: "https://example.com",
    avatar: "https://example.com/avatar.png",
    addDate: "2023-10-24",
    recommended: true  // 可选，是否推荐
}
```

## 🎨 自定义主题

### 修改颜色

编辑 `tailwind.config.mjs` 文件中的颜色配置，或修改 `src/config.ts` 中的 `THEME_COLORS`。

### 修改字体

编辑 `tailwind.config.mjs` 文件中的字体配置。

## 📦 部署

### Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动部署完成

### Netlify

1. 将代码推送到 GitHub
2. 在 [Netlify](https://netlify.com) 导入项目
3. 构建命令：`npm run build`
4. 发布目录：`dist`

### 其他平台

构建后的 `dist/` 目录可以部署到任何静态网站托管服务。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

Copyright (c) 2025 T-Blog

## 🙏 致谢

- [Astro](https://astro.build/) - 优秀的静态站点生成器
- [Tailwind CSS](https://tailwindcss.com/) - 强大的 CSS 框架
- [Lucide](https://lucide.dev/) - 精美的图标库

---

⭐ 如果这个项目对你有帮助，请给个 Star！
