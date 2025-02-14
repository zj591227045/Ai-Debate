# @debate-flow 模块集成指南

## 1. 模块概述

@debate-flow 模块提供了完整的辩论流程控制功能，包括：

- 发言顺序管理
- 轮次控制
- AI发言生成
- 评分系统
- 状态管理

## 2. 快速开始

### 2.1 基本使用

在React组件中使用 @debate-flow：

```typescript
import { useDebateFlow } from '@debate/hooks/useDebateFlow';

const DebateRoom: React.FC<{ config: DebateConfig }> = ({ config }) => {
  const { state, error, actions } = useDebateFlow(config);

  // 开始辩论
  const handleStart = () => {
    actions.startDebate();
  };

  // 提交人类发言
  const handleSubmitSpeech = (content: string) => {
    if (state?.currentSpeaker) {
      const speech: Speech = {
        id: crypto.randomUUID(),
        playerId: state.currentSpeaker.id,
        content,
        type: 'speech',
        timestamp: Date.now(),
        round: state.currentRound,
        role: 'user'
      };
      actions.submitSpeech(speech);
    }
  };

  return (
    <div>
      {/* 渲染UI组件 */}
    </div>
  );
};
```

### 2.2 配置说明

初始化配置示例：

```typescript
const debateConfig: DebateConfig = {
  topic: {
    title: "主题",
    description: "描述",
    background: "背景信息"
  },
  players: [
    {
      id: "player1",
      name: "选手1",
      isAI: true,
      role: "first_affirmative",
      team: "affirmative",
      characterConfig: {
        personality: "理性",
        speakingStyle: "严谨",
        background: "经济学家",
        values: ["公平", "效率"],
        argumentationStyle: "数据驱动"
      }
    }
    // ... 其他选手
  ],
  rules: {
    format: "structured",
    rounds: 4,
    canSkipSpeaker: true,
    requireInnerThoughts: true
  },
  judge: {
    id: "judge1",
    name: "评委",
    characterConfig: {
      personality: "公正",
      speakingStyle: "专业",
      background: "资深评委"
    }
  }
};
```

## 3. 状态管理

### 3.1 状态结构

```typescript
interface DebateFlowState {
  status: 'preparing' | 'ongoing' | 'paused' | 'completed';
  currentRound: number;
  totalRounds: number;
  currentSpeaker: SpeakerInfo | null;
  nextSpeaker: SpeakerInfo | null;
  speakingOrder: SpeakingOrderInfo;
  currentSpeech: SpeechInfo | null;
  speeches: Speech[];
  scores: Score[];
}

interface SpeakingOrderInfo {
  format: 'free' | 'structured';
  currentRound: number;
  totalRounds: number;
  speakers: Array<{
    player: SpeakerInfo;
    status: SpeakerStatus;
    sequence: number;
  }>;
  history: Array<{
    round: number;
    speakerId: string;
  }>;
}

interface Speech {
  id: string;
  playerId: string;
  content: string;
  type: 'speech' | 'innerThoughts';
  timestamp: number;
  round: number;
  role: 'assistant' | 'user' | 'system';
}
```

### 3.2 状态订阅

组件会自动订阅状态更新：

```typescript
const { state } = useDebateFlow(config);

useEffect(() => {
  if (state?.status === 'completed') {
    // 处理辩论结束
  }
}, [state?.status]);
```

## 4. 错误处理

```typescript
const { error, actions } = useDebateFlow(config);

useEffect(() => {
  if (error) {
    // 处理错误
    console.error('辩论流程错误:', error);
  }
}, [error]);
```

## 5. 最佳实践

1. **状态管理**
   - 使用 useDebateFlow hook 统一管理状态
   - 不要直接修改状态，始终通过 actions 进行操作
   - 注意处理 timestamp 类型，确保是 number 类型

2. **错误处理**
   - 始终检查并处理错误状态
   - 提供适当的用户反馈
   - 使用 ErrorBoundary 组件捕获渲染错误

3. **性能优化**
   - 合理使用 useCallback 和 useMemo
   - 避免不必要的重渲染
   - 使用 React.memo 优化组件更新

4. **类型安全**
   - 使用 TypeScript 类型定义
   - 避免使用 any 类型
   - 确保所有类型定义完整且一致

5. **AI 交互**
   - 正确处理 AI 发言的流式输出
   - 处理好 AI 发言的状态转换
   - 确保错误处理机制完善

## 6. 常见问题

### 6.1 状态不更新

检查：
- 是否正确初始化了配置
- 是否正确订阅了状态更新
- 是否有错误被捕获
- 是否正确处理了异步操作

### 6.2 发言无法提交

检查：
- 当前是否有活跃的发言者
- 发言格式是否正确
- 是否有权限提交发言
- timestamp 是否为数字类型

### 6.3 AI 发言问题

检查：
- AI 服务是否正常
- 流式输出是否正确处理
- 是否正确处理了中断和恢复

## 7. API 参考

### 7.1 Hook API

```typescript
function useDebateFlow(config?: DebateConfig): {
  state: DebateFlowState | undefined;
  error: Error | undefined;
  actions: {
    startDebate: () => Promise<void>;
    pauseDebate: () => Promise<void>;
    resumeDebate: () => Promise<void>;
    endDebate: () => Promise<void>;
    submitSpeech: (speech: Speech) => Promise<void>;
  };
}
```

### 7.2 配置类型

```typescript
interface DebateConfig {
  topic: {
    title: string;
    description?: string;
    background?: string;
  };
  players: PlayerConfig[];
  rules: DebateRules;
  judge?: JudgeConfig;
}

interface PlayerConfig {
  id: string;
  name: string;
  isAI: boolean;
  role: string;
  team?: 'affirmative' | 'negative';
  characterConfig?: CharacterConfig;
}
```

## 8. 更新日志

### v1.1.0
- 统一了 Speech 类型定义
- 完善了状态管理机制
- 改进了 AI 发言处理
- 增强了类型安全性
- 优化了错误处理

### v1.0.0
- 初始版本
- 基本辩论流程控制
- 评分系统
- 状态管理 