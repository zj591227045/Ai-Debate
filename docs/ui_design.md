# AI辩论赛项目 UI设计方案

## 1. 设计系统

### 1.1 色彩系统

#### 主色调
- 主色：#2B4ACF（深蓝色）- 代表专业、理性
- 辅助色：#6B8CFF（浅蓝色）- 用于次要元素
- 强调色：#FF4B6B（珊瑚红）- 用于重要操作和提示

#### 功能色
- 成功：#52C41A
- 警告：#FAAD14
- 错误：#FF4D4F
- 链接：#1890FF

#### 中性色
- 标题文字：#1F1F1F
- 正文文字：#4E4E4E
- 次要文字：#8C8C8C
- 边框线：#E8E8E8
- 分割线：#F0F0F0
- 背景：#F5F5F5

### 1.2 字体系统

#### 字体家族
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
```

#### 字号层级
- 大标题：24px
- 标题：20px
- 小标题：16px
- 正文：14px
- 辅助文字：12px

### 1.3 间距系统
```css
--spacing-unit: 4px;
--spacing-xs: var(--spacing-unit);    /* 4px */
--spacing-sm: calc(2 * var(--spacing-unit));    /* 8px */
--spacing-md: calc(4 * var(--spacing-unit));    /* 16px */
--spacing-lg: calc(6 * var(--spacing-unit));    /* 24px */
--spacing-xl: calc(8 * var(--spacing-unit));    /* 32px */
```

### 1.4 圆角系统
```css
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 8px;
--radius-xl: 16px;
```

### 1.5 阴影系统
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

## 2. 页面布局

### 2.1 辩论室布局
```typescript
interface DebateRoomLayout {
  grid: {
    template: `
      "header header header" 60px
      "players main chat" 1fr
      "control control control" 80px
      / 240px 1fr 300px
    `
  };
  
  regions: {
    header: {
      content: [
        '辩题展示',
        '当前轮次',
        '计时器'
      ],
      style: {
        background: 'var(--color-bg-light)',
        boxShadow: 'var(--shadow-sm)'
      }
    },
    
    players: {
      content: [
        '选手列表',
        '角色信息',
        '得分状态'
      ],
      style: {
        padding: 'var(--spacing-md)',
        borderRight: '1px solid var(--color-border)'
      }
    },
    
    main: {
      content: [
        '发言历史',
        '当前发言',
        '评分反馈'
      ],
      style: {
        padding: 'var(--spacing-lg)',
        background: 'var(--color-bg-white)'
      }
    },
    
    chat: {
      content: [
        '内心OS面板',
        '实时评论'
      ],
      style: {
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-bg-light)'
      }
    },
    
    control: {
      content: [
        '辩论控制按钮',
        '回合操作',
        '设置选项'
      ],
      style: {
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--spacing-md)'
      }
    }
  }
}
```

### 2.2 组件设计

#### 2.2.1 发言气泡
```typescript
interface SpeechBubbleStyle {
  container: {
    background: 'var(--color-bg-white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    padding: 'var(--spacing-md)',
    margin: 'var(--spacing-sm) 0',
    maxWidth: '80%'
  };
  
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 'var(--spacing-sm)',
    gap: 'var(--spacing-sm)'
  };
  
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%'
  };
  
  content: {
    fontSize: 'var(--font-size-md)',
    lineHeight: '1.6',
    color: 'var(--color-text-primary)'
  };
  
  footer: {
    marginTop: 'var(--spacing-sm)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  }
}
```

#### 2.2.2 选手卡片
```typescript
interface PlayerCardStyle {
  container: {
    background: 'var(--color-bg-white)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--spacing-md)',
    border: '1px solid var(--color-border)',
    transition: 'all 0.3s ease'
  };
  
  active: {
    borderColor: 'var(--color-primary)',
    boxShadow: 'var(--shadow-md)'
  };
  
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    marginBottom: 'var(--spacing-sm)'
  };
  
  info: {
    name: {
      fontSize: 'var(--font-size-lg)',
      fontWeight: 'bold',
      marginBottom: 'var(--spacing-xs)'
    },
    role: {
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-secondary)',
      marginBottom: 'var(--spacing-sm)'
    },
    score: {
      fontSize: 'var(--font-size-md)',
      color: 'var(--color-primary)',
      fontWeight: 'bold'
    }
  }
}
```

#### 2.2.3 控制面板
```typescript
interface ControlPanelStyle {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    background: 'var(--color-bg-light)'
  };
  
  button: {
    primary: {
      background: 'var(--color-primary)',
      color: 'white',
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--font-size-md)',
      fontWeight: 'bold'
    },
    secondary: {
      background: 'transparent',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      borderRadius: 'var(--radius-md)'
    }
  }
}
```

## 3. 交互设计

### 3.1 动画效果
```typescript
interface Animations {
  // 页面转场
  pageTransition: {
    type: 'fade-slide',
    duration: '300ms',
    timing: 'ease-in-out'
  };
  
  // 发言气泡出现
  speechBubble: {
    type: 'scale-fade',
    duration: '200ms',
    timing: 'ease-out'
  };
  
  // 选手状态变化
  playerStatus: {
    type: 'pulse',
    duration: '500ms',
    timing: 'ease-in-out'
  };
  
  // 评分展示
  scoreReveal: {
    type: 'slide-up',
    duration: '400ms',
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
```

### 3.2 响应式设计
```typescript
interface ResponsiveBreakpoints {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
}

interface ResponsiveLayout {
  mobile: {
    grid: `
      "header" 60px
      "main" 1fr
      "chat" 300px
      "control" 80px
      / 1fr
    `
  },
  
  tablet: {
    grid: `
      "header header" 60px
      "main chat" 1fr
      "control control" 80px
      / 1fr 300px
    `
  },
  
  desktop: {
    grid: `
      "header header header" 60px
      "players main chat" 1fr
      "control control control" 80px
      / 240px 1fr 300px
    `
  }
}
```

## 4. 可访问性设计

### 4.1 键盘导航
```typescript
interface KeyboardNavigation {
  focusOutline: {
    color: 'var(--color-primary)',
    width: '2px',
    style: 'solid'
  };
  
  tabIndex: {
    mainContent: 0,
    controls: 0,
    playerList: 0,
    chatPanel: 0
  };
  
  shortcuts: {
    'Ctrl + Enter': '发送发言',
    'Esc': '关闭弹窗',
    'Space': '暂停/继续辩论',
    'Tab': '切换焦点'
  }
}
```

### 4.2 色彩对比度
```typescript
interface ColorContrast {
  minimumRatio: 4.5,  // WCAG AA标准
  
  textColors: {
    primary: {
      background: 'white',
      ratio: 12.5
    },
    secondary: {
      background: 'white',
      ratio: 7.5
    }
  }
}
```

## 5. 主题切换

### 5.1 暗色主题
```typescript
interface DarkTheme {
  colors: {
    primary: '#4B6BFF',
    background: '#1F1F1F',
    surface: '#2D2D2D',
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3'
    },
    border: '#404040'
  };
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)'
  }
}
```

## 6. 设计规范

### 6.1 图标系统
- 使用统一的图标库（建议使用Material Icons或Phosphor Icons）
- 保持图标大小一致（建议16px/24px）
- 图标颜色与文字颜色保持一致

### 6.2 交互反馈
- 所有可点击元素都应有hover状态
- 操作按钮应有按下效果
- 重要操作需要确认弹窗
- 操作结果需要轻提示（Toast）

### 6.3 加载状态
- 使用统一的加载动画
- 骨架屏用于内容加载
- 进度条用于长时间操作

### 6.4 错误处理
- 表单错误就近提示
- 网络错误使用全局提示
- 提供错误恢复建议
- 保持友好的错误文案

## 7. 设计资源

### 7.1 设计工具
- Figma用于UI设计
- IconJar管理图标资源
- Zeplin进行设计标注

### 7.2 组件库
- 使用Ant Design作为基础组件库
- 基于设计系统进行定制化
- 保持组件的一致性

这个UI设计方案注重：
1. 清晰的视觉层级
2. 专业的辩论氛围
3. 良好的用户体验
4. 完整的响应式支持
5. 统一的设计语言
6. 可访问性考虑

# AI辩论系统UI设计规范

## 新增功能模块UI设计

### 1. AI大模型管理界面

#### 1.1 模型供应商管理
- **布局**: 卡片网格布局
  ```
  +------------------------+  +------------------------+
  |     OpenAI配置         |  |    Anthropic配置       |
  |------------------------|  |------------------------|
  | 状态: 已连接           |  | 状态: 未配置           |
  | 可用模型: 3            |  | 可用模型: -            |
  | API密钥: ****          |  | API密钥: -             |
  |------------------------|  |------------------------|
  | [编辑] [测试] [删除]   |  |        [配置]          |
  +------------------------+  +------------------------+
  ```

#### 1.2 模型参数配置
- **布局**: 分栏式表单
  ```
  +--------------------------------------------------+
  |  参数模板配置                                      |
  |--------------------------------------------------|
  |  模板名称: [                    ] ▼               |
  |                                                   |
  |  基础参数:                                        |
  |    Temperature: [0.7] (0.0 - 1.0)                |
  |    Max Tokens:  [2048] (1 - 4096)                |
  |    Top P:       [0.9] (0.0 - 1.0)                |
  |                                                   |
  |  高级参数:                                        |
  |    [ ] 启用频率惩罚                               |
  |    [ ] 启用存在惩罚                               |
  |                                                   |
  |  [保存模板] [设为默认] [重置]                      |
  +--------------------------------------------------+
  ```

#### 1.3 监控面板
- **布局**: 仪表盘布局
  ```
  +-------------------+  +-------------------+
  |   调用总次数      |  |    平均响应时间    |
  | [图表显示区域]    |  | [图表显示区域]     |
  +-------------------+  +-------------------+
  +-------------------+  +-------------------+
  |   Token消耗       |  |    错误率         |
  | [图表显示区域]    |  | [图表显示区域]     |
  +-------------------+  +-------------------+
  
  +--------------------------------------------------+
  |  详细调用记录                                     |
  |--------------------------------------------------|
  | 时间        模型    状态    延迟    成本          |
  |--------------------------------------------------|
  | 2024-03-.. GPT-4   成功    1.2s    $0.02        |
  | 2024-03-.. Claude  失败    -       -            |
  +--------------------------------------------------+
  ```

### 2. AI助手配置界面

#### 2.1 调用模式选择
- **布局**: 选项卡式布局
  ```
  +--------------------------------------------------+
  | [Dify工作流模式] | [直接API调用模式]              |
  |--------------------------------------------------|
  |                                                   |
  |  Dify工作流配置:                                  |
  |    服务器URL:  [https://api.dify.ai            ] |
  |    API密钥:    [****************************    ] |
  |    工作流ID:   [workflow_123456                ] |
  |                                                   |
  |  [测试连接] [保存配置]                            |
  +--------------------------------------------------+
  ```

#### 2.2 角色绑定配置
- **布局**: 表单布局
  ```
  +--------------------------------------------------+
  |  角色绑定设置                                     |
  |--------------------------------------------------|
  |  选择角色类型:                                    |
  |    ( ) AI选手                                     |
  |    ( ) AI裁判                                     |
  |                                                   |
  |  绑定详情:                                        |
  |    角色ID:     [player_001] ▼                    |
  |    提示词模板: [标准辩论] ▼                       |
  |                                                   |
  |  系统提示词:                                      |
  |    [                                           ] |
  |    [                                           ] |
  |                                                   |
  |  [预览效果] [保存配置]                            |
  +--------------------------------------------------+
  ```

#### 2.3 配置切换工具
- **布局**: 向导式布局
  ```
  +--------------------------------------------------+
  |  配置切换向导                                     |
  |--------------------------------------------------|
  |  步骤 1/3: 选择目标配置                           |
  |    当前模式: Dify工作流                           |
  |    目标模式: 直接API调用                          |
  |                                                   |
  |  [上一步] [下一步] [取消]                         |
  +--------------------------------------------------+
  ```

### 3. 通用设计规范

#### 3.1 色彩方案
- 主色调: #1890ff（蓝色）
- 成功状态: #52c41a（绿色）
- 警告状态: #faad14（黄色）
- 错误状态: #f5222d（红色）
- 背景色: #f0f2f5（浅灰）

#### 3.2 交互规范
- 按钮悬停效果：透明度变化
- 输入框焦点效果：边框颜色变化
- 加载状态：骨架屏 + 进度指示
- 表单验证：即时反馈
- 错误提示：顶部通知条

#### 3.3 响应式设计
- 断点设置：
  * xs: <576px
  * sm: ≥576px
  * md: ≥768px
  * lg: ≥992px
  * xl: ≥1200px
  * xxl: ≥1600px

- 布局调整：
  * 大屏：多列布局
  * 中屏：双列布局
  * 小屏：单列布局 