# 辩论流程控制模块设计

## 1. 模块职责

辩论流程控制模块负责管理整个辩论过程中的流程控制，包括发言顺序管理、轮次控制、状态转换等核心功能。该模块需要保持高内聚低耦合的设计原则，通过明确的接口与其他模块交互。

## 2. 核心接口设计

### 2.1 发言顺序管理器 (SpeakingOrderManager)

```typescript
interface SpeakingOrderManager {
  // 初始化发言顺序
  initializeOrder(players: Player[], format: 'free' | 'structured'): SpeakingOrder;
  
  // 获取下一个发言者
  getNextSpeaker(currentOrder: SpeakingOrder): Player | null;
  
  // 跳过当前发言者
  skipCurrentSpeaker(order: SpeakingOrder): SpeakingOrder;
  
  // 手动调整发言顺序
  reorderSpeakers(order: SpeakingOrder, newOrder: Player[]): SpeakingOrder;
  
  // 处理选手退出
  handlePlayerExit(order: SpeakingOrder, playerId: string): SpeakingOrder;
  
  // 处理选手重新加入
  handlePlayerRejoin(order: SpeakingOrder, player: Player): SpeakingOrder;
  
  // 获取发言统计
  getSpeakingStats(order: SpeakingOrder): SpeakingStatistics;
}

interface SpeakingOrder {
  format: 'free' | 'structured';
  currentRound: number;
  totalRounds: number;
  speakers: Array<{
    player: Player;
    status: 'pending' | 'speaking' | 'completed' | 'skipped';
    sequence: number;
  }>;
  history: Array<{
    round: number;
    speakerId: string;
    duration: number;
    timestamp: number;
  }>;
}

interface SpeakingStatistics {
  [playerId: string]: {
    totalSpeeches: number;
    totalDuration: number;
    averageDuration: number;
    skippedCount: number;
  };
}
```

### 2.2 轮次控制器 (RoundController)

```typescript
interface RoundController {
  // 开始新轮次
  startNewRound(round: number): Promise<void>;
  
  // 开始内心OS阶段
  startInnerThoughts(player: Player): Promise<StreamResponse>;
  
  // 开始正式发言阶段
  startSpeech(player: Player): Promise<StreamResponse>;
  
  // 暂停当前发言
  pauseSpeech(): void;
  
  // 继续当前发言
  resumeSpeech(): void;
  
  // 强制结束当前发言
  forceEndSpeech(): void;
  
  // 回退到上一个发言者
  rollbackToPreviousSpeaker(): Promise<void>;
  
  // 处理AI生成失败
  handleAIGenerationFailure(error: Error): Promise<void>;
  
  // 控制人类发言时间
  controlHumanSpeechTime(maxDuration: number): void;
}

interface StreamResponse {
  content: ReadableStream;
  metadata: {
    playerId: string;
    type: 'innerThoughts' | 'speech';
    startTime: number;
    status: 'streaming' | 'completed' | 'failed';
  };
}
```

### 2.3 评分系统接口 (ScoringSystem)

```typescript
interface ScoringSystem {
  // 初始化评分规则
  initializeScoring(rules: ScoringRules): void;
  
  // 生成评分
  generateScore(speech: Speech, judge: Judge): Promise<Score>;
  
  // 更新评分历史
  updateScoreHistory(score: Score): void;
  
  // 获取评分统计
  getScoreStatistics(): ScoreStatistics;
  
  // 获取选手排名
  getPlayerRankings(): PlayerRanking[];
}

interface ScoringRules {
  dimensions: Array<{
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }>;
  maxScore: number;
  passingScore: number;
}

interface Score {
  id: string;
  speechId: string;
  playerId: string;
  judgeId: string;
  timestamp: number;
  dimensions: {
    [dimensionName: string]: number;
  };
  totalScore: number;
  comments: string;
}
```

### 2.4 会话管理接口 (SessionManager)

```typescript
interface SessionManager {
  // 创建新会话
  createSession(config: DebateConfig): Promise<string>;
  
  // 保存会话状态
  saveSession(sessionId: string, state: DebateState): Promise<void>;
  
  // 恢复会话状态
  restoreSession(sessionId: string): Promise<DebateState>;
  
  // 导出会话
  exportSession(sessionId: string): Promise<SessionExport>;
  
  // 导入会话
  importSession(sessionData: SessionExport): Promise<string>;
  
  // 获取会话回放数据
  getSessionPlayback(sessionId: string): Promise<PlaybackData>;
}

interface DebateState {
  id: string;
  config: DebateConfig;
  speakingOrder: SpeakingOrder;
  currentRound: number;
  speeches: Speech[];
  scores: Score[];
  status: 'preparing' | 'ongoing' | 'paused' | 'completed';
  timestamp: number;
}

interface PlaybackData {
  timeline: Array<{
    type: 'speech' | 'innerThoughts' | 'score';
    content: any;
    timestamp: number;
  }>;
  metadata: {
    duration: number;
    speakerCount: number;
    roundCount: number;
  };
}
```

## 3. 状态管理

### 3.1 状态定义

```typescript
interface DebateFlowState {
  // 基础状态
  status: 'preparing' | 'ongoing' | 'paused' | 'completed';
  currentRound: number;
  totalRounds: number;
  
  // 发言相关
  speakingOrder: SpeakingOrder;
  currentSpeaker: Player | null;
  nextSpeaker: Player | null;
  
  // 计时相关
  roundStartTime: number;
  speechStartTime: number;
  totalDuration: number;
  
  // 统计相关
  statistics: {
    speechCount: number;
    averageDuration: number;
    completedRounds: number;
  };
}
```

### 3.2 状态转换

```typescript
type DebateFlowAction =
  | { type: 'START_DEBATE' }
  | { type: 'PAUSE_DEBATE' }
  | { type: 'RESUME_DEBATE' }
  | { type: 'END_DEBATE' }
  | { type: 'START_ROUND'; payload: number }
  | { type: 'END_ROUND'; payload: number }
  | { type: 'START_SPEECH'; payload: Player }
  | { type: 'END_SPEECH'; payload: { player: Player; duration: number } }
  | { type: 'SKIP_SPEAKER'; payload: Player }
  | { type: 'UPDATE_ORDER'; payload: SpeakingOrder };
```

## 4. 错误处理

### 4.1 错误类型

```typescript
enum DebateFlowError {
  // 发言顺序错误
  INVALID_SPEAKING_ORDER = 'INVALID_SPEAKING_ORDER',
  SPEAKER_NOT_FOUND = 'SPEAKER_NOT_FOUND',
  DUPLICATE_SPEAKER = 'DUPLICATE_SPEAKER',
  
  // 轮次控制错误
  INVALID_ROUND_TRANSITION = 'INVALID_ROUND_TRANSITION',
  ROUND_NOT_FOUND = 'ROUND_NOT_FOUND',
  ROUND_ALREADY_COMPLETED = 'ROUND_ALREADY_COMPLETED',
  
  // AI生成错误
  AI_GENERATION_TIMEOUT = 'AI_GENERATION_TIMEOUT',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_RESPONSE_INVALID = 'AI_RESPONSE_INVALID',
  
  // 会话错误
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_SAVE_FAILED = 'SESSION_SAVE_FAILED',
  SESSION_RESTORE_FAILED = 'SESSION_RESTORE_FAILED'
}
```

### 4.2 错误恢复策略

```typescript
interface ErrorRecoveryStrategy {
  // 重试配置
  retryConfig: {
    maxAttempts: number;
    backoffFactor: number;
    initialDelay: number;
  };
  
  // 错误处理映射
  errorHandlers: {
    [key in DebateFlowError]: (error: Error) => Promise<void>;
  };
  
  // 回退策略
  rollbackStrategies: {
    [key in DebateFlowError]: () => Promise<void>;
  };
}
```

## 5. 事件系统

### 5.1 事件定义

```typescript
enum DebateFlowEvent {
  // 辩论状态事件
  DEBATE_STARTED = 'DEBATE_STARTED',
  DEBATE_PAUSED = 'DEBATE_PAUSED',
  DEBATE_RESUMED = 'DEBATE_RESUMED',
  DEBATE_ENDED = 'DEBATE_ENDED',
  
  // 轮次事件
  ROUND_STARTED = 'ROUND_STARTED',
  ROUND_ENDED = 'ROUND_ENDED',
  
  // 发言事件
  SPEECH_STARTED = 'SPEECH_STARTED',
  SPEECH_ENDED = 'SPEECH_ENDED',
  INNER_THOUGHTS_STARTED = 'INNER_THOUGHTS_STARTED',
  INNER_THOUGHTS_ENDED = 'INNER_THOUGHTS_ENDED',
  
  // 评分事件
  SCORE_GENERATED = 'SCORE_GENERATED',
  SCORE_UPDATED = 'SCORE_UPDATED',
  
  // 错误事件
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  ERROR_RECOVERED = 'ERROR_RECOVERED'
}
```

### 5.2 事件订阅

```typescript
interface EventSubscriber {
  // 订阅事件
  subscribe(event: DebateFlowEvent, handler: EventHandler): void;
  
  // 取消订阅
  unsubscribe(event: DebateFlowEvent, handler: EventHandler): void;
  
  // 触发事件
  emit(event: DebateFlowEvent, data: any): void;
}
```

## 6. 性能优化

### 6.1 缓存策略

```typescript
interface CacheStrategy {
  // 发言缓存
  speechCache: {
    maxSize: number;
    expirationTime: number;
    strategy: 'LRU' | 'FIFO';
  };
  
  // 评分缓存
  scoreCache: {
    maxSize: number;
    expirationTime: number;
    strategy: 'LRU' | 'FIFO';
  };
}
```

### 6.2 批处理策略

```typescript
interface BatchProcessingStrategy {
  // 事件批处理
  eventBatchSize: number;
  eventBatchDelay: number;
  
  // 状态更新批处理
  stateBatchSize: number;
  stateBatchDelay: number;
}
```

## 7. 模块依赖

### 7.1 必需依赖

- LLM Service: 用于生成AI发言和内心OS
- 存储服务: 用于会话管理
- 事件总线: 用于模块间通信

### 7.2 可选依赖

- 评分系统: 用于生成评分
- 统计服务: 用于生成数据统计
- 导出服务: 用于会话导出

## 8. 开发计划

### 8.1 第一阶段：核心功能（1周）

- [ ] 实现发言顺序管理器
- [ ] 实现轮次控制器
- [ ] 实现基础状态管理
- [ ] 实现错误处理系统

### 8.2 第二阶段：功能完善（1周）

- [ ] 实现评分系统接口
- [ ] 实现会话管理接口
- [ ] 实现事件系统
- [ ] 添加缓存策略

### 8.3 第三阶段：优化和测试（1周）

- [ ] 实现性能优化
- [ ] 编写单元测试
- [ ] 进行集成测试
- [ ] 补充文档和注释

## 9. 页面调用接口

### 9.1 辩论室页面接口

```typescript
interface DebateFlowController {
  // 初始化辩论流程
  initialize(config: DebateConfig): Promise<void>;
  
  // 开始辩论
  startDebate(): Promise<void>;
  
  // 暂停辩论
  pauseDebate(): Promise<void>;
  
  // 继续辩论
  resumeDebate(): Promise<void>;
  
  // 结束辩论
  endDebate(): Promise<void>;
  
  // 跳过当前发言者
  skipCurrentSpeaker(): Promise<void>;
  
  // 强制结束当前发言
  forceEndCurrentSpeech(): Promise<void>;
  
  // 保存当前状态并退出到配置界面
  saveAndExit(): Promise<void>;
  
  // 提交人类选手发言
  submitHumanSpeech(playerId: string, content: string): Promise<void>;
  
  // 获取当前状态
  getCurrentState(): DebateFlowState;
  
  // 获取当前发言者
  getCurrentSpeaker(): Player | null;
  
  // 获取发言历史
  getSpeechHistory(): Speech[];
  
  // 订阅状态变更
  subscribeToStateChange(handler: (state: DebateFlowState) => void): () => void;
}

// 修改后的发言顺序管理器接口
interface SpeakingOrderManager {
  // 初始化发言顺序
  initializeOrder(players: Player[], format: 'free' | 'structured'): SpeakingOrder;
  
  // 获取下一个发言者
  getNextSpeaker(currentOrder: SpeakingOrder): Player | null;
  
  // 跳过当前发言者
  skipCurrentSpeaker(order: SpeakingOrder): SpeakingOrder;
  
  // 处理选手退出
  handlePlayerExit(order: SpeakingOrder, playerId: string): SpeakingOrder;
  
  // 处理选手重新加入
  handlePlayerRejoin(order: SpeakingOrder, player: Player): SpeakingOrder;
}

// 修改后的轮次控制器接口
interface RoundController {
  // 开始新轮次
  startNewRound(round: number): Promise<void>;
  
  // 开始内心OS阶段（仅AI选手）
  startInnerThoughts(player: Player): Promise<StreamResponse>;
  
  // 开始正式发言阶段
  startSpeech(player: Player): Promise<StreamResponse>;
  
  // 暂停当前发言
  pauseSpeech(): void;
  
  // 继续当前发言
  resumeSpeech(): void;
  
  // 强制结束当前发言
  forceEndSpeech(): void;
  
  // 处理AI生成失败
  handleAIGenerationFailure(error: Error): Promise<void>;
}

### 9.2 状态定义

```typescript
// 修改后的状态定义
interface DebateFlowState {
  // 基础状态
  status: 'preparing' | 'ongoing' | 'paused' | 'completed';
  currentRound: number;
  totalRounds: number;
  
  // 发言相关
  speakingOrder: SpeakingOrder;
  currentSpeaker: Player | null;
  nextSpeaker: Player | null;
  
  // 当前发言状态
  currentSpeech: {
    type: 'innerThoughts' | 'speech';
    content: string;
    status: 'streaming' | 'completed' | 'failed';
  } | null;
}

### 9.3 使用示例

```typescript
// 页面组件中使用示例
const DebateRoom: React.FC = () => {
  const debateFlow = useDebateFlow();
  const [state, setState] = useState<DebateFlowState>();
  
  useEffect(() => {
    // 订阅状态变更
    const unsubscribe = debateFlow.subscribeToStateChange(setState);
    return () => unsubscribe();
  }, []);
  
  // 处理开始辩论
  const handleStartDebate = async () => {
    try {
      await debateFlow.startDebate();
    } catch (error) {
      // 处理错误
    }
  };
  
  // 处理人类发言提交
  const handleHumanSpeechSubmit = async (content: string) => {
    try {
      await debateFlow.submitHumanSpeech(state.currentSpeaker.id, content);
    } catch (error) {
      // 处理错误
    }
  };
  
  // 处理跳过发言者
  const handleSkipSpeaker = async () => {
    try {
      await debateFlow.skipCurrentSpeaker();
    } catch (error) {
      // 处理错误
    }
  };
  
  // 处理强制结束发言
  const handleForceEndSpeech = async () => {
    try {
      await debateFlow.forceEndCurrentSpeech();
    } catch (error) {
      // 处理错误
    }
  };
  
  // 处理保存并退出
  const handleSaveAndExit = async () => {
    try {
      await debateFlow.saveAndExit();
      // 导航到配置页面
      navigate('/config');
    } catch (error) {
      // 处理错误
    }
  };
  
  return (
    <div>
      {/* 渲染辩论室界面 */}
    </div>
  );
};
```

## 10. 修改后的开发计划

### 10.1 第一阶段：核心功能（1周）

- [ ] 实现发言顺序管理器（简化版）
- [ ] 实现轮次控制器（简化版）
- [ ] 实现页面调用接口
- [ ] 实现错误处理系统

### 10.2 第二阶段：功能完善（1周）

- [ ] 实现状态管理和事件系统
- [ ] 完善AI生成失败处理
- [ ] 实现保存退出功能
- [ ] 添加页面交互示例

### 10.3 第三阶段：测试和文档（3天）

- [ ] 编写单元测试
- [ ] 进行集成测试
- [ ] 补充文档和注释 