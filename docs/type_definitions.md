# 类型定义文档

## 1. 核心类型定义

### 1.1 辩论形式
```typescript
// 辩论形式类型
type DebateFormat = 'structured' | 'free';

// 辩论形式说明
interface DebateFormatMetadata {
  structured: {
    name: '结构化辩论';
    description: '按照固定的环节和顺序进行辩论';
    features: [
      '固定的发言顺序',
      '明确的环节划分',

    ];
  };
  free: {
    name: '自由辩论';
    description: '以相对灵活的方式进行辩论';
    features: [
      '灵活的发言顺序',
      '自由的发言时机',
      '动态的互动方式'
    ];
  };
}
```

### 1.2 主题相关
```typescript
// 主题类型
type TopicType = 'binary' | 'open';

// 主题定义
interface Topic {
  title: string;              // 主题标题
  background: string;         // 主题背景（包含主题说明、对立信息、论点要求等）
}

// 主题元数据
interface TopicMetadata {
  binary: {
    name: '二元对立主题';
    description: '有明确的正反两方观点';
    examples: string[];
  };
  open: {
    name: '开放式主题';
    description: '可以有多个不同观点';
    examples: string[];
  };
}
```

### 1.3 角色相关
```typescript
// 角色类型
type DebateRole = 'affirmative' | 'negative' | 'free' | 'judge' | 'unassigned';

// 选手定义
interface Player {
  id: string;                // 唯一标识
  name: string;              // 显示名称
  role: DebateRole;          // 角色类型
  isAI: boolean;             // 是否为AI
  characterId?: string;      // AI角色配置ID
  modelId?: string;          // 使用的模型ID
  avatar?: string;           // 头像
  status: PlayerStatus;      // 当前状态
}

// 选手状态
type PlayerStatus = 'ready' | 'speaking' | 'waiting' | 'finished';

// 裁判定义
interface Judge extends Player {
  role: 'judge';
  scoringRules: ScoringRule[];
  comments: Comment[];
}
```

### 1.4 评分系统
```typescript
// 评分维度
interface ScoringDimension {
  id: string;
  name: string;              // 维度名称
  weight: number;            // 权重(0-100)
  description: string;       // 维度说明
  criteria: string[];        // 评分标准
}

// 评分规则
interface ScoringRule {
  dimension: ScoringDimension;
  minScore: number;
  maxScore: number;
  guidelines: string[];
}

// 评分记录
interface Score {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: number;
  dimensions: Record<string, number>;  // 各维度得分
  totalScore: number;                  // 总分
  comment: string;                     // 评语
}
```

### 1.5 发言相关
```typescript
// 发言记录
interface Speech {
  id: string;
  playerId: string;
  content: string;
  innerThoughts?: string;    // 内心OS
  round: number;
  timestamp: number;
  references?: string[];     // 引用的发言
  scores?: Score[];          // 获得的评分
}

// 发言规则
interface SpeechRules {
  minLength: number;         // 最小字数
  maxLength: number;         // 最大字数
  timeLimit: number;         // 时间限制(秒)
  allowQuoting: boolean;     // 允许引用
  requireResponse: boolean;  // 必须回应
  allowStanceChange: boolean; // 允许立场改变
}
```

### 1.6 布局相关
```typescript
// 布局基础类型
interface BaseRegion {
  style: {
    width?: string;
    height?: string;
    padding?: string;
    background?: string;
    boxShadow?: string;
    borderRadius?: string;
  };
}

// 导航组件类型
interface NavigationComponents {
  backButton: boolean;      // 返回按钮
  roundInfo: boolean;       // 轮次信息
  themeSwitch: boolean;     // 主题切换
  saveSession: boolean;     // 保存会话
  debateControl: boolean;   // 辩论控制
}

// 信息组件类型
interface InfoComponents {
  topic: Topic;             // 使用统一的Topic类型
  format: DebateFormat;     // 使用统一的DebateFormat类型
}

// 裁判组件类型
interface JudgeComponents {
  judge: Judge;             // 使用统一的Judge类型
}

// 选手列表组件类型
interface PlayerListComponents {
  players: Player[];        // 使用统一的Player类型
  currentSpeaker?: Player;  // 当前发言人
  nextSpeaker?: Player;     // 下一个发言人
}

// 统计组件类型
interface StatisticsComponents {
  scores: Record<string, Score>;     // 使用统一的Score类型
  speakingCount: Record<string, number>;
}

// 内容组件类型
interface ContentComponents {
  speechHistory: Speech[];   // 使用统一的Speech类型
  currentSpeech?: Speech;    
  innerThoughts?: string;    
  judgeComments: Score[];    // 使用统一的Score类型
}

// 区域类型定义
interface HeaderRegion extends BaseRegion {
  components: {
    navigation: NavigationComponents;
    info: InfoComponents;
    judge: JudgeComponents;
  };
}

interface PlayersRegion extends BaseRegion {
  components: {
    playerList: PlayerListComponents;
    statistics: StatisticsComponents;
  };
}

interface ContentRegion extends BaseRegion {
  components: ContentComponents;
}

// 布局配置类型
interface DebateRoomLayout {
  grid: {
    template: string;         // CSS Grid模板
  };
  regions: {
    header: HeaderRegion;
    players: PlayersRegion;
    content: ContentRegion;
  };
  theme: {
    mode: 'light' | 'dark';
    colors: Record<string, string>;
  };
}

// 响应式布局配置
interface ResponsiveLayout {
  breakpoints: {
    mobile: string;    // e.g., '320px'
    tablet: string;    // e.g., '768px'
    desktop: string;   // e.g., '1024px'
    wide: string;      // e.g., '1440px'
  };
  layouts: {
    mobile: Partial<DebateRoomLayout>;
    tablet: Partial<DebateRoomLayout>;
    desktop: DebateRoomLayout;
    wide: Partial<DebateRoomLayout>;
  };
}
```

### 1.7 统一类型定义
```typescript
// 自定义样式类型
type StyleProperties = CSSProperties & Record<string, string | number>;

// 统一选手类型
interface UnifiedPlayer {
  id: string;
  name: string;
  role: 'affirmative' | 'negative' | 'free' | 'judge' | 'unassigned';
  isAI: boolean;
  characterId?: string;
  avatar?: string;
  status: 'ready' | 'speaking' | 'waiting' | 'finished';
}

// 统一主题类型
interface UnifiedTopic {
  title: string;
  background: string;
}

// 统一评分类型
interface UnifiedScore {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: number;
  dimensions: Record<string, number>;
  totalScore: number;
  comment: string;
}

// 统一发言类型
interface Speech {
  id: string;
  playerId: string;
  content: string;
  timestamp: number;
  round: number;
  references: string[];  // 必需属性，默认为空数组
  scores?: Score[];
}

// 游戏配置状态类型
interface GameConfigState {
  topic: {
    title: string;
    description: string;
  };
  rules: {
    totalRounds: number;
    debateFormat: string;
  };
  debate: DebateConfig;
  players: ConfigPlayer[];
  ruleConfig: RuleConfig;
  isConfiguring: boolean;
}

// 角色分配配置类型
interface RoleAssignmentConfig {
  affirmativeCount: number;
  negativeCount: number;
  judgeCount: number;
  timekeeperCount: number;
  minPlayers: number;
  maxPlayers: number;
  autoAssign?: boolean;
}

// 角色分配状态类型
interface RoleAssignmentState {
  players: ConfigPlayer[];
  config: RoleAssignmentConfig;
}
```

### 1.8 类型适配器
```typescript
// 配置玩家到统一玩家的转换
interface ConfigToUnifiedPlayer {
  (player: ConfigPlayer): UnifiedPlayer;
}

// 统一玩家到配置玩家的转换
interface UnifiedToConfigPlayer {
  (player: UnifiedPlayer, existingPlayers: ConfigPlayer[]): ConfigPlayer;
}

// 角色分配配置到游戏配置的转换
interface RoleAssignmentToGameConfig {
  (
    roleConfig: {
      config: RoleAssignmentConfig;
      players: ConfigPlayer[];
    },
    debateConfig: DebateConfig,
    ruleConfig: RuleConfig
  ): GameConfigState;
}

// 配置对象到游戏配置的转换
interface ConfigToGameConfig {
  (config: {
    debate: DebateConfig;
    players: ConfigPlayer[];
    ruleConfig: RuleConfig;
    isConfiguring: boolean;
  }): GameConfigState;
}

// 游戏配置到辩论室状态的转换
interface StateToRoom {
  (state: GameConfigState): {
    players: UnifiedPlayer[];
    debate: DebateConfig;
    ruleConfig: RuleConfig;
  };
}

// 辩论室状态到游戏配置的转换
interface RoomToState {
  (roomState: any): Partial<GameConfigState>;
}

// 类型守卫函数
function isUnifiedPlayer(player: any): player is UnifiedPlayer {
  return (
    typeof player === 'object' &&
    'id' in player &&
    'name' in player &&
    'role' in player &&
    'isAI' in player &&
    'status' in player
  );
}

// 获取具体角色
function getSpecificRole(
  baseRole: 'affirmative' | 'negative' | 'unassigned',
  players: ConfigPlayer[]
): DebateRole {
  if (baseRole === 'unassigned') return 'unassigned';
  
  const existingRoles = players
    .filter(p => p.role.startsWith(baseRole))
    .map(p => p.role);

  if (!existingRoles.includes(`${baseRole}1`)) return `${baseRole}1`;
  if (!existingRoles.includes(`${baseRole}2`)) return `${baseRole}2`;
  return 'unassigned';
}
```

### 1.9 类型使用示例
```typescript
// 角色分配配置到游戏配置的转换示例
const gameConfig = adaptRoleAssignmentToGameConfig({
  config: {
    affirmativeCount: 2,
    negativeCount: 2,
    judgeCount: 0,
    timekeeperCount: 0,
    minPlayers: 4,
    maxPlayers: 6,
    autoAssign: false
  },
  players: currentPlayers
}, debateConfig, ruleConfig);

// 配置对象到游戏配置的转换示例
const gameConfig = adaptConfigToGameConfig({
  debate: currentDebateConfig,
  players: currentPlayers,
  ruleConfig: currentRuleConfig,
  isConfiguring: false
});

// 游戏配置到辩论室状态的转换示例
const roomState = adaptStateToRoom(currentGameConfig);
```

## 2. 配置类型定义

### 2.1 游戏配置
```typescript
// 游戏配置
interface GameConfig {
  debate: {
    format: DebateFormat;
    topic: Topic;
    rules: {
      basic: {
        format: DebateFormat;
        roundCount: number;
        timeLimit: number;
      };
      speech: SpeechRules;
      scoring: ScoringRule[];
    };
  };
  players: Player[];
  judge: Judge;
}
```

### 2.2 辩论室状态
```typescript
// 辩论室状态
interface DebateRoomState {
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
    speeches: Speech[];
    scores: Score[];
    events: DebateEvent[];
  };
}

// 辩论状态
type DebateStatus = 'preparing' | 'ongoing' | 'paused' | 'finished';

// 辩论事件
interface DebateEvent {
  type: DebateEventType;
  timestamp: number;
  data?: any;
}

type DebateEventType = 
  | 'debate_start' 
  | 'debate_pause' 
  | 'debate_resume' 
  | 'debate_end'
  | 'round_start'
  | 'round_end'
  | 'speech_start'
  | 'speech_end';
```

## 3. 类型使用指南

### 3.1 类型转换
在不同模块间进行类型转换时，应当使用类型适配器：

```typescript
// 游戏配置到辩论室状态的转换
const gameConfigToDebateRoom = (config: GameConfig): DebateRoomState => {
  // 实现转换逻辑
};

// 辩论室状态到游戏配置的转换
const debateRoomToGameConfig = (state: DebateRoomState): GameConfig => {
  // 实现转换逻辑
};
```

### 3.2 类型验证
使用 Zod 进行运行时类型验证：

```typescript
import { z } from 'zod';

// 定义验证模式
const PlayerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  role: z.enum(['affirmative', 'negative', 'judge', 'timekeeper', 'unassigned']),
  isAI: z.boolean(),
  characterId: z.string().optional(),
  modelId: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['ready', 'speaking', 'waiting', 'finished'])
});

// 使用验证
const validatePlayer = (data: unknown): Player => {
  return PlayerSchema.parse(data);
};
```

### 3.3 最佳实践
1. 始终使用类型定义文件中定义的类型
2. 不要在业务代码中重新定义已有类型
3. 如需扩展类型，先更新类型定义文档
4. 使用类型适配器处理类型转换
5. 添加运行时类型验证
6. 保持类型定义的版本一致性

## 4. 版本控制
当需要对类型定义进行修改时：
1. 在本文档中更新类型定义
2. 添加修改说明和版本记录
3. 确保向后兼容性
4. 更新相关的类型适配器
5. 更新类型验证规则

## 5. 待解决问题
1. [ ] 统一所有模块的类型使用
2. [ ] 完善类型验证规则
3. [ ] 添加更多类型转换适配器
4. [ ] 补充类型使用示例
5. [ ] 添加类型测试用例 