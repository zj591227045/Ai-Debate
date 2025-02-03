export interface Topic {
  title: string;
  description: string;
  background?: string;
  type: 'structured' | 'free';
}

export interface Rules {
  debateFormat: 'structured' | 'free';
  basicRules: {
    speechLengthLimit: {
      min: number;
      max: number;
      defaultMax: number;
    };
    totalRounds: number;
    allowEmptySpeech: boolean;
    allowRepeatSpeech: boolean;
  };
  roundRules: {
    drawMethod: 'random';
    orderLocked: boolean;
    speakOncePerRound: boolean;
  };
  eliminationRules?: {
    enabled: boolean;
    eliminatePerRound: number;
    minPlayers: number;
    tiebreaker: {
      criteria: ('averageScore' | 'totalScore' | 'innovation' | 'logic')[];
      random: boolean;
    };
  };
}

export interface Participants {
  totalCount: number;
  userParticipation: {
    isParticipating: boolean;
    role?: string;
  };
  aiPlayers: {
    playerId: string;
    role?: string;
    team?: number;
  }[];
  teamSetup?: {
    teamCount: number;
    playersPerTeam: number;
  };
}

export interface TimeConfig {
  roundDuration: number;  // 每轮时间限制（秒）
  totalDuration: number;  // 总时长限制（秒）
  warningTime: number;    // 警告时间（秒）
  overtimeAllowed: boolean; // 是否允许超时
  maxOvertime?: number;   // 最大超时时间（秒）
}

export interface ScoringCriteria {
  id: string;
  name: string;
  description: string;
  type: string;
  weight: number;
  scoringGuide: string;
  enabledInModes: ('ai_judge' | 'group_review')[];
}

export interface DebateConfig {
  id?: string;
  // 主题配置
  topic: {
    title: string;          
    description: string;    
    type: 'binary' | 'open';
  };
  // 规则配置
  rules: {
    debateFormat: 'structured' | 'free';  
    description: string;                   
    basicRules: {
      speechLengthLimit: {
        min: number;
        max: number;
      };
      allowEmptySpeech: boolean;
      allowRepeatSpeech: boolean;
    };
    advancedRules: {
      allowQuoting: boolean;      
      requireResponse: boolean;   
      allowStanceChange: boolean; 
      requireEvidence: boolean;   
    };
  };
  // 裁判配置
  judging: {
    description: string;          
    dimensions: Array<{
      name: string;              
      weight: number;            
      description: string;       
      criteria: string[];        
    }>;
    totalScore: number;          
  };
  // 参与者配置
  participants?: {
    totalCount: number;
    userParticipation: {
      isParticipating: boolean;
      role?: string;
    };
    aiPlayers: {
      playerId: string;
      role?: string;
      team?: number;
    }[];
    teamSetup?: {
      teamCount: number;
      playersPerTeam: number;
    };
  };
  // 时间配置
  timeConfig?: {
    roundDuration: number;
    totalDuration: number;
    warningTime: number;
    overtimeAllowed: boolean;
    maxOvertime?: number;
  };
  // 元数据
  createdAt?: Date;
  updatedAt?: Date;
} 