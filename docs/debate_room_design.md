# 辩论室设计文档
src/
  ├── pages/
  │   └── DebateRoom/           // 辩论室页面
  ├── components/
  │   └── debate/              // 辩论室组件
  │       ├── layout/          // 布局组件
  │       ├── players/         // 选手相关组件
  │       └── speech/          // 发言相关组件
  ├── store/
  │   ├── slices/
  │   │   └── debateRoomSlice.ts
  │   └── adapters/
  │       └── debateRoomAdapter.ts
  └── types/
      └── debate/
          ├── state.ts         // 状态类型
          ├── speech.ts        // 发言相关类型
          └── score.ts         // 评分相关类型
          
## 1. 页面布局设计

### 1.1 整体布局

```typescript
// 使用统一的类型定义
import { 
  DebateRoomLayout,
  HeaderRegion,
  PlayersRegion,
  ContentRegion,
  ResponsiveLayout
} from '../types';

// 默认布局配置
const defaultLayout: DebateRoomLayout = {
  grid: {
    template: `
      "header header header" 60px
      "players content content" 1fr
      / 25% 75% auto
    `
  },
  regions: {
    header: {
      components: {
        navigation: {
          backButton: true,
          roundInfo: true,
          themeSwitch: true,
          saveSession: true,
          debateControl: true
        },
        info: {
          topic: {
            title: '',
            background: ''
          },
          format: 'structured'
        },
        judge: {
          judge: null // 将在初始化时设置
        }
      },
      style: {
        height: '60px',
        padding: '0 20px',
        background: 'var(--color-bg-light)',
        boxShadow: 'var(--shadow-sm)'
      }
    },
    players: {
      components: {
        playerList: {
          players: [],
          currentSpeaker: undefined,
          nextSpeaker: undefined
        },
        statistics: {
          scores: {},
          speakingCount: {}
        }
      },
      style: {
        width: '25%',
        minWidth: '300px',
        maxWidth: '500px',
        background: 'var(--color-bg-light)',
        borderRight: '1px solid var(--color-border)'
      }
    },
    content: {
      components: {
        speechHistory: [],
        currentSpeech: undefined,
        innerThoughts: undefined,
        judgeComments: []
      },
      style: {
        flex: 1,
        padding: '20px',
        background: 'var(--color-bg-white)'
      }
    }
  },
  theme: {
    mode: 'light',
    colors: {
      // 主题色值配置
    }
  }
};

// 响应式布局配置
const responsiveLayout: ResponsiveLayout = {
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  },
  layouts: {
    mobile: {
      grid: {
        template: `
          "header" 60px
          "content" 1fr
          "players" 300px
          / 100%
        `
      }
    },
    tablet: {
      grid: {
        template: `
          "header header" 60px
          "players content" 1fr
          / 300px 1fr
        `
      }
    },
    desktop: defaultLayout,
    wide: {
      grid: {
        template: `
          "header header header" 60px
          "players content content" 1fr
          / 20% 80% auto
        `
      }
    }
  }
};
```

### 1.2 响应式设计
```typescript
interface ResponsiveConfig {
  breakpoints: {
    mobile: '320px';
    tablet: '768px';
    desktop: '1024px';
    wide: '1440px';
  };
  
  layouts: {
    mobile: {
      grid: `
        "header" 60px
        "content" 1fr
        "players" 300px
        / 100%
      `;
    };
    tablet: {
      grid: `
        "header header" 60px
        "players content" 1fr
        / 300px 1fr
      `;
    };
    desktop: {
      grid: `
        "header header header" 60px
        "players content chat" 1fr
        / 25% 1fr 300px
      `;
    };
  };
}
```

## 2. 数据结构设计

### 2.1 辩论室状态
```typescript
// 使用统一的类型定义
import { 
  DebateRoomState,
  DebateStatus,
  GameConfig,
  Player,
  Judge,
  Speech,
  Score,
  DebateEvent
} from '../types';

// 辩论室状态示例
const debateRoomState: DebateRoomState = {
  id: string;                // 会话ID
  status: DebateStatus;      // 当前状态
  config: GameConfig;        // 游戏配置
  progress: {
    currentRound: number;
    totalRounds: number;
    currentSpeaker?: string;
    nextSpeaker?: string;
    speakingOrder: string[];
  };
  history: {
    speeches: Speech[];      // 发言历史
    scores: Score[];         // 评分历史
    events: DebateEvent[];   // 事件历史
  };
};

// AI交互接口
interface AIInteraction {
  // 发言生成
  generateSpeech: (context: {
    player: Player;
    debateState: DebateRoomState;
    previousSpeeches: Speech[];
  }) => Promise<{
    content: string;
    innerThoughts?: string;  // 可选的内心OS
  }>;
  
  // 评分生成
  generateScore: (context: {
    judge: Judge;
    speech: Speech;
    scoringRules: ScoringRule[];
    debateState: DebateRoomState;
  }) => Promise<Score>;
}
```

## 3. 状态管理设计

### 3.1 Redux Toolkit 集成
```typescript
// 使用统一的类型定义
import { 
  DebateRoomState,
  DebateStatus,
  Speech,
  Score,
  DebateEvent
} from '../types';

// 辩论室状态切片
const debateRoomSlice = createSlice({
  name: 'debateRoom',
  initialState: {
    session: {
      id: '',
      name: '',
      createdAt: 0,
      lastSavedAt: 0,
      autoSaveEnabled: true
    },
    status: 'preparing' as DebateStatus,
    config: null as GameConfig | null,
    progress: {
      currentRound: 1,
      totalRounds: 1,
      speakingOrder: []
    },
    history: {
      speeches: [] as Speech[],
      scores: [] as Score[],
      events: [] as DebateEvent[]
    }
  } as DebateRoomState,
  reducers: {
    // ... reducer implementations ...
  }
});
```

### 3.2 数据持久化集成
```typescript
// 使用统一的类型定义
class DebateRoomStorage extends BaseStorageService<DebateRoomState> {
  protected schema = z.object({
    id: z.string(),
    status: z.enum(['preparing', 'ongoing', 'paused', 'finished']),
    config: gameConfigSchema,
    progress: z.object({
      currentRound: z.number(),
      totalRounds: z.number(),
      currentSpeaker: z.string().optional(),
      nextSpeaker: z.string().optional(),
      speakingOrder: z.array(z.string())
    }),
    history: z.object({
      speeches: z.array(speechSchema),
      scores: z.array(scoreSchema),
      events: z.array(eventSchema)
    })
  });

  // ... storage service implementations ...
}
```

## 4. 业务流程设计

### 4.1 自由辩论流程
```typescript
class FreeDebateFlow {
  // 轮次初始化
  async initializeRound(players: Player[]): Promise<{
    order: string[];
    currentSpeaker: string;
  }> {
    // 随机生成发言顺序
    const order = this.shufflePlayers(players);
    return {
      order,
      currentSpeaker: order[0]
    };
  }
  
  // AI发言流程
  async handleAISpeech(context: {
    player: Player;
    debateState: DebateRoomState;
    previousSpeeches: Speech[];
  }): Promise<void> {
    // 1. 生成内心OS
    const thoughts = await this.generateInnerThoughts({
      player: context.player,
      role: "思考者",
      instruction: "分析当前辩论形势，思考下一步论述策略",
      debateState: context.debateState,
      previousSpeeches: context.previousSpeeches
    });
    
    // 2. 更新状态
    this.store.actions.addInnerThoughts(context.player.id, thoughts);
    
    // 3. 生成正式发言
    const speech = await this.generateSpeech({
      player: context.player,
      role: "辩手",
      instruction: "基于内心思考，生成正式的辩论发言",
      debateState: context.debateState,
      previousSpeeches: context.previousSpeeches,
      innerThoughts: thoughts
    });
    
    // 4. 更新状态
    this.store.actions.addSpeech(context.player.id, speech);
  }
  
  // 人类发言处理
  async handleHumanSpeech(content: string): Promise<void> {
    // 1. 验证发言内容
    const validation = this.validateSpeech(content);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // 2. 更新状态
    this.store.actions.addSpeech(this.currentPlayer.id, content);
  }
  
  // 评分处理
  async handleScoring(context: {
    speech: Speech;
    judge: Judge;
    rules: ScoringRule[];
  }): Promise<void> {
    // 1. 生成评分
    const score = await this.generateScore({
      judge: context.judge,
      role: "裁判",
      instruction: "根据评分规则对发言进行评分和点评",
      speech: context.speech,
      rules: context.rules
    });
    
    // 2. 更新状态
    this.store.actions.addScore(score);
  }
}
```

### 4.2 正反方辩论流程
```typescript
class StructuredDebateFlow extends FreeDebateFlow {
  // 阵营分配
  async assignTeams(players: Player[]): Promise<{
    affirmative: Player[];
    negative: Player[];
  }> {
    // 1. 随机分配阵营
    const shuffled = this.shufflePlayers(players);
    const mid = Math.floor(shuffled.length / 2);
    
    return {
      affirmative: shuffled.slice(0, mid),
      negative: shuffled.slice(mid)
    };
  }
  
  // 重写AI发言流程
  async handleAISpeech(context: {
    player: Player;
    stance: 'affirmative' | 'negative';
    debateState: DebateRoomState;
    previousSpeeches: Speech[];
  }): Promise<void> {
    // 1. 生成内心OS（加入立场信息）
    const thoughts = await this.generateInnerThoughts({
      ...context,
      role: "思考者",
      instruction: `作为${context.stance === 'affirmative' ? '正方' : '反方'}，分析当前辩论形势，思考下一步论述策略`,
    });
    
    // 2. 更新状态
    this.store.actions.addInnerThoughts(context.player.id, thoughts);
    
    // 3. 生成正式发言（加入立场信息）
    const speech = await this.generateSpeech({
      ...context,
      role: "辩手",
      instruction: `作为${context.stance === 'affirmative' ? '正方' : '反方'}，基于内心思考，生成正式的辩论发言`,
      innerThoughts: thoughts
    });
    
    // 4. 更新状态
    this.store.actions.addSpeech(context.player.id, speech);
  }
  
  // 立场验证
  validateStance(speech: Speech, stance: 'affirmative' | 'negative'): {
    isValid: boolean;
    issues?: string[];
  } {
    // 实现立场验证逻辑
    return {
      isValid: true
    };
  }
}
```

## 5. 组件设计

### 5.1 核心组件
```typescript
// 辩论室容器
const DebateRoom: React.FC<{
  config: DebateConfig;
  onExit: () => void;
}> = ({ config, onExit }) => {
  // 实现辩论室主容器
  return (
    <div className="debate-room">
      <Header />
      <div className="debate-content">
        <PlayerList />
        <SpeechArea />
      </div>
    </div>
  );
};

// 选手列表
const PlayerList: React.FC<{
  players: Player[];
  currentSpeaker?: string;
  nextSpeaker?: string;
  scores: Record<string, number>;
}> = ({ players, currentSpeaker, nextSpeaker, scores }) => {
  // 实现选手列表
  return (
    <div className="player-list">
      {players.map(player => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrentSpeaker={player.id === currentSpeaker}
          isNextSpeaker={player.id === nextSpeaker}
          score={scores[player.id]}
        />
      ))}
    </div>
  );
};

// 发言区域
const SpeechArea: React.FC<{
  speeches: Speech[];
  currentSpeech?: Speech;
  format: 'structured' | 'free';
}> = ({ speeches, currentSpeech, format }) => {
  // 实现发言区域
  return (
    <div className="speech-area">
      <SpeechHistory speeches={speeches} />
      <CurrentSpeech speech={currentSpeech} />
      <InnerThoughtsPanel />
    </div>
  );
};
```

### 5.2 辅助组件
```typescript
// 轮次指示器
const RoundIndicator: React.FC<{
  current: number;
  total: number;
  format: 'structured' | 'free';
}> = ({ current, total, format }) => {
  // 实现轮次指示器
  return (
    <div className="round-indicator">
      <span>第 {current}/{total} 轮</span>
      <span>{format === 'structured' ? '正反方辩论' : '自由辩论'}</span>
    </div>
  );
};

// 内心OS面板
const InnerThoughtsPanel: React.FC<{
  thoughts?: string;
  player: Player;
  isAI: boolean;
}> = ({ thoughts, player, isAI }) => {
  // 实现内心OS面板
  return (
    <div className="inner-thoughts-panel">
      <div className="panel-header">
        <Avatar player={player} />
        <span>内心OS</span>
      </div>
      <div className="panel-content">
        {isAI ? (
          <StreamingOutput content={thoughts} />
        ) : (
          <div className="thoughts-text">{thoughts}</div>
        )}
      </div>
    </div>
  );
};

// 流式输出组件
const StreamingOutput: React.FC<{
  content?: string;
}> = ({ content }) => {
  // 实现流式文本输出
  return (
    <div className="streaming-output">
      {/* 使用打字机效果显示内容 */}
    </div>
  );
};
```

## 6. AI交互设计

### 6.1 提示词模板
```typescript
interface PromptTemplate {
  // 内心OS提示词
  innerThoughts: {
    system: string;
    human: string;
  };
  
  // 发言提示词
  speech: {
    system: string;
    human: string;
  };
  
  // 评分提示词
  scoring: {
    system: string;
    human: string;
  };
}

const promptTemplates: PromptTemplate = {
  innerThoughts: {
    system: `你是一位专业的辩论选手，现在需要你以思考者的身份，分析当前辩论局势并思考策略。
你的角色信息：
- 姓名：{{player.name}}
- 性格：{{player.personality}}
- 说话风格：{{player.speakingStyle}}
- 专业背景：{{player.background}}
- 价值观：{{player.values}}
- 论证风格：{{player.argumentationStyle}}`,
    
    human: `当前辩论信息：
- 主题：{{topic}}
- 背景：{{background}}
- 当前轮次：{{currentRound}}/{{totalRounds}}
- 已有发言：{{previousSpeeches}}

请以内心独白的方式，分析当前局势并思考下一步策略。注意：
1. 保持角色特征的一致性
2. 分析其他选手的论点优劣
3. 思考可能的反驳方向
4. 规划下一步的论证策略`
  },
  
  speech: {
    system: `你是一位专业的辩论选手，现在需要你基于之前的思考，生成正式的辩论发言。
你的角色信息：[同上]`,
    
    human: `当前辩论信息：[同上]
你的内心思考：{{innerThoughts}}

请基于以上信息，生成正式的辩论发言。要求：
1. 字数限制：{{rules.speechLengthLimit}}
2. 必须回应：{{rules.requireResponse}}
3. 论证方式：{{rules.argumentationStyle}}
4. 立场要求：{{rules.stanceRequirement}}`
  }
};
```

### 6.2 流式输出实现
```typescript
class StreamingManager {
  // 处理流式响应
  async handleStream(
    response: ReadableStream,
    onToken: (token: string) => void,
    onComplete: () => void
  ): Promise<void> {
    const reader = response.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = line.slice(6);
            onToken(token);
          }
        }
      }
      
      onComplete();
    } finally {
      reader.releaseLock();
    }
  }
}
```

## 7. 错误处理

### 7.1 错误类型
```typescript
enum DebateRoomError {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  SPEECH_VALIDATION_FAILED = 'SPEECH_VALIDATION_FAILED',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  SCORING_FAILED = 'SCORING_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

### 7.2 错误处理策略
```typescript
interface ErrorHandler {
  // 错误处理器
  handle: (error: DebateRoomError, context?: any) => {
    message: string;
    severity: 'error' | 'warning' | 'info';
    recovery?: () => Promise<void>;
  };
  
  // 重试策略
  retry: {
    maxAttempts: number;
    backoffFactor: number;
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
  };
}
```

## 8. 性能优化

### 8.1 优化策略
```typescript
interface OptimizationStrategy {
  // 数据缓存
  cache: {
    speeches: LRUCache<string, Speech>;
    scores: LRUCache<string, Score>;
    aiResponses: LRUCache<string, string>;
  };
  
  // 批量处理
  batch: {
    maxBatchSize: number;
    batchTimeout: number;
    processBatch: <T>(items: T[]) => Promise<void>;
  };
  
  // 懒加载
  lazyLoad: {
    historyChunkSize: number;
    loadMoreHistory: () => Promise<Speech[]>;
  };
}
```

## 9. 安全性考虑

### 9.1 安全策略
```typescript
interface SecurityStrategy {
  // 内容过滤
  contentFilter: {
    sensitiveWords: string[];
    validateContent: (content: string) => boolean;
    sanitizeContent: (content: string) => string;
  };
  
  // 权限控制
  permissions: {
    canSpeak: (playerId: string) => boolean;
    canScore: (judgeId: string) => boolean;
    canModerate: (userId: string) => boolean;
  };
  
  // 数据加密
  encryption: {
    encryptSession: (state: DebateRoomState) => Promise<string>;
    decryptSession: (encrypted: string) => Promise<DebateRoomState>;
  };
}
```

### 9.2 会话管理系统

#### 9.2.1 会话数据结构
```typescript
// 会话元数据
interface SessionMeta {
  id: string;
  name: string;
  createdAt: number;
  lastSavedAt: number;
  format: 'structured' | 'free';
  topic: string;
  totalRounds: number;
  currentRound: number;
  status: DebateRoomState['status'];
  autoSaveEnabled: boolean;
  participants: {
    playerCount: number;
    aiCount: number;
    judgeId: string;
  };
}

// 会话存储数据
interface SessionData {
  // 元数据
  meta: SessionMeta;
  
  // 游戏配置
  gameConfig: RootState['gameConfig'];
  
  // 角色信息
  participants: {
    players: {
      id: string;
      name: string;
      isAI: boolean;
      characterId?: string; // AI角色配置ID
      role: string;
      team?: 'affirmative' | 'negative';
      isSubstitute?: boolean; // 是否为替补角色
    }[];
    judge: {
      id: string;
      name: string;
      characterId: string;
      isSubstitute?: boolean;
    };
  };
  
  // 辩论进度
  progress: DebateRoomState['progress'];
  
  // 历史记录
  history: DebateRoomState['history'];
}

// 会话管理服务
class SessionManager extends BaseStorageService<SessionData> {
  protected schema = sessionSchema;
  private readonly MAX_AUTO_SAVES = 3;
  
  // 创建新会话
  async createSession(gameConfig: RootState['gameConfig']): Promise<string> {
    const sessionId = nanoid();
    const session: SessionData = {
      meta: {
        id: sessionId,
        name: `辩论会话 ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        createdAt: Date.now(),
        lastSavedAt: Date.now(),
        format: gameConfig.format,
        topic: gameConfig.topic.title,
        totalRounds: gameConfig.rules.totalRounds,
        currentRound: 1,
        status: 'preparing',
        autoSaveEnabled: true,
        participants: {
          playerCount: gameConfig.participants.length,
          aiCount: gameConfig.participants.filter(p => p.isAI).length,
          judgeId: gameConfig.judge.id
        }
      },
      gameConfig,
      participants: this.initializeParticipants(gameConfig),
      progress: {
        currentRound: 1,
        totalRounds: gameConfig.rules.totalRounds,
        speakingOrder: []
      },
      history: {
        speeches: [],
        scores: [],
        events: []
      }
    };
    
    await this.saveSession(session);
    return sessionId;
  }
  
  // 保存会话
  async saveSession(session: SessionData, isAutoSave: boolean = false): Promise<void> {
    try {
      session.meta.lastSavedAt = Date.now();
      
      // 如果是自动保存，检查并维护自动保存数量限制
      if (isAutoSave) {
        await this.manageAutoSaves(session.meta.id);
      }
      
      // 保存会话数据
      await this.set(`session:${session.meta.id}${isAutoSave ? ':auto' : ''}`, session);
      
      // 更新会话索引
      await this.updateSessionIndex(session.meta);
      
      // 触发保存成功事件
      this.emit('sessionSaved', {
        sessionId: session.meta.id,
        isAutoSave
      });
    } catch (error) {
      // 处理保存失败
      this.emit('saveError', {
        sessionId: session.meta.id,
        error,
        isAutoSave
      });
      throw error;
    }
  }
  
  // 加载会话
  async loadSession(sessionId: string): Promise<SessionData> {
    try {
      // 尝试加载手动保存的会话
      let session = await this.get(`session:${sessionId}`);
      
      // 如果不存在，尝试加载最新的自动保存
      if (!session) {
        session = await this.get(`session:${sessionId}:auto`);
      }
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // 打开角色替换对话框
      const needsSubstitution = await this.checkForMissingCharacters(session.participants);
      if (needsSubstitution) {
        await this.openSubstitutionDialog(session);
      }
      
      return session;
    } catch (error) {
      this.emit('loadError', {
        sessionId,
        error
      });
      throw error;
    }
  }
  
  // 自动保存管理
  private async manageAutoSaves(sessionId: string): Promise<void> {
    const autoSaves = await this.listAutoSaves(sessionId);
    if (autoSaves.length >= this.MAX_AUTO_SAVES) {
      // 删除最旧的自动保存
      const oldestSave = autoSaves.sort((a, b) => a.lastSavedAt - b.lastSavedAt)[0];
      await this.delete(`session:${oldestSave.id}:auto`);
    }
  }
  
  // 获取自动保存列表
  private async listAutoSaves(sessionId: string): Promise<SessionMeta[]> {
    const index = await this.get('session_index') || [];
    return index.filter(meta => 
      meta.id === sessionId && 
      await this.exists(`session:${meta.id}:auto`)
    );
  }
  
  // 检查缺失的AI角色
  private async checkForMissingCharacters(participants: SessionData['participants']): Promise<boolean> {
    const aiService = new AICharacterService();
    const availableCharacters = await aiService.listCharacters();
    
    // 检查玩家
    const missingPlayers = participants.players.filter(player => 
      player.isAI && 
      player.characterId &&
      !availableCharacters.find(c => c.id === player.characterId)
    );
    
    // 检查裁判
    const missingJudge = participants.judge.characterId &&
      !availableCharacters.find(c => c.id === participants.judge.characterId);
    
    return missingPlayers.length > 0 || missingJudge;
  }
  
  // 打开角色替换对话框
  private async openSubstitutionDialog(session: SessionData): Promise<void> {
    const aiService = new AICharacterService();
    const availableCharacters = await aiService.listCharacters();
    
    // 发出事件，让UI层显示替换对话框
    this.emit('characterSubstitutionNeeded', {
      session,
      availableCharacters,
      onSubstitute: async (substitutions: {
        originalId: string;
        newId: string;
        playerType: 'player' | 'judge';
      }[]) => {
        // 应用替换
        for (const sub of substitutions) {
          if (sub.playerType === 'player') {
            const player = session.participants.players.find(p => 
              p.characterId === sub.originalId
            );
            if (player) {
              const newCharacter = availableCharacters.find(c => 
                c.id === sub.newId
              );
              if (newCharacter) {
                player.characterId = newCharacter.id;
                player.name = `${newCharacter.name}(替补)`;
                player.isSubstitute = true;
              }
            }
          } else {
            const newCharacter = availableCharacters.find(c => 
              c.id === sub.newId
            );
            if (newCharacter) {
              session.participants.judge.characterId = newCharacter.id;
              session.participants.judge.name = `${newCharacter.name}(替补)`;
              session.participants.judge.isSubstitute = true;
            }
          }
        }
        
        // 保存更新后的会话
        await this.saveSession(session);
      }
    });
  }
}

// 角色替换对话框组件
const CharacterSubstitutionDialog: React.FC<{
  open: boolean;
  session: SessionData;
  availableCharacters: Character[];
  onClose: () => void;
  onConfirm: (substitutions: {
    originalId: string;
    newId: string;
    playerType: 'player' | 'judge';
  }[]) => void;
}> = ({ open, session, availableCharacters, onClose, onConfirm }) => {
  const [substitutions, setSubstitutions] = useState<{
    [key: string]: string;
  }>({});
  
  const handleSubstitutionChange = (originalId: string, newId: string) => {
    setSubstitutions(prev => ({
      ...prev,
      [originalId]: newId
    }));
  };
  
  const handleConfirm = () => {
    const subs = Object.entries(substitutions).map(([originalId, newId]) => ({
      originalId,
      newId,
      playerType: session.participants.players.some(p => 
        p.characterId === originalId
      ) ? 'player' : 'judge'
    }));
    onConfirm(subs);
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>替换缺失的AI角色</DialogTitle>
      <DialogContent>
        <List>
          {session.participants.players
            .filter(p => p.isAI && p.characterId)
            .map(player => (
              <ListItem key={player.id}>
                <CharacterSubstitutionItem
                  originalCharacter={player}
                  availableCharacters={availableCharacters}
                  onChange={(newId) => 
                    handleSubstitutionChange(player.characterId!, newId)
                  }
                />
              </ListItem>
            ))}
          {session.participants.judge.characterId && (
            <ListItem>
              <CharacterSubstitutionItem
                originalCharacter={session.participants.judge}
                availableCharacters={availableCharacters}
                onChange={(newId) =>
                  handleSubstitutionChange(
                    session.participants.judge.characterId!,
                    newId
                  )
                }
              />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleConfirm} color="primary">
          确认替换
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

## 10. 技术细节补充

### 10.1 Redux 数据流设计
```typescript
// Action Types
export const DebateRoomActionTypes = {
  // 会话管理
  SESSION_INIT: 'debateRoom/SESSION_INIT',
  SESSION_SAVE: 'debateRoom/SESSION_SAVE',
  SESSION_LOAD: 'debateRoom/SESSION_LOAD',
  SESSION_AUTO_SAVE: 'debateRoom/SESSION_AUTO_SAVE',
  
  // 辩论控制
  DEBATE_START: 'debateRoom/DEBATE_START',
  DEBATE_PAUSE: 'debateRoom/DEBATE_PAUSE',
  DEBATE_RESUME: 'debateRoom/DEBATE_RESUME',
  DEBATE_END: 'debateRoom/DEBATE_END',
  
  // 发言管理
  SPEECH_START: 'debateRoom/SPEECH_START',
  SPEECH_INNER_THOUGHTS: 'debateRoom/SPEECH_INNER_THOUGHTS',
  SPEECH_CONTENT: 'debateRoom/SPEECH_CONTENT',
  SPEECH_END: 'debateRoom/SPEECH_END',
  
  // 评分管理
  SCORE_ADD: 'debateRoom/SCORE_ADD',
  SCORE_UPDATE: 'debateRoom/SCORE_UPDATE',
  
  // 进度管理
  ROUND_NEXT: 'debateRoom/ROUND_NEXT',
  SPEAKER_NEXT: 'debateRoom/SPEAKER_NEXT'
} as const;

// Action Creators
export const debateRoomActions = {
  // 异步 Action Creators
  initializeSession: (gameConfig: GameConfig): ThunkAction => 
    async (dispatch, getState) => {
      try {
        dispatch({ type: SESSION_INIT.REQUEST });
        const sessionId = await sessionManager.createSession(gameConfig);
        dispatch({ 
          type: SESSION_INIT.SUCCESS,
          payload: { sessionId, gameConfig }
        });
      } catch (error) {
        dispatch({ 
          type: SESSION_INIT.FAILURE,
          error
        });
      }
    },
    
  // 自动保存处理
  handleAutoSave: (): ThunkAction =>
    async (dispatch, getState) => {
      const state = getState();
      if (!state.debateRoom.session.autoSaveEnabled) return;
      
      try {
        dispatch({ type: SESSION_AUTO_SAVE.REQUEST });
        await sessionManager.saveSession(
          state.debateRoom,
          true // isAutoSave
        );
        dispatch({ type: SESSION_AUTO_SAVE.SUCCESS });
      } catch (error) {
        dispatch({ 
          type: SESSION_AUTO_SAVE.FAILURE,
          error
        });
      }
    }
};

// Selectors
export const debateRoomSelectors = {
  // 基础选择器
  selectSession: (state: RootState) => state.debateRoom.session,
  selectGameConfig: (state: RootState) => state.debateRoom.gameConfig,
  selectProgress: (state: RootState) => state.debateRoom.progress,
  selectHistory: (state: RootState) => state.debateRoom.history,
  
  // 计算选择器
  selectCurrentSpeaker: createSelector(
    [selectProgress, selectGameConfig],
    (progress, gameConfig) => {
      if (!progress.currentSpeaker) return null;
      return gameConfig.participants.find(
        p => p.id === progress.currentSpeaker
      );
    }
  ),
  
  selectPlayerScores: createSelector(
    [selectHistory],
    (history) => {
      const scores: Record<string, number> = {};
      history.scores.forEach(score => {
        scores[score.playerId] = (scores[score.playerId] || 0) + score.totalScore;
      });
      return scores;
    }
  )
};

// 中间件配置
export const debateRoomMiddleware = [
  // 自动保存中间件
  store => next => action => {
    const result = next(action);
    
    // 在特定action后触发自动保存
    if (
      action.type === SPEECH_END ||
      action.type === SCORE_ADD ||
      action.type === ROUND_NEXT
    ) {
      store.dispatch(debateRoomActions.handleAutoSave());
    }
    
    return result;
  }
];
```

### 10.2 会话管理补充
```typescript
// 会话数据迁移
interface SessionMigration {
  version: number;
  migrations: {
    [version: number]: (data: any) => Promise<any>;
  };
  
  // 执行迁移
  migrate: async (data: any, fromVersion: number) => {
    let current = data;
    for (
      let v = fromVersion + 1; 
      v <= this.version; 
      v++
    ) {
      if (this.migrations[v]) {
        current = await this.migrations[v](current);
      }
    }
    return current;
  };
}

// 会话数据压缩
interface SessionCompression {
  // 压缩策略
  compress: async (session: SessionData) => {
    // 1. 移除冗余数据
    const cleaned = this.removeRedundantData(session);
    
    // 2. 压缩长文本
    const compressed = await this.compressLongText(cleaned);
    
    // 3. 转换为二进制格式
    return this.toBinary(compressed);
  };
  
  // 解压策略
  decompress: async (compressed: Uint8Array) => {
    // 1. 从二进制恢复
    const raw = this.fromBinary(compressed);
    
    // 2. 解压长文本
    const decompressed = await this.decompressLongText(raw);
    
    // 3. 重建完整数据
    return this.rebuildFullData(decompressed);
  };
}

// 会话数据清理
interface SessionCleanup {
  // 清理规则
  rules: {
    // 自动保存保留时间
    autoSaveRetention: 7 * 24 * 60 * 60 * 1000, // 7天
    
    // 手动保存保留时间
    manualSaveRetention: 30 * 24 * 60 * 60 * 1000, // 30天
    
    // 未完成会话保留时间
    unfinishedRetention: 24 * 60 * 60 * 1000 // 1天
  };
  
  // 执行清理
  cleanup: async () => {
    const now = Date.now();
    const sessions = await this.listAllSessions();
    
    for (const session of sessions) {
      // 检查是否需要清理
      if (
        // 自动保存清理
        (session.isAutoSave && 
         now - session.lastSavedAt > this.rules.autoSaveRetention) ||
        // 手动保存清理
        (!session.isAutoSave && 
         now - session.lastSavedAt > this.rules.manualSaveRetention) ||
        // 未完成会话清理
        (session.status !== 'finished' &&
         now - session.lastSavedAt > this.rules.unfinishedRetention)
      ) {
        await this.deleteSession(session.id);
      }
    }
  };
}
```

### 10.3 AI 交互细节
```typescript
// AI响应重试策略
interface AIRetryStrategy {
  // 重试配置
  config: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 1.5
  };
  
  // 执行重试
  executeWithRetry: async <T>(
    operation: () => Promise<T>,
    context: {
      type: 'thoughts' | 'speech' | 'score';
      playerId: string;
    }
  ) => {
    let attempt = 0;
    let lastError: Error;
    
    while (attempt < this.config.maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt < this.config.maxAttempts) {
          const delay = Math.min(
            this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt),
            this.config.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new AIGenerationError(
      context.type,
      context.playerId,
      lastError
    );
  };
}

// AI响应缓存策略
interface AICacheStrategy {
  // 缓存配置
  config: {
    thoughtsMaxAge: 5 * 60 * 1000, // 5分钟
    speechMaxAge: 10 * 60 * 1000,  // 10分钟
    scoreMaxAge: 15 * 60 * 1000    // 15分钟
  };
  
  // 缓存键生成
  generateCacheKey: (context: {
    type: 'thoughts' | 'speech' | 'score';
    playerId: string;
    round: number;
    previousSpeeches: string[];
  }) => string;
  
  // 缓存处理
  cache: {
    // 获取缓存
    get: async <T>(key: string) => {
      const cached = await this.storage.get(key);
      if (!cached) return null;
      
      const { value, timestamp, maxAge } = cached;
      if (Date.now() - timestamp > maxAge) {
        await this.storage.delete(key);
        return null;
      }
      
      return value as T;
    };
    
    // 设置缓存
    set: async <T>(
      key: string,
      value: T,
      type: 'thoughts' | 'speech' | 'score'
    ) => {
      await this.storage.set(key, {
        value,
        timestamp: Date.now(),
        maxAge: this.config[`${type}MaxAge`]
      });
    };
  };
}

// Prompt模板验证
interface PromptTemplateValidation {
  // 验证规则
  rules: {
    // 必需的变量
    requiredVariables: {
      system: [
        'player.name',
        'player.personality',
        'player.speakingStyle'
      ],
      human: [
        'topic',
        'currentRound',
        'totalRounds'
      ]
    };
    
    // 长度限制
    lengthLimits: {
      system: 2000,
      human: 1500
    };
    
    // 格式要求
    formatRules: {
      // 变量格式
      variablePattern: /\{\{([^}]+)\}\}/g,
      
      // 结构要求
      structure: {
        system: ['role', 'background', 'personality'],
        human: ['context', 'task', 'requirements']
      }
    };
  };
  
  // 执行验证
  validate: (template: PromptTemplate) => {
    const errors: ValidationError[] = [];
    
    // 检查必需变量
    this.validateRequiredVariables(template, errors);
    
    // 检查长度限制
    this.validateLengthLimits(template, errors);
    
    // 检查格式要求
    this.validateFormat(template, errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
}
```

## 11. 评分系统设计

### 11.1 评分维度
```typescript
// 评分维度定义
interface ScoringDimensions {
  // 基础维度
  dimensions: {
    // 逻辑性（论证的逻辑严密程度）
    logic: {
      name: '逻辑性';
      weight: 40;
      description: '论证的逻辑严密程度';
      score: number;      // 0-40分
    };
    
    // 拟人程度（观点和论证的拟人化程度）
    personification: {
      name: '拟人程度';
      weight: 30;
      description: '观点和论证的拟人化程度';
      score: number;      // 0-30分
    };
    
    // 规则遵守（对辩论规则的遵守程度）
    compliance: {
      name: '规则遵守';
      weight: 30;
      description: '对辩论规则的遵守程度';
      score: number;      // 0-30分
    };
  };
}

// 评分记录
interface Score {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: number;
  
  // 维度分数
  dimensions: {
    logic: number;       // 0-40分
    personification: number; // 0-30分
    compliance: number;  // 0-30分
  };
  
  // 总分（100分制）
  totalScore: number;
  
  // 评语
  comment: string;
  
  // 具体反馈
  feedback: {
    strengths: string[];  // 优点
    weaknesses: string[]; // 不足
    suggestions: string[]; // 建议
  };
}

// 评分计算器
class ScoreCalculator {
  // 计算总分
  calculateTotalScore(dimensions: Score['dimensions']): number {
    return dimensions.logic + 
           dimensions.personification + 
           dimensions.compliance;
  }
}

// 评分提示词模板
interface ScoringPromptTemplate {
  // 系统提示词
  system: `你是一位专业的辩论赛评委，需要以特定的评委身份对辩手的发言进行评分和点评。

你的身份信息：
姓名：{{judge.name}}
简介：{{judge.introduction}}
性格特征：{{judge.personality}}
说话风格：{{judge.speakingStyle}}
专业背景：{{judge.background}}
价值观：{{judge.values}}
论证风格：{{judge.argumentationStyle}}
{{#if judge.characterConfig}}
{{judge.characterConfig.customPrompt}}
{{/if}}

评分维度包括：
1. 逻辑性（40分）：论证的逻辑严密程度
2. 拟人程度（30分）：观点和论证的拟人化程度
3. 规则遵守（30分）：对辩论规则的遵守程度

请以你的评委身份，按照以下JSON格式输出评分结果：
{
  "dimensions": {
    "logic": number,       // 0-40分
    "personification": number, // 0-30分
    "compliance": number   // 0-30分
  },
  "feedback": {
    "strengths": string[],    // 3-5个优点
    "weaknesses": string[],   // 2-3个不足
    "suggestions": string[]   // 1-2个建议
  },
  "comment": string          // 总体评语，不超过500字
}`;

  // 人类提示词模板
  human: `请以评委身份对以下辩论发言进行评分：

辩论主题：{{topic}}
当前轮次：第{{currentRound}}轮
发言选手：{{player.name}}
{{#if player.team}}
所属方：{{player.team === 'affirmative' ? '正方' : '反方'}}
{{/if}}

该选手历史发言：
{{#each playerHistory}}
第{{round}}轮：{{content}}
{{/each}}

本轮发言内容：
{{speech.content}}


{{#if previousSpeech}}
同一人上一轮发言：
{{previousSpeech.content}}
{{/if}}

请以你的评委身份，严格按照系统提示的JSON格式输出评分结果。评语要体现你的个性特征和价值观。`;
}
```

## 12. 游戏配置集成方案

### 12.1 配置接口设计
```typescript
// 游戏配置到辩论室的状态转换接口
interface ConfigurationIntegration {
  // 配置验证
  validateConfig: (config: GameConfig) => {
    isValid: boolean;
    errors?: string[];
  };

  // 状态初始化
  initializeDebateRoom: (config: GameConfig) => {
    id: string;
    status: 'preparing';
    format: config.format;
    participants: {
      players: Player[];
      judge: Judge;
    };
    progress: {
      currentRound: 1;
      totalRounds: config.rules.totalRounds;
      speakingOrder: string[];
    };
  };

  // 状态恢复
  restoreState: (
    config: GameConfig,
    savedState?: DebateRoomState
  ) => DebateRoomState;
}

// 配置验证规则
const configValidationRules = {
  // 主题验证
  topic: {
    required: true,
    minLength: 4,
    maxLength: 100
  },

  // 参与者验证
  participants: {
    minPlayers: 2,
    maxPlayers: 6,
    requireJudge: true,
    validateAICharacters: (characters: Character[]) => {
      return characters.every(char => (
        char.name &&
        char.personality &&
        char.speakingStyle &&
        char.background
      ));
    }
  },

  // 规则验证
  rules: {
    validateRounds: (rounds: number) => rounds >= 1 && rounds <= 10,
    validateFormat: (format: string) => 
      ['structured', 'free'].includes(format),
    validateScoringRules: (rules: ScoringRule[]) => {
      const totalWeight = rules.reduce(
        (sum, rule) => sum + rule.weight, 
        0
      );
      return totalWeight === 100;
    }
  }
};
```

### 12.2 状态管理集成
```typescript
// 状态管理器
class StateManager {
  // 状态同步
  syncState: async (
    action: 'save' | 'load',
    context: {
      configState: GameConfig;
      debateState?: DebateRoomState;
      sessionId?: string;
    }
  ) => {
    switch (action) {
      case 'save':
        await this.storage.set('lastGameState', {
          configState: context.configState,
          debateState: context.debateState,
          timestamp: Date.now()
        });
        break;
        
      case 'load':
        const saved = await this.storage.get('lastGameState');
        if (saved && saved.sessionId === context.sessionId) {
          return {
            configState: saved.configState,
            debateState: saved.debateState
          };
        }
        return null;
    }
  };

  // 状态清理
  cleanupState: async () => {
    await this.storage.delete('lastGameState');
  };
}

// 导航控制
interface NavigationControl {
  // 进入辩论室
  enterDebateRoom: (config: GameConfig) => {
    // 验证配置
    const validation = validateConfig(config);
    if (!validation.isValid) {
      throw new ConfigValidationError(validation.errors);
    }

    // 初始化状态
    const initialState = initializeDebateRoom(config);
    
    // 创建会话
    const sessionId = await sessionManager.createSession(initialState);
    
    // 导航到辩论室
    navigate(`/debate-room/${sessionId}`);
  };

  // 返回配置页面
  returnToConfig: (
    shouldSaveState: boolean = true
  ) => {
    if (shouldSaveState) {
      await sessionManager.saveSession(currentState);
    }
    
    navigate('/config', {
      state: { lastSessionId: currentState.id }
    });
  };
}
```

## 13. 开发任务列表

### 13.1 第一阶段：基础辩论室（2周）

#### 基础框架搭建（3-4天）
- [ ] 项目初始化
  - [ ] 创建项目结构
  - [ ] 配置开发环境（TypeScript、React、Redux Toolkit）
  - [ ] 添加必要依赖（样式库、路由等）

- [ ] 状态管理搭建
  - [ ] 配置 Redux Store
  - [ ] 实现基础 reducers（辩论状态、发言记录等）
  - [ ] 添加异步 actions（AI交互等）

#### 核心UI组件开发（1周）
- [ ] 辩论室布局
  - [ ] 实现基础网格布局
  - [ ] 添加响应式支持
  - [ ] 集成主题切换

- [ ] 选手列表组件
  - [ ] 实现选手卡片设计
  - [ ] 添加当前发言标记
  - [ ] 显示基础统计信息

- [ ] 发言区域组件
  - [ ] 实现发言历史列表
  - [ ] 添加内心OS面板
  - [ ] 设计评分展示区域

#### 基础功能实现（3-4天）
- [ ] 辩论流程控制
  - [ ] 实现开始/暂停/结束
  - [ ] 添加轮次切换
  - [ ] 实现发言顺序管理

- [ ] AI交互基础
  - [ ] 集成AI服务
  - [ ] 实现基础发言生成
  - [ ] 添加评分生成

### 13.2 第二阶段：系统集成（1周）

#### 配置集成（3天）
- [ ] 游戏配置对接
  - [ ] 分析和集成 gameConfig 结构
  - [ ] 实现配置数据验证
  - [ ] 处理配置到辩论室的状态转换

- [ ] 路由集成
  - [ ] 实现配置页面到辩论室的导航
  - [ ] 添加路由参数传递
  - [ ] 处理返回和刷新逻辑

#### 状态管理（2天）
- [ ] 状态持久化
  - [ ] 实现配置状态的本地存储
  - [ ] 处理页面刷新时的状态恢复
  - [ ] 添加会话恢复机制

### 13.3 第三阶段：功能完善（2-3周）

#### 辩论功能增强（1周）
- [ ] 自由辩论增强
  - [ ] 完善AI发言生成
  - [ ] 优化评分系统
  - [ ] 添加引用功能

- [ ] 结构化辩论
  - [ ] 实现环节控制
  - [ ] 添加时间限制
  - [ ] 实现规则检查

#### 会话管理（1周）
- [ ] 会话功能
  - [ ] 实现自动保存
  - [ ] 添加会话恢复
  - [ ] 实现导出功能

- [ ] 数据管理
  - [ ] 实现数据压缩
  - [ ] 添加数据清理
  - [ ] 优化存储策略

### 13.4 第四阶段：优化和测试（1-2周）

#### 性能优化（4-5天）
- [ ] 状态优化
  - [ ] 实现状态缓存
  - [ ] 优化更新逻辑
  - [ ] 添加性能监控

- [ ] 加载优化
  - [ ] 实现懒加载
  - [ ] 优化资源加载
  - [ ] 添加预加载

#### 测试和文档（3-4天）
- [ ] 测试用例
  - [ ] 添加单元测试
  - [ ] 实现集成测试
  - [ ] 添加端到端测试

- [ ] 文档完善
  - [ ] 更新技术文档
  - [ ] 添加用户指南
  - [ ] 完善API文档 