# AI辩论系统

这是一个基于React和TypeScript的AI辩论系统，支持实时辩论、观众互动等功能。

## 功能特点

- 支持多人实时辩论
- 辩论内容实时展示
- 观众互动聊天
- 辩手得分统计
- 暗黑模式支持

## 开始使用

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm start
```

3. 构建生产版本：

```bash
npm run build
```

## 技术栈

- React 18
- TypeScript
- Emotion (CSS-in-JS)
- React Router
- ESLint + Prettier

## 项目结构

```
src/
  ├── components/     # 组件
  │   ├── common/    # 通用组件
  │   └── debate/    # 辩论相关组件
  ├── pages/         # 页面
  ├── styles/        # 样式
  ├── routes/        # 路由
  └── App.tsx        # 根组件
```

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

MIT License

## 最近更新

### 辩论室布局优化 (2024-03)

#### 新增功能
- 优化了辩论室整体布局，采用响应式网格布局
- 实现了主题和规则容器的展开/收起功能
- 新增了主题切换按钮（明/暗模式）

#### 界面改进
1. 辩论主题区域
   - 重新设计了主题显示布局
   - 添加了轮次信息显示
   - 优化了主题说明的显示方式

2. 规则说明区域
   - 实现了可折叠的规则容器
   - 优化了规则列表的显示效果
   - 添加了规则项的视觉反馈
   - 实现了规则容器的自适应高度

3. 布局响应式
   - 优化了各区域间的间距和对齐
   - 改进了内容溢出时的滚动处理
   - 增强了布局在不同设备上的适配性

#### 技术改进
- 使用 Emotion styled-components 重构了样式代码
- 实现了主题配置的统一管理
- 优化了组件的状态管理和事件处理
- 改进了布局组件的可重用性 