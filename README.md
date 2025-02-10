# AI-Debate

AI大乱斗 - 一个基于大语言模型的智能辩论平台

## 项目概述

AI-Debate 是一个创新的智能辩论平台，通过整合多个大语言模型，为用户提供丰富的辩论体验。系统支持自定义AI角色、灵活的辩论规则配置，以及多样化的模型接入方式。
已经能够想到的场景：
1. 辩论赛模拟
2. 狼人杀
3. 剧本杀
4. 谁是卧底
5. 故事续写
6. 村妇骂架
7. 角色扮演
8. 架空整活




## 最新更新 (2024-03-15)

### 新增功能
1. 存储管理系统
   - 实现基于 LocalStorage 和 IndexedDB 的混合存储系统
   - 添加数据验证层，使用 Zod 进行类型验证
   - 实现数据备份和恢复功能
   - 添加版本控制和数据迁移支持

2. 模型配置管理
   - 支持多种模型供应商（OpenAI、Anthropic、Deepseek等）
   - 实现模型配置的CRUD操作
   - 支持配置导入导出功能
   - 添加模型连接测试功能

3. AI角色配置
   - 实现角色基本信息配置
   - 支持本地上传和URL两种头像配置方式
   - 实现完整的人设配置系统
   - 添加角色模板管理功能

### 技术改进
- 添加完整的类型验证系统
- 实现数据持久化存储
- 优化状态管理逻辑
- 增强错误处理机制

## 功能特性

- 🤖 多模型支持：集成多个主流大语言模型
- 🎭 角色定制：支持自定义AI角色的性格、说话风格等特征
- 📋 规则配置：灵活的辩论规则和评分标准设置
- 💾 本地存储：完整的数据持久化解决方案
- 🔄 模板系统：支持角色模板和规则模板
- 🌓 暗色主题：支持浅色/深色主题切换

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

### 构建生产版本
```bash
npm run build
```

## 技术栈

- 前端框架：React + TypeScript
- UI组件：Ant Design
- 状态管理：React Context + Hooks
- 数据存储：LocalStorage + IndexedDB
- 类型验证：Zod
- 样式方案：Emotion + CSS Modules

## 项目结构

```
src/
├── modules/           # 功能模块
│   ├── ai-model/     # AI模型集成
│   ├── character/    # 角色管理
│   ├── game/        # 游戏逻辑
│   ├── model/       # 模型管理
│   └── storage/     # 存储管理
├── styles/           # 全局样式
├── utils/           # 工具函数
└── App.tsx          # 应用入口
```

## 开发指南

详细的开发文档请参考：
- [角色配置指南](docs/character_config_guide.md)
- [存储设计文档](docs/storage_and_config_design.md)
- [开发任务列表](docs/development_tasks.md)

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情 