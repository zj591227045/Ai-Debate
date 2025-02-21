import { EventEmitter } from 'events';
import type { Player } from '../../game-config/types';
import type { Speech } from '@debate/types';
import {
  IDebateFlow,
  DebateFlowConfig,
  DebateFlowState,
  SpeechInput,
  StateChangeHandler,
  SpeakingOrder,
  SpeakerInfo,
  Score,
  ProcessedSpeech,
  DebateContext,
  DebateSceneType,
  DebateStatus,
  PlayerConfig,
  ScoringContext,
  ScoringDimension
} from '../types/interfaces';
import { LLMService } from './LLMService';
import { SpeakingOrderManager } from './SpeakingOrderManager';
import { SpeechProcessor } from './SpeechProcessor';
import { ScoringSystem } from './ScoringSystem';
import { DebateFlowEvent } from '../types/events';
import { StoreManager } from '../../state/core/StoreManager';

export class DebateFlowService implements IDebateFlow {
  private readonly eventEmitter: EventEmitter;
  private readonly llmService: LLMService;
  private readonly speakingOrderManager: SpeakingOrderManager;
  private readonly speechProcessor: SpeechProcessor;
  private readonly scoringSystem: ScoringSystem;
  private state: DebateFlowState;
  private debateContext: DebateContext;
  private previousState: DebateFlowState | null = null;
  private readonly storeManager: StoreManager;

  constructor(
    llmService: LLMService,
    speakingOrderManager: SpeakingOrderManager,
    speechProcessor: SpeechProcessor,
    scoringSystem: ScoringSystem
  ) {
    this.eventEmitter = new EventEmitter();
    this.llmService = llmService;
    this.speakingOrderManager = speakingOrderManager;
    this.speechProcessor = speechProcessor;
    this.scoringSystem = scoringSystem;
    this.storeManager = StoreManager.getInstance();
    
    // 初始化状态
    this.state = {
      status: DebateStatus.PREPARING,
      currentRound: 1,
      totalRounds: 1,
      currentSpeaker: null,
      nextSpeaker: null,
      speakingOrder: {
        format: 'free',
        currentRound: 1,
        totalRounds: 1,
        speakers: [],
        history: []
      },
      currentSpeech: null,
      speeches: [],
      scores: []
    };

    // 初始化辩论上下文
    this.debateContext = {
      topic: {
        title: '',
        background: ''
      },
      currentRound: 1,
      totalRounds: 1,
      previousSpeeches: [],
      sceneType: DebateSceneType.OPENING,
      stance: 'positive'
    };
  }

  async initialize(config: DebateFlowConfig): Promise<void> {
    console.log('初始化辩论流程:', config);
    
    // 将 PlayerConfig 转换为 Player
    const players: Player[] = config.players.map(player => ({
      id: player.id,
      name: player.name,
      isAI: player.isAI,
      role: player.role,
      team: player.team,
      characterId: player.characterConfig?.id,
      personality: player.characterConfig?.personality,
      speakingStyle: player.characterConfig?.speakingStyle,
      background: player.characterConfig?.background,
      values: player.characterConfig?.values?.join(','),
      argumentationStyle: player.characterConfig?.argumentationStyle
    }));
    
    const speakingOrder = this.speakingOrderManager.initializeOrder(
      players,
      config.rules.format
    );

    console.log('生成发言顺序:', {
      format: speakingOrder.format,
      speakers: speakingOrder.speakers.map(s => ({
        id: s.player.id,
        name: s.player.name,
        characterId: s.player.characterId,
        status: s.status
      }))
    });

    // 确保有发言者
    if (!speakingOrder.speakers || speakingOrder.speakers.length === 0) {
      throw new Error('没有可用的发言者');
    }

    // 更新LLM服务的玩家列表
    this.llmService.setPlayers(players);

    // 设置初始状态
    this.state = {
      status: DebateStatus.PREPARING,
      currentRound: 1,
      totalRounds: config.rules.rounds,
      currentSpeaker: null,
      nextSpeaker: speakingOrder.speakers[0] ? { ...speakingOrder.speakers[0].player } : null,
      speakingOrder: {
        ...speakingOrder,
        totalRounds: config.rules.rounds,
        // 确保每个发言者对象都完整复制
        speakers: speakingOrder.speakers.map(s => ({
          ...s,
          player: { ...s.player }
        }))
      },
      currentSpeech: null,
      speeches: [],
      scores: []
    };

    // 更新辩论上下文
    this.debateContext = {
      topic: {
        title: config.topic.title,
        background: config.topic.background
      },
      currentRound: 1,
      totalRounds: config.rules.rounds,
      previousSpeeches: [],
      sceneType: DebateSceneType.OPENING,
      stance: 'positive'
    };

    console.log('初始化状态:', {
      status: this.state.status,
      currentSpeaker: this.state.currentSpeaker,
      nextSpeaker: this.state.nextSpeaker,
      speakersCount: this.state.speakingOrder.speakers.length,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        characterId: p.characterId
      }))
    });
    this.emitStateChange();
  }

  async startDebate(): Promise<void> {
    console.log('开始辩论，当前状态:', this.state.status);
    
    // 保存之前的状态
    this.previousState = { ...this.state };
    
    try {
      if (this.state.status !== DebateStatus.PREPARING) {
        throw new Error('辩论已经开始');
      }

      // 设置第一个发言者
      const firstSpeaker = this.state.speakingOrder.speakers[0]?.player;
      const secondSpeaker = this.state.speakingOrder.speakers[1]?.player;

      if (!firstSpeaker) {
        throw new Error('没有可用的发言者');
      }

      // 更新状态
      this.state = {
        ...this.state,
        status: DebateStatus.ONGOING,
        currentSpeaker: firstSpeaker,
        nextSpeaker: secondSpeaker,
        currentRound: 1,
        currentSpeech: null
      };

      // 触发状态更新
      this.emitStateChange();
      
      console.log('辩论开始成功，当前状态:', this.state.status);
    } catch (error) {
      // 发生错误时恢复之前的状态
      if (this.previousState) {
        this.state = this.previousState;
        this.emitStateChange();
      }
      console.error('开始辩论失败:', error);
      throw error;
    }
  }

  async pauseDebate(): Promise<void> {
    if (this.state.status !== DebateStatus.ONGOING) {
      throw new Error('辩论未在进行中');
    }

    this.state = {
      ...this.state,
      status: DebateStatus.PAUSED
    };

    this.emitStateChange();
  }

  async resumeDebate(): Promise<void> {
    if (this.state.status !== DebateStatus.PAUSED) {
      throw new Error('辩论未处于暂停状态');
    }

    this.state = {
      ...this.state,
      status: DebateStatus.ONGOING
    };

    this.emitStateChange();
  }

  async endDebate(): Promise<void> {
    this.state = {
      ...this.state,
      status: DebateStatus.COMPLETED
    };

    this.emitStateChange();
  }

  async submitSpeech(speech: SpeechInput): Promise<void> {
    console.log('【发言记录调试】submitSpeech - 输入参数:', {
      playerId: speech.playerId,
      type: speech.type,
      currentSpeakerId: this.state.currentSpeaker?.id,
      currentSpeakerCharacterId: this.state.currentSpeaker?.characterId
    });

    // 处理系统消息
    if (speech.type === 'system' || speech.playerId === 'system') {
      console.log('处理系统消息:', speech);
      // 保存系统消息到历史记录
      this.state.speeches.push({
        id: `system-${Date.now()}`,
        playerId: 'system',
        content: speech.content,
        type: 'system',
        timestamp: Date.now(),
        round: this.state.currentRound,
        role: 'system',
        characterId: 'system',
        characterName: 'System'
      });
      
      this.emitStateChange();
      
      // 如果是切换发言者的消息，执行切换
      if (speech.content.includes('切换下一位发言者') || speech.content.includes('进入下一轮')) {
        await this.moveToNextSpeaker();
      }
      return;
    }

    // 检查发言权限（仅对非系统消息）
    if (!this.state.currentSpeaker || this.state.currentSpeaker.id !== speech.playerId) {
      console.error('发言权限检查失败:', {
        currentSpeaker: this.state.currentSpeaker?.id,
        attemptingSpeaker: speech.playerId
      });
      throw new Error('不是当前发言者');
    }

    // 处理普通发言
    this.state.currentSpeech = {
      type: speech.type,
      content: speech.content,
      status: 'completed'
    };

    // 保存发言到历史记录
    this.state.speeches.push({
      id: `${speech.playerId}-${speech.type}-${Date.now()}`,
      playerId: speech.playerId,
      content: speech.content,
      type: speech.type,
      timestamp: Date.now(),
      round: this.state.currentRound,
      role: speech.type === 'innerThoughts' ? 'assistant' : 'user',
      characterId: this.state.currentSpeaker?.characterId,
      characterName: this.state.currentSpeaker?.name
    });
    
    console.log('【发言记录调试】submitSpeech - 保存的speech对象:', {
      playerId: speech.playerId,
      characterId: this.state.currentSpeaker?.characterId,
      characterName: this.state.currentSpeaker?.name,
      type: speech.type
    });
    
    this.emitStateChange();
  }

  getCurrentState(): DebateFlowState {
    return { ...this.state };
  }

  subscribeToStateChange(handler: StateChangeHandler): () => void {
    this.eventEmitter.on('stateChange', handler);
    return () => this.eventEmitter.off('stateChange', handler);
  }

  private getNextSpeaker(speakingOrder: SpeakingOrder): SpeakerInfo | null {
    const pendingSpeaker = speakingOrder.speakers.find(s => s.status === 'waiting');
    return pendingSpeaker ? pendingSpeaker.player : null;
  }

  private async moveToNextSpeaker(): Promise<void> {
    console.log('【发言记录调试】moveToNextSpeaker - 开始切换下一个发言者:', {
      currentSpeakerId: this.state.currentSpeaker?.id,
      currentSpeakerCharacterId: this.state.currentSpeaker?.characterId,
      nextSpeakerId: this.state.nextSpeaker?.id,
      nextSpeakerCharacterId: this.state.nextSpeaker?.characterId
    });
    
    // 如果没有下一个发言者，检查是否需要进入下一轮
    if (!this.state.nextSpeaker) {
      console.log('当前轮次所有发言者已完成');
      
      // 更新状态为等待评分
      this.state = {
        ...this.state,
        status: DebateStatus.ROUND_COMPLETE,
        currentSpeaker: null,
        nextSpeaker: null
      };
      
      this.emitStateChange();
      return;
    }

    // 更新当前发言者和下一个发言者
    const prevSpeaker = this.state.currentSpeaker;
    
    // 从原始玩家列表中获取完整的玩家信息
    const currentSpeakerInfo = this.state.speakingOrder.speakers.find(
      s => s.player.id === this.state.nextSpeaker?.id
    );
    
    console.log('【发言记录调试】moveToNextSpeaker - 找到的currentSpeakerInfo:', {
      found: !!currentSpeakerInfo,
      speakerId: currentSpeakerInfo?.player.id,
      characterId: currentSpeakerInfo?.player.characterId,
      name: currentSpeakerInfo?.player.name
    });
    
    if (!currentSpeakerInfo) {
      throw new Error(`找不到发言者信息: ${this.state.nextSpeaker?.id}`);
    }
    
    // 确保保留所有玩家属性
    this.state.currentSpeaker = { ...currentSpeakerInfo.player };
    
    // 更新发言顺序中的状态
    const currentSpeakerIndex = this.state.speakingOrder.speakers.findIndex(
      s => s.player.id === this.state.currentSpeaker?.id
    );
    
    if (currentSpeakerIndex !== -1) {
      // 将当前发言者标记为已完成
      this.state.speakingOrder.speakers[currentSpeakerIndex].status = 'finished';
      
      // 找到下一个待发言的人
      const nextSpeakerInfo = this.state.speakingOrder.speakers.find(s => s.status === 'waiting');
      // 同样确保保留所有玩家属性
      this.state.nextSpeaker = nextSpeakerInfo ? { ...nextSpeakerInfo.player } : null;
    }
    
    console.log('发言者更新:', {
      prevSpeaker: prevSpeaker?.id,
      currentSpeaker: this.state.currentSpeaker,
      nextSpeaker: this.state.nextSpeaker,
      currentSpeakerCharacterId: this.state.currentSpeaker.characterId
    });

    // 只有当发言者真正改变时才触发状态更新
    if (!prevSpeaker || prevSpeaker.id !== this.state.currentSpeaker.id) {
      this.emitStateChange();
    }

    // 如果是AI发言者，处理AI发言
    if (this.state.currentSpeaker.isAI) {
      await this.handleAISpeech(this.state.currentSpeaker);
    }
  }

  private async handleAISpeech(speaker: SpeakerInfo): Promise<void> {
    try {
      console.log('【发言记录调试】handleAISpeech - speaker信息:', {
        speakerId: speaker.id,
        characterId: speaker.characterId,
        name: speaker.name
      });
      
      this.updateDebateContext(speaker);
      
      // 初始化状态
      this.state.currentSpeech = {
        type: 'innerThoughts',
        content: '',
        status: 'streaming'
      };
      this.emitStateChange();

      console.group('=== 生成内心独白 ===');
      let chunkCount = 0;
      let accumulatedContent = '';
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 30; // 从50ms减少到30ms
      const MIN_CHARS_FOR_UPDATE = 5; // 新增：累积5个字符
      
      for await (const chunk of this.llmService.generateInnerThoughts(
        speaker,
        this.debateContext
      )) {
        chunkCount++;
        const currentTime = Date.now();
        const timeSinceLastUpdate = currentTime - lastUpdateTime;
        const newCharsCount = chunk.length;
        
        console.log(`处理数据块 ${chunkCount}:`, {
          chunkContent: chunk,
          chunkLength: chunk.length,
          timeSinceLastUpdate,
          willUpdate: timeSinceLastUpdate >= UPDATE_INTERVAL || newCharsCount >= MIN_CHARS_FOR_UPDATE
        });
        
        accumulatedContent += chunk;
        
        // 使用节流控制更新频率，或当新字符数达到阈值时更新
        if (timeSinceLastUpdate >= UPDATE_INTERVAL || newCharsCount >= MIN_CHARS_FOR_UPDATE) {
          if (this.state.currentSpeech) {
            console.log(`更新状态 - 数据块 ${chunkCount}:`, {
              contentLength: accumulatedContent.length,
              timestamp: currentTime,
              triggerReason: timeSinceLastUpdate >= UPDATE_INTERVAL ? 'interval' : 'chars'
            });
            
            this.state.currentSpeech = {
              type: 'innerThoughts',
              content: accumulatedContent,
              status: 'streaming'
            };
            this.emitStateChange();
            lastUpdateTime = currentTime;
          }
        }
      }
      console.log(`内心独白生成完成，共处理 ${chunkCount} 个数据块`);
      console.groupEnd();

      // 确保最后一次更新
      if (this.state.currentSpeech) {
        this.state.currentSpeech = {
          type: 'innerThoughts',
          content: accumulatedContent,
          status: 'completed'
        };
        this.emitStateChange();
        
        const innerThoughts = accumulatedContent;
        
        // 保存内心独白到历史记录
        this.state.speeches.push({
          id: `${speaker.id}-innerThoughts-${Date.now()}`,
          playerId: speaker.id,
          content: innerThoughts,
          type: 'innerThoughts',
          timestamp: Date.now(),
          round: this.state.currentRound,
          role: 'assistant',
          characterId: speaker.characterId,
          characterName: speaker.name
        });

        // 生成正式发言
        this.state.currentSpeech = {
          type: 'speech',
          content: '',
          status: 'streaming'
        };
        this.emitStateChange();

        console.group('=== 生成正式发言 ===');
        chunkCount = 0;
        accumulatedContent = '';
        lastUpdateTime = Date.now();
        const UPDATE_INTERVAL = 20; // 进一步降低到20ms
        const MIN_CHARS_FOR_UPDATE = 3; // 降低到3个字符
        const MAX_BUFFER_SIZE = 10; // 最大缓冲区大小（字符数）
        let bufferContent = '';
        
        for await (const chunk of this.llmService.generateSpeech(
          speaker,
          this.debateContext,
          innerThoughts
        )) {
          chunkCount++;
          const currentTime = Date.now();
          const timeSinceLastUpdate = currentTime - lastUpdateTime;
          
          bufferContent += chunk;
          const shouldUpdate = 
            timeSinceLastUpdate >= UPDATE_INTERVAL || 
            bufferContent.length >= MIN_CHARS_FOR_UPDATE ||
            bufferContent.length >= MAX_BUFFER_SIZE;
          
          console.log(`接收到第 ${chunkCount} 个数据块:`, {
            length: chunk.length,
            content: chunk,
            bufferLength: bufferContent.length,
            timeSinceLastUpdate,
            willUpdate: shouldUpdate
          });
          
          if (shouldUpdate) {
            accumulatedContent += bufferContent;
            
            if (this.state.currentSpeech) {
              console.log(`更新正式发言状态 - 数据块 ${chunkCount}:`, {
                contentLength: accumulatedContent.length,
                bufferLength: bufferContent.length,
                timestamp: currentTime,
                triggerReason: timeSinceLastUpdate >= UPDATE_INTERVAL ? 'interval' : 
                             bufferContent.length >= MAX_BUFFER_SIZE ? 'buffer_full' : 'chars'
              });
              
              this.state.currentSpeech = {
                type: 'speech',
                content: accumulatedContent,
                status: 'streaming'
              };
              this.emitStateChange();
              lastUpdateTime = currentTime;
              bufferContent = ''; // 清空缓冲区
            }
          }
        }
        console.log(`正式发言生成完成，共处理 ${chunkCount} 个数据块`);
        console.groupEnd();

        // 确保最后一次更新
        if (this.state.currentSpeech) {
          this.state.currentSpeech = {
            type: 'speech',
            content: accumulatedContent,
            status: 'completed'
          };
          this.emitStateChange();
          
          // 保存正式发言到历史记录
          this.state.speeches.push({
            id: `${speaker.id}-speech-${Date.now()}`,
            playerId: speaker.id,
            content: accumulatedContent,
            type: 'speech',
            timestamp: Date.now(),
            round: this.state.currentRound,
            role: 'assistant',
            characterId: speaker.characterId,
            characterName: speaker.name
          });
        }
      }
    } catch (error) {
      console.error('AI发言生成失败:', error);
      this.state.currentSpeech = {
        type: 'speech',
        content: '很抱歉，我暂时无法生成合适的发言。',
        status: 'failed'
      };
      this.emitStateChange();
    }
  }

  private updateDebateContext(speaker: SpeakerInfo): void {
    // 更新场景类型
    if (this.state.currentRound === 1) {
      this.debateContext.sceneType = DebateSceneType.OPENING;
    } else {
      const lastSpeech = this.state.speeches[this.state.speeches.length - 1];
      this.debateContext.sceneType = lastSpeech && lastSpeech.type === 'speech'
        ? DebateSceneType.REBUTTAL
        : DebateSceneType.DEFENSE;
    }

    // 更新立场
    this.debateContext.stance = speaker.team === 'affirmative' ? 'positive' : 'negative';

    // 更新其他上下文信息
    this.debateContext.currentRound = this.state.currentRound;
    this.debateContext.previousSpeeches = this.state.speeches;
  }

  private emitStateChange(): void {
    // 创建一个新的状态对象
    const newState = {
      ...this.state,
      currentSpeech: this.state.currentSpeech 
        ? { 
            type: this.state.currentSpeech.type,
            content: this.state.currentSpeech.content,
            status: this.state.currentSpeech.status,
            // 添加时间戳到currentSpeech对象
            _timestamp: Date.now()
          } 
        : null,
      // 移除全局时间戳，改为只在currentSpeech中使用
      _lastUpdate: Date.now()
    };
    
    // 使用Promise.resolve().then确保在微任务队列中执行
    Promise.resolve().then(() => {
      this.eventEmitter.emit('stateChange', newState);
    });
  }

  async skipCurrentSpeaker(): Promise<void> {
    if (!this.state.currentSpeaker) {
      throw new Error('没有正在发言的选手');
    }


    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  async handlePlayerExit(playerId: string): Promise<void> {
    this.state.speakingOrder = this.speakingOrderManager.handlePlayerExit(
      this.state.speakingOrder,
      playerId
    );

    if (this.state.currentSpeaker?.id === playerId) {
      await this.moveToNextSpeaker();
    }

    this.emitStateChange();
  }

  async handlePlayerRejoin(player: Player): Promise<void> {
    this.state.speakingOrder = this.speakingOrderManager.handlePlayerRejoin(
      this.state.speakingOrder,
      player
    );

    this.emitStateChange();
  }

  // 添加开始评分的方法
  async startScoring(): Promise<void> {
    if (this.state.status !== DebateStatus.ROUND_COMPLETE) {
      throw new Error('当前状态不允许评分');
    }

    try {
      // 获取当前轮次的所有发言
      const roundSpeeches = this.state.speeches.filter(
        speech => speech.round === this.state.currentRound
      );

      if (roundSpeeches.length === 0) {
        throw new Error('当前轮次没有可评分的发言');
      }

      // 获取评分规则
      const gameConfig = await this.storeManager.getStore('gameConfig').getState();
      if (!gameConfig?.debate?.judging) {
        throw new Error('未找到评分规则配置');
      }

      const { selectedJudge, dimensions } = gameConfig.debate.judging;
      if (!selectedJudge || !dimensions) {
        throw new Error('评分配置不完整');
      }

      // 获取裁判角色配置
      const characterConfigsStr = localStorage.getItem('character_configs');
      if (!characterConfigsStr) {
        throw new Error('未找到角色配置数据');
      }
      
      const characterConfigs = JSON.parse(characterConfigsStr);
      const judge = characterConfigs.find((char: any) => char.id === selectedJudge.id);
      
      if (!judge) {
        throw new Error(`未找到ID为 ${selectedJudge.id} 的裁判角色配置`);
      }

      // 初始化评分系统
      const llmService = new LLMService();
      await llmService['initialize'](judge.id);
      const scoringSystem = new ScoringSystem(llmService);

      // 设置评分事件监听
      scoringSystem.onCommentStart(() => {
        this.eventEmitter.emit('scoring:comment_start');
      });

      scoringSystem.onCommentUpdate((chunk: string) => {
        this.eventEmitter.emit('scoring:comment_update', chunk);
      });

      scoringSystem.onCommentComplete((comment: string) => {
        this.eventEmitter.emit('scoring:comment_complete', comment);
      });

      scoringSystem.onDimensionUpdate(({ dimension, score }) => {
        this.eventEmitter.emit('scoring:dimension_update', { dimension, score });
      });

      // 为每个发言生成评分
      console.group('=== 开始LLM评分流程 ===');
      console.log('评分配置:', {
        judgeId: judge.id,
        judgeName: judge.name,
        dimensions: dimensions
      });

      const roundScores = await Promise.all(
        roundSpeeches.map(async speech => {
          console.group(`正在为发言 ${speech.id} 生成评分`);
          console.log('发言内容:', speech.content);
          
          const processedSpeech: ProcessedSpeech = {
            ...speech,
            metadata: {
              wordCount: speech.content.split(/\s+/).length
            }
          };

          const scoringContext: ScoringContext = {
            judge: {
              id: judge.id,
              name: judge.name,
              characterConfig: judge
            },
            rules: {
              dimensions: dimensions.map((dim: ScoringDimension) => ({
                name: dim.name,
                weight: dim.weight,
                description: dim.description,
                criteria: dim.criteria
              }))
            },
            previousScores: this.state.scores
          };

          console.log('评分上下文:', {
            judge: scoringContext.judge,
            dimensions: scoringContext.rules.dimensions,
            previousScoresCount: scoringContext.previousScores.length
          });

          try {
            console.log('调用LLM评分服务...');
            const score = await scoringSystem.generateScore(processedSpeech, scoringContext);
            console.log('LLM评分结果:', {
              dimensions: score.dimensions,
              totalScore: score.totalScore,
              commentLength: score.comment.length
            });
            console.groupEnd();
            return score;
          } catch (error) {
            console.error(`为发言 ${speech.id} 生成评分失败:`, error);
            console.groupEnd();
            throw error;
          }
        })
      );

      console.log(`成功生成 ${roundScores.length} 条评分:`, roundScores);
      console.groupEnd();

      // 更新状态中的评分
      this.state = {
        ...this.state,
        scores: [...this.state.scores, ...roundScores]
      };

      // 发送评分完成事件
      this.eventEmitter.emit('scoring:complete', roundScores);

    } catch (error) {
      console.error('评分过程出错:', error);
      throw error;
    } finally {
      // 清理评分系统的事件监听
      if (this.scoringSystem) {
        this.scoringSystem.removeAllListeners();
      }
    }
  }

  // 添加开始新一轮的方法
  async startNextRound(): Promise<void> {
    console.log('开始新一轮:', {
      currentRound: this.state.currentRound,
      totalRounds: this.state.totalRounds,
      status: this.state.status
    });

    // 1. 验证当前状态
    if (this.state.status !== DebateStatus.SCORING && this.state.status !== DebateStatus.ROUND_COMPLETE) {
      console.error('当前状态不允许开始新一轮:', this.state.status);
      throw new Error('当前状态不允许开始新一轮');
    }

    // 2. 检查是否可以进入下一轮
    if (this.state.currentRound >= this.state.totalRounds) {
      console.log('所有轮次已完成');
      this.state = {
        ...this.state,
        status: DebateStatus.COMPLETED
      };
      this.emitStateChange();
      return;
    }

    // 3. 重置所有发言者状态
    const resetSpeakers = this.state.speakingOrder.speakers.map(speaker => ({
      ...speaker,
      status: 'waiting' as const
    }));

    // 4. 更新状态
    this.state = {
      ...this.state,
      currentRound: this.state.currentRound + 1,
      status: DebateStatus.ONGOING,
      currentSpeaker: null,
      nextSpeaker: resetSpeakers[0]?.player || null,
      speakingOrder: {
        ...this.state.speakingOrder,
        speakers: resetSpeakers,
        currentRound: this.state.currentRound + 1
      }
    };

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

    // 5. 确保发出状态变更事件
    this.emitStateChange();
    
    // 6. 如果有下一个发言者，自动开始第一个发言
    if (this.state.nextSpeaker) {
      await this.moveToNextSpeaker();
    }
  }

  private async validateScoringDimensions(dimensions: ScoringDimension[]): Promise<boolean> {
    const requiredDimensions = new Set(['逻辑性', '创新性', '表达性', '互动性']);
    const providedDimensions = new Set(dimensions.map((dim: ScoringDimension) => dim.name));
    
    return Array.from(requiredDimensions).every((dim: string) => providedDimensions.has(dim));
  }

  // 重置当前轮次的评分
  async resetCurrentRoundScoring(): Promise<void> {
    console.log('重置当前轮次评分');
    try {
      // 移除当前轮次的所有评分
      this.state = {
        ...this.state,
        scores: this.state.scores.filter(score => score.round !== this.state.currentRound)
      };
      
      // 重置状态为轮次完成，准备重新评分
      this.state.status = DebateStatus.ROUND_COMPLETE;
      
      // 发出状态变更事件
      this.emitStateChange();
      
      // 重新开始评分
      await this.startScoring();
    } catch (error) {
      console.error('重置评分失败:', error);
      throw error;
    }
  }
} 