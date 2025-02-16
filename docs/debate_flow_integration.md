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

### 4.1 错误边界

使用 `DebateErrorBoundary` 组件包裹辩论相关组件：

```typescript
import { DebateErrorBoundary } from '@components/error/DebateErrorBoundary';

const DebateRoom: React.FC = () => {
  return (
    <DebateErrorBoundary>
      {/* 辩论组件内容 */}
    </DebateErrorBoundary>
  );
};
```

### 4.2 Hook 错误处理

```typescript
const { error, actions } = useDebateFlow(config);

useEffect(() => {
  if (error) {
    message.error(`辩论流程错误: ${error.message}`);
  }
}, [error]);
```

### 4.3 适配器错误处理

辩论流程和评分系统的适配器各自处理自己的错误：

```typescript
// 辩论流程适配器错误处理
try {
  await debateAdapter.submitSpeech(speech);
} catch (error) {
  // 处理辩论流程错误
}

// 评分系统适配器错误处理
try {
  await scoringAdapter.generateScore(speech, context);
} catch (error) {
  // 处理评分系统错误
}
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

## 9. 开发任务清单

### 9.1 组件重构任务

#### 9.1.1 DebateRoom 组件改造
- [ ] 使用 useDebateFlow hook 替换现有状态管理
- [ ] 实现轮次控制和发言顺序管理
- [ ] 添加评分系统UI组件
- [ ] 集成错误处理机制

#### 9.1.2 DebatePlayer 组件改造
- [ ] 支持内心OS显示
- [ ] 添加发言时间控制
- [ ] 实现AI发言流式输出
- [ ] 添加发言历史记录显示

#### 9.1.3 新增组件开发
- [ ] SpeakingOrderDisplay - 发言顺序显示
- [ ] ScoreBoard - 评分面板
- [ ] RoundIndicator - 轮次指示器
- [ ] DebateStatistics - 数据统计面板

### 9.2 状态管理任务

#### 9.2.1 状态集成
- [ ] 整合 DebateFlowState 到组件状态
- [ ] 实现状态快照和回滚功能
- [ ] 添加状态持久化机制

#### 9.2.2 事件处理
- [ ] 实现辩论状态事件监听
- [ ] 添加发言事件处理
- [ ] 集成评分事件处理

### 9.3 AI交互任务

#### 9.3.1 AI发言生成
- [ ] 集成 LLMService
- [ ] 实现内心OS生成
- [ ] 添加发言流式输出处理

#### 9.3.2 评分系统
- [ ] 实现AI评委打分
- [ ] 添加评分反馈显示
- [ ] 集成评分统计功能

### 9.4 UI/UX优化任务

#### 9.4.1 界面优化
- [ ] 设计新的布局结构
- [ ] 添加过渡动画效果
- [ ] 优化移动端适配

#### 9.4.2 交互优化
- [ ] 添加操作提示
- [ ] 实现快捷键控制
- [ ] 优化加载状态显示

### 9.5 测试和文档任务

#### 9.5.1 测试用例
- [ ] 编写组件单元测试
- [ ] 添加集成测试
- [ ] 进行性能测试

#### 9.5.2 文档更新
- [ ] 更新组件使用文档
- [ ] 添加API文档
- [ ] 编写调试指南

### 9.6 性能优化任务

#### 9.6.1 性能改进
- [ ] 实现组件懒加载
- [ ] 优化状态更新逻辑
- [ ] 添加缓存机制

#### 9.6.2 资源优化
- [ ] 优化资源加载
- [ ] 实现代码分割
- [ ] 减少不必要的重渲染

## 10. 开发优先级

1. 组件重构和状态管理（9.1.1, 9.1.2, 9.2.1）
   - 确保基础功能正常运行
   - 建立稳定的状态管理机制

2. AI交互功能（9.3.1, 9.3.2）
   - 实现核心AI交互功能
   - 完善评分系统

3. 新增组件开发（9.1.3）
   - 补充必要的功能组件
   - 提升用户体验

4. UI/UX优化（9.4.1, 9.4.2）
   - 优化界面设计
   - 改进交互体验

5. 性能优化（9.6.1, 9.6.2）
   - 提升应用性能
   - 优化资源使用

6. 测试和文档（9.5.1, 9.5.2）
   - 确保代码质量
   - 完善文档支持

## 11. 注意事项

1. 每个任务完成后需要进行充分测试
2. 保持与现有功能的兼容性
3. 遵循代码规范和最佳实践
4. 及时更新相关文档
5. 注意性能和用户体验的平衡

## 12. 里程碑

### 12.1 第一阶段（1-2周）
- 完成基础组件重构
- 实现核心状态管理
- 集成AI交互基础功能

### 12.2 第二阶段（2-3周）
- 完成新增组件开发
- 实现评分系统
- 优化UI/UX

### 12.3 第三阶段（1-2周）
- 进行性能优化
- 补充测试用例
- 完善文档 

## 13. 系统解耦说明

### 13.1 架构设计

辩论系统采用适配器模式实现系统解耦，主要分为以下几个部分：

1. **核心服务**
   - DebateFlowService: 辩论流程控制
   - ScoringSystem: 评分系统
   - LLMService: AI 服务

2. **适配器层**
   - DebateFlowAdapter: 辩论流程适配器
   - ScoringAdapter: 评分系统适配器

3. **状态管理**
   - 各系统独立维护状态
   - 通过事件机制通信
   - 使用 EventEmitter 处理状态变更

### 13.2 系统交互

```typescript
// 1. 初始化适配器
const debateAdapter = new DebateFlowAdapter(debateService);
const scoringAdapter = new ScoringAdapter(scoringSystem);

// 2. 订阅状态变更
debateAdapter.onStateChange((state) => {
  // 处理辩论状态变更
});

scoringAdapter.onScoreGenerated((score) => {
  // 处理新的评分
});

// 3. 系统交互示例
async function handleSpeechEnd(speech: Speech) {
  // 辩论流程处理
  await debateAdapter.submitSpeech(speech);
  
  // 评分系统处理（独立进行）
  await scoringAdapter.generateScore(speech, context);
}
```

### 13.3 状态隔离

每个系统维护自己的状态：

```typescript
// 辩论流程状态
interface DebateFlowState {
  status: DebateStatus;
  currentRound: number;
  currentSpeaker: Player | null;
  speeches: Speech[];
}

// 评分系统状态
interface ScoringState {
  scores: Score[];
  rankings: PlayerRanking[];
}
```

### 13.4 事件通信

系统间通过事件进行通信：

```typescript
// 1. 定义事件
enum DebateFlowEvent {
  SPEECH_ENDED = 'speech_ended',
  ROUND_ENDED = 'round_ended'
}

enum ScoringEvent {
  SCORE_GENERATED = 'score_generated',
  RANKINGS_UPDATED = 'rankings_updated'
}

// 2. 事件订阅
debateAdapter.on(DebateFlowEvent.SPEECH_ENDED, async (speech) => {
  // 触发评分
  await scoringAdapter.generateScore(speech, context);
});

scoringAdapter.on(ScoringEvent.SCORE_GENERATED, (score) => {
  // 更新UI显示
});
```

### 13.5 错误隔离

每个系统独立处理错误：

```typescript
class DebateFlowAdapter {
  private handleError(error: Error) {
    this.eventEmitter.emit('error', {
      system: 'debate_flow',
      error
    });
  }
}

class ScoringAdapter {
  private handleError(error: Error) {
    this.eventEmitter.emit('error', {
      system: 'scoring',
      error
    });
  }
}
```

### 13.6 使用建议

1. **状态管理**
   - 使用适配器提供的方法操作状态
   - 不要直接修改内部状态
   - 通过事件监听状态变化

2. **错误处理**
   - 为每个系统设置独立的错误处理
   - 使用错误边界组件
   - 提供友好的错误提示

3. **性能优化**
   - 避免不必要的状态更新
   - 合理使用事件解耦
   - 控制事件监听器数量

## 14. 辩论流程状态管理

### 14.1 状态定义

```typescript
enum DebateStatus {
  PREPARING = 'preparing',     // 准备阶段
  ONGOING = 'ongoing',        // 辩论进行中
  ROUND_COMPLETE = 'roundComplete', // 当前轮次完成
  SCORING = 'scoring',        // 评分阶段
  COMPLETED = 'completed'     // 辩论结束
}
```

### 14.2 状态转换规则

1. **准备阶段 → 进行中**
   - 触发条件：初始化完成，点击"开始辩论"
   - 状态变更：`PREPARING → ONGOING`
   - 执行动作：
     - 设置第一个发言者
     - 初始化发言顺序

2. **进行中 → 轮次完成**
   - 触发条件：当前轮次所有发言者完成
   - 状态变更：`ONGOING → ROUND_COMPLETE`
   - 执行动作：
     - 清空当前发言者状态
     - 准备进入评分阶段

3. **轮次完成 → 评分阶段**
   - 触发条件：点击"开始评分"
   - 状态变更：`ROUND_COMPLETE → SCORING`
   - 执行动作：
     - 初始化评分面板
     - 开始生成评分

4. **评分阶段 → 进行中（下一轮）**
   - 触发条件：所有评分完成且还有下一轮
   - 状态变更：`SCORING → ONGOING`
   - 执行动作：
     - 更新轮次计数
     - 重置发言者状态
     - 设置新一轮第一个发言者

5. **评分阶段 → 辩论结束**
   - 触发条件：所有评分完成且无下一轮
   - 状态变更：`SCORING → COMPLETED`
   - 执行动作：
     - 结束辩论
     - 显示最终结果

### 14.3 关键方法实现

#### 14.3.1 开始新一轮 (DebateFlowService)

```typescript
async startNextRound(): Promise<void> {
  // 1. 验证当前状态
  if (this.state.status !== DebateStatus.SCORING) {
    throw new Error('当前状态不允许开始新一轮');
  }

  // 2. 检查是否可以进入下一轮
  if (this.state.currentRound >= this.state.totalRounds) {
    this.state.status = DebateStatus.COMPLETED;
    this.emitStateChange();
    return;
  }

  // 3. 初始化新一轮状态
  this.state = {
    ...this.state,
    currentRound: this.state.currentRound + 1,
    status: DebateStatus.ONGOING,
    speakingOrder: this.initializeNewRound()
  };

  // 4. 设置发言者
  this.setFirstSpeaker();
  
  // 5. 触发状态更新
  this.emitStateChange();
}
```

#### 14.3.2 评分完成处理 (ScoringModal)

```typescript
const handleComplete = async () => {
  if (scores.length === players.length && !isScoring) {
    // 1. 触发评分完成回调
    await onScoringComplete({
      id: `speech_${Date.now()}`,
      playerId: 'system',
      content: '评分完成，准备进入下一轮',
      timestamp: String(Date.now()),
      round: currentRound,
      references: [],
      role: 'system',
      type: 'system'
    });

    // 2. 延迟触发进入下一轮
    setTimeout(() => {
      onNextRound();
    }, 100);
  }
};
```

### 14.4 状态监控和调试

为了方便调试和监控状态变化，我们在关键节点添加了日志：

1. **评分面板状态日志**
```typescript
console.log('评分面板状态:', {
  scoresLength: scores.length,
  playersLength: players.length,
  isScoring,
  shouldShowNextRoundButton: scores.length > 0 && 
    scores.length === players.length && 
    !isScoring
});
```

2. **新一轮开始日志**
```typescript
console.log('新一轮状态初始化完成:', {
  round: this.state.currentRound,
  status: this.state.status,
  nextSpeaker: this.state.nextSpeaker?.name,
  speakersCount: resetSpeakers.length,
  speakersStatus: resetSpeakers.map(s => ({
    name: s.player.name,
    status: s.status
  }))
});
```

### 14.5 注意事项

1. **状态同步**
   - 确保所有组件都通过统一的状态管理机制获取状态
   - 避免组件内部维护冗余状态

2. **状态转换验证**
   - 在每次状态转换前验证当前状态是否允许转换
   - 使用类型系统确保状态转换的类型安全

3. **错误处理**
   - 对非法状态转换抛出明确的错误
   - 提供详细的错误信息便于调试

4. **性能优化**
   - 避免不必要的状态更新
   - 使用适当的缓存机制

5. **调试支持**
   - 保持完整的状态变更日志
   - 提供状态快照功能 