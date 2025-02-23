# AI-Debate (AI大乱斗)

[English](README.md) | [简体中文](README.zh-CN.md)

🤖 一个革新性的AI辩论平台，让人机对话焕发新的活力

## 项目亮点

- 🎭 **智能角色系统**：支持自定义AI角色，包括性格特征、辩论风格和专业背景
- 🎯 **实时评分系统**：基于多维度的智能评分，提供详细的表现分析和建议
- 🔄 **灵活的辩论流程**：支持多轮辩论、自由辩论等多种模式
- 🎨 **精美的用户界面**：基于Ant Design的现代化界面设计
- 🛠 **可扩展的模型接入**：支持多种AI模型，包括OpenAI、Deepseek、Ollama等
- 💾 **本地数据存储**：完整的数据持久化方案，保护用户隐私

## 核心功能

### 1. 智能评分系统
- 多维度评分标准
- 实时评分反馈
- 详细的评语生成
- 历史成绩追踪

### 2. 角色管理
- 自定义AI角色配置
- 角色模板系统
- 个性化对话风格
- 专业领域设定

### 3. 辩论流程控制
- 多轮辩论支持
- 灵活的时间控制
- 动态角色切换
- 实时状态同步

### 4. 数据管理
- 本地数据存储
- 配置导入导出
- 历史记录回放
- 数据备份恢复

## 技术栈

- ⚛️ **前端框架**：React 18 + TypeScript
- 🎨 **UI组件**：Ant Design
- 🧠 **状态管理**：React Context + Hooks
- 💾 **数据存储**：LocalStorage + IndexedDB
- 🔍 **类型检查**：Zod
- 💅 **样式方案**：Emotion + CSS Modules

## 快速开始

### 安装
```bash
npm install
```

### 开发
```bash
npm start
```

### 构建
```bash
npm run build
```

## 项目结构

```
src/
├── components/       # UI组件
│   ├── debate/      # 辩论相关组件
│   └── shared/      # 通用组件
├── modules/         # 核心模块
│   ├── debate-flow/ # 辩论流程控制
│   ├── scoring/     # 评分系统
│   └── character/   # 角色管理
├── pages/          # 页面组件
├── hooks/          # 自定义Hooks
└── utils/          # 工具函数
```

## 开发计划

### 即将推出
- [ ] 多人在线辩论支持
- [ ] AI观众互动系统
- [ ] 辩论数据分析dashboard
- [ ] 更多AI模型集成
- [ ] 移动端适配优化

## 参与贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

📫 问题反馈: 如果您有任何问题或建议，欢迎提交 Issue 