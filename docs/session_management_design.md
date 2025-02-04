# 辩论状态管理与会话存储设计文档

## 1. 概述

本文档描述了AI辩论系统中的状态管理和会话存储方案，重点关注游戏配置到聊天室的状态传递。

## 2. 游戏配置状态结构

### 2.1 核心配置接口
```typescript
interface DebateConfig {
  // 主题配置
  topic: {
    title: string;           // 辩题名称
    description: string;     // 主题背景说明
    type: 'binary';         // 辩论类型
  };

  // 规则配置
  rules: {
    debateFormat: 'structured' | 'free';  // 辩论模式：结构化/自由
    description: string;                   // 规则说明
    
    // 基础规则
    basicRules: {
      speechLengthLimit: {
        min: number;        // 最小字数限制
        max: number;        // 最大字数限制
      };
      totalRounds: number;  // 总回合数
      allowEmptySpeech: boolean;    // 允许空发言
      allowRepeatSpeech: boolean;   // 允许重复发言
    };
    
    // 高级规则
    advancedRules: {
      allowQuoting: boolean;        // 允许引用
      requireResponse: boolean;      // 要求回应
      allowStanceChange: boolean;    // 允许立场转换
      requireEvidence: boolean;      // 要求证据支持
    };
  };

  // 裁判配置
  judging: {
    description: string;      // 评分规则说明
    dimensions: Array<{       // 评分维度
      name: string;          // 维度名称
      weight: number;        // 权重
      description: string;   // 维度说明
      criteria: string[];    // 评分标准
    }>;
    totalScore: number;      // 总分
    judgeId?: string;        // 裁判ID
  };
}

// 玩家配置
interface Player {
  id: string;
  name: string;
  role: DebateRole;          // 'affirmative' | 'negative' | 'judge' | 'unassigned'
  isAI: boolean;             // 是否为AI玩家
  characterId?: string;      // AI角色配置ID（仅AI玩家需要）
}

// 角色分配配置
interface RoleAssignmentConfig {
  affirmativeCount: number;  // 正方人数
  negativeCount: number;     // 反方人数
  judgeCount: number;        // 裁判人数
  timekeeperCount: number;   // 计时员人数（暂未使用）
  minPlayers: number;        // 最小玩家数
  maxPlayers: number;        // 最大玩家数
  autoAssign: boolean;       // 是否自动分配角色
}
```

### 2.2 状态管理结构
```typescript
interface DebateState {
  // 游戏配置状态
  config: {
    debate: DebateConfig;
    players: Player[];
    roleAssignment: RoleAssignmentConfig;
  };

  // 运行时状态
  runtime: {
    status: 'preparing' | 'ongoing' | 'paused' | 'finished';
    currentRound: number;
    currentSpeaker?: string;
    nextSpeaker?: string;
  };

  // 对话历史
  history: {
    speeches: Array<{
      id: string;
      playerId: string;
      content: string;
      round: number;
      timestamp: Date;
    }>;
    scores?: Array<{
      id: string;
      playerId: string;
      round: number;
      dimensions: Record<string, number>;
      total: number;
      feedback?: string;
    }>;
  };
}
```

## 3. 状态传递流程

### 3.1 配置验证
```typescript
function validateConfig(config: DebateConfig): boolean {
  // 1. 验证主题配置
  if (!config.topic.title || !config.topic.description) {
    return false;
  }

  // 2. 验证规则配置
  if (config.rules.basicRules.totalRounds < 1) {
    return false;
  }

  // 3. 验证玩家配置
  const affirmativePlayers = players.filter(p => p.role.startsWith('affirmative'));
  const negativePlayers = players.filter(p => p.role.startsWith('negative'));
  
  if (affirmativePlayers.length < 2 || negativePlayers.length < 2) {
    return false;
  }

  // 4. 验证AI角色配置
  const aiPlayersWithoutCharacter = players.filter(
    p => p.isAI && !p.characterId
  );
  
  if (aiPlayersWithoutCharacter.length > 0) {
    return false;
  }

  // 检查是否需要同步
  private shouldSync(state: DebateState): boolean {
    // 实现同步条件检查逻辑
    return true;
  }
}
```

## 3. 数据结构设计

### 3.1 会话状态接口
```typescript
interface DebateSession {
  // 会话基本信息
  id: string;
  name: string;
  createdAt: Date;
  lastModified: Date;
  status: 'ongoing' | 'paused' | 'finished';
  
  // 配置信息
  config: {
    topic: TopicConfig;        // 辩题配置
    rules: RuleConfig;         // 规则配置
    scoring: ScoringConfig;    // 评分配置
    players: PlayerConfig[];   // 参与者配置
  };
  
  // 辩论进度
  progress: {
    currentRound: number;
    totalRounds: number;
    currentSpeaker?: string;   // 当前发言者ID
    nextSpeaker?: string;      // 下一个发言者ID
  };
  
  // 辩论记录
  history: {
    speeches: Speech[];        // 发言记录
    scores: Score[];          // 评分记录
    events: DebateEvent[];    // 事件记录
  };
  
  // 统计信息
  statistics: {
    roundStats: {
      [round: number]: {
        avgScore: number;
        topSpeaker: string;
      };
    };
    playerStats: {
      [playerId: string]: {
        speechCount: number;
        avgScore: number;
      };
    };
  };
  
  // 元数据
  metadata: {
    version: string;          // 数据版本
    saveCount: number;        // 保存次数
    lastSavedBy?: string;     // 最后保存用户
    tags?: string[];         // 标签
    notes?: string;          // 备注
  };
}

// 辩论事件接口
interface DebateEvent {
  id: string;
  type: 'start' | 'pause' | 'resume' | 'end' | 'round_start' | 'round_end' | 'speech_start' | 'speech_end' | 'system';
  timestamp: Date;
  description: string;
  data?: any;                // 事件相关数据
  triggeredBy?: string;      // 触发者ID
}

// 会话存储配置
interface SessionStorageConfig {
  // 存储选项
  storage: {
    type: 'indexedDB' | 'localStorage' | 'file';
    compression: boolean;     // 是否压缩
    encryption: boolean;      // 是否加密
    autoSave: boolean;       // 是否自动保存
    autoSaveInterval: number; // 自动保存间隔（毫秒）
  };
  
  // 会话管理
  management: {
    maxSessions: number;     // 最大会话数
    expiryDays: number;      // 过期天数
    maxHistoryVersions: number; // 最大历史版本数
  };
  
  // 导出选项
  export: {
    format: 'json' | 'markdown' | 'pdf';
    includeMetadata: boolean;
    includeStatistics: boolean;
  };
}
```

## 4. 实现路径

### 4.1 第一阶段：核心功能实现
1. 状态管理基础架构
   - 状态存储结构
   - 状态更新机制
   - 动作分发系统
2. 会话存储服务
   - 数据持久化
   - 会话加载恢复
3. 状态同步机制
   - 自动同步
   - 冲突处理

### 4.2 状态同步
1. 确保所有必要的配置信息都被正确传递
2. 在聊天室页面初始化时进行配置验证
3. 支持配置的动态更新（如角色变更）

### 4.3 错误处理
1. 配置验证失败时的错误提示
2. AI角色未配置的检查和提示
3. 角色分配不完整的检查和提示 

## 5. 状态管理系统规划

### 5.1 类型定义优先级
1. 类型定义优先级（从高到低）：
   - 游戏配置页面类型定义
   - 状态管理类型定义
   - 聊天室UI类型定义

2. 类型冲突处理原则：
   - 优先使用高优先级的类型定义
   - 通过类型适配器处理不同层级间的类型转换
   - 避免直接修改现有类型定义，优先使用适配器进行兼容

### 5.2 状态管理独立性
1. 状态管理系统独立实现：
   - 状态管理逻辑与UI层完全分离
   - 通过适配器处理与UI层的交互
   - 提供类型安全的API接口

2. 配置传递原则：
   - 游戏配置到辩论室的传递是双向的
   - 支持从辩论室返回配置界面进行微调
   - 状态更新需要即时同步到所有相关组件

### 5.3 类型适配系统
```typescript
// 核心配置类型定义
interface CoreGameConfig {
  topic: TopicConfig;
  rules: RuleConfig;
  players: CorePlayer[];
  scoringRules: ScoringRules;
}

// 状态管理类型定义
interface GameConfigState extends CoreGameConfig {
  isConfiguring: boolean;  // 标记是否处于配置调整状态
}

// 类型转换适配器示例
export const adaptCoreToRoomPlayer = (player: CorePlayer): ChatRoomPlayer => {
  return {
    id: player.id,
    name: player.name,
    role: player.role,
    // ... 其他字段的适配
  };
};
```

### 5.4 状态验证机制
1. 运行时类型检查：
   - 配置验证
   - 状态完整性检查
   - 类型安全保证

2. 错误处理：
   - 类型不匹配处理
   - 状态同步失败处理
   - 配置冲突解决

3. 状态同步策略：
   - 即时同步
   - 批量更新
   - 冲突解决机制