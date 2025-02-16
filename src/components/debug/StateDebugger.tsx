import React, { useEffect, useState, useMemo, useCallback } from 'react';
import styled from '@emotion/styled';
import { useUnifiedState } from '../../modules/state';
import { StoreManager } from '../../modules/state/core/StoreManager';
import { useStore } from '../../modules/state';
import { GameConfigStore } from '../../modules/state/stores/GameConfigStore';
import { useDebateFlow } from '../../modules/debate/hooks/useDebateFlow';
import { DebateRole } from '../../types/roles';
import { DebateStatus } from '../../types/adapters';
import type { UnifiedPlayer } from '../../types/adapters';
import type { BaseDebateSpeech } from '../../types/adapters';
import type { DebateState } from '../../modules/state/types/session';
import type { Score } from '../../types/adapters';

const Container = styled.div`
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 400px;
  max-height: 600px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 8px;
  padding: 16px;
  font-family: monospace;
  z-index: 9999;
  overflow: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  margin: 0;
  color: #1890ff;
`;

const Button = styled.button`
  background: #1890ff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const StateView = styled.pre`
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const StateSection = styled.div`
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  color: #1890ff;
`;

const UpdateTime = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
`;

const DebugContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  max-width: 400px;
  max-height: 300px;
  overflow: auto;
`;

const DebugSection = styled.div`
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DebugTitle = styled.h4`
  margin: 0 0 5px;
  color: #1890ff;
  font-size: 14px;
`;

const DebugContent = styled.div`
  font-size: 12px;
  color: #ccc;
  line-height: 1.4;
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
`;

const SuccessMessage = styled.div`
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
`;

const DebugGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
`;

const DebugItem = styled.div`
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  font-size: 12px;
`;

const DebugLabel = styled.span`
  color: #1890ff;
  margin-right: 8px;
`;

const DebugValue = styled.span`
  color: #fff;
`;

const DebugList = styled.div`
  margin-top: 4px;
  margin-left: 12px;
`;

const DebugListItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 11px;
  color: #ccc;
`;

// 添加评分调试相关的样式组件
const ScoreDebugSection = styled(DebugSection)`
  border-left: 2px solid #1890ff;
`;

const ScoreList = styled.div`
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const ScoreItem = styled.div`
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 4px;
  font-size: 12px;
`;

const ScoreDimension = styled.div`
  display: flex;
  justify-content: space-between;
  color: #888;
  margin-top: 4px;
`;

const gameConfigStore = GameConfigStore.getInstance();

interface StateDebuggerProps {
  state: {
    configState?: {
      activeConfig: {
        debate: {
          topic: {
            title: string;
            description: string;
            rounds: number;
          };
        };
      };
    };
    debateState?: {
      status: string;
      progress: {
        currentRound: number;
      };
      currentSpeaker: UnifiedPlayer | null;
      history: {
        speeches: BaseDebateSpeech[];
        scores: Score[];
      };
    };
    debate?: {
      topic: {
        title: string;
        description: string;
        rounds: number;
      };
      rules: {
        debateFormat: string;
        description: string;
        advancedRules: {
          speechLengthLimit: {
            min: number;
            max: number;
          };
          allowQuoting: boolean;
          requireResponse: boolean;
          allowStanceChange: boolean;
          requireEvidence: boolean;
        };
      };
      judging: any;
      status: string | undefined;
      currentRound: number;
      currentSpeaker: UnifiedPlayer | null;
      speeches: BaseDebateSpeech[];
      scores: Score[];
      format: 'structured' | 'free';
      autoAssign?: boolean;
      minPlayers?: number;
      maxPlayers?: number;
      affirmativeCount?: number;
      negativeCount?: number;
      judgeCount?: number;
      timekeeperCount?: number;
    };
    players?: UnifiedPlayer[];
    isConfiguring?: boolean;
  };
  onToggleDebugger: () => void;
}

interface DebugState {
  debate: {
    status: string;
    currentRound: number;
    totalRounds: number;
    currentSpeaker: UnifiedPlayer | null;
    nextSpeaker: UnifiedPlayer | null;
    history: {
      speeches: BaseDebateSpeech[];
      scores: Score[];
    };
  };
}

export const StateDebugger: React.FC<StateDebuggerProps> = ({ state, onToggleDebugger }) => {
  const { state: gameConfig } = useStore('gameConfig');
  const [isVisible, setIsVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const storeManager = StoreManager.getInstance();
  const [storeState, setStoreState] = useState(gameConfigStore.getState());
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [debugState, setDebugState] = useState<DebugState | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<string, number>>({});

  // 使用 useEffect 监听传入的 state 属性变化
  useEffect(() => {
    if ((state?.debateState || state?.debate) && (state?.configState || state?.debate)) {
      const scores = state.debateState?.history?.scores || state.debate?.scores || [];
      
      setDebugState(prev => ({
        ...prev,
        debate: {
          status: state.debateState?.status || state.debate?.status || '',
          currentRound: state.debateState?.progress?.currentRound || state.debate?.currentRound || 1,
          totalRounds: state.configState?.activeConfig.debate.topic.rounds || state.debate?.topic.rounds || 1,
          currentSpeaker: state.debateState?.currentSpeaker || state.debate?.currentSpeaker || null,
          nextSpeaker: null,
          history: {
            speeches: state.debateState?.history.speeches || state.debate?.speeches || [],
            scores: scores
          }
        }
      }));
      setLastUpdate(Date.now());
    }
  }, [
    state?.debateState?.status,
    state?.debateState?.progress?.currentRound,
    state?.debateState?.currentSpeaker?.id,
    state?.debateState?.history?.speeches?.length,
    state?.debateState?.history?.scores?.length,
    state?.configState?.activeConfig?.debate?.topic?.rounds,
    state?.debate?.status,
    state?.debate?.currentRound,
    state?.debate?.currentSpeaker?.id,
    state?.debate?.speeches?.length,
    state?.debate?.scores?.length,
    state?.debate?.topic?.rounds,
    JSON.stringify(state?.debateState?.history?.scores),
    JSON.stringify(state?.debate?.scores)
  ]);

  // 使用 useEffect 监听 gameConfig 变化
  useEffect(() => {
    const unsubscribeConfig = gameConfigStore.subscribe((newState) => {
      setStoreState(newState);
      setLastUpdate(Date.now());
    });

    // 设置定期刷新以确保UI更新
    const refreshInterval = setInterval(() => {
      if (debugState) {
        setLastUpdate(Date.now());
      }
    }, 500); // 每500ms检查一次

    return () => {
      unsubscribeConfig();
      clearInterval(refreshInterval);
    };
  }, [debugState]);

  const getDebateFlowInfo = useCallback(() => {
    if (!debugState?.debate) return null;
    
    return {
      isInitialized: Boolean(debugState.debate),
      currentStatus: debugState.debate.status,
      progress: `${debugState.debate.currentRound}/${debugState.debate.totalRounds}`,
      activeSpeaker: debugState.debate.currentSpeaker?.name || '无',
      nextSpeaker: debugState.debate.nextSpeaker?.name || '无',
      speechCount: debugState.debate.history.speeches.length || 0,
      scoreCount: debugState.debate.history.scores.length || 0,
      lastUpdateTime: new Date().toLocaleTimeString()
    };
  }, [debugState]);

  const renderSpeechHistory = useCallback(() => {
    const speeches = debugState?.debate?.history?.speeches || [];
    if (speeches.length === 0) {
      return <div>暂无发言记录</div>;
    }
    return (
      <DebugList>
        {speeches.slice(-5).map((speech: BaseDebateSpeech) => (
          <DebugListItem key={speech.id}>
            <span>
              [{speech.round}] {speech.playerId} - {speech.type}
            </span>
            <span>{new Date(speech.timestamp).toLocaleTimeString()}</span>
          </DebugListItem>
        ))}
      </DebugList>
    );
  }, [debugState?.debate?.history?.speeches]);

  const renderScores = useCallback(() => {
    const scores = debugState?.debate?.history?.scores || [];
    if (!scores || scores.length === 0) {
      return <div>暂无评分记录</div>;
    }

    return (
      <ScoreList>
        {scores.map((score, index) => (
          <ScoreItem key={score.id || index}>
            <div>
              <strong>轮次:</strong> {score.round}
            </div>
            <div>
              <strong>发言ID:</strong> {score.speechId}
            </div>
            <div>
              <strong>选手ID:</strong> {score.playerId}
            </div>
            <div>
              <strong>总分:</strong> {score.totalScore}
            </div>
            {Object.entries(score.dimensions || {}).map(([dimension, value]) => (
              <ScoreDimension key={dimension}>
                <span>{dimension}:</span>
                <span>{String(value)}</span>
              </ScoreDimension>
            ))}
          </ScoreItem>
        ))}
      </ScoreList>
    );
  }, [debugState?.debate?.history?.scores]);

  // 使用 useMemo 缓存配置对象，并添加深度比较
  const debateConfig = useMemo(() => {
    if (!gameConfig?.debate) {
      console.log('No debate config found');
      return undefined;
    }
    
    // 检查玩家配置的完整性
    const players = Object.values(gameConfig.players || {}).map(player => {
      // 检查并记录玩家信息
      console.log('Processing player:', player);
      
      // 确保玩家角色正确分配
      let role: DebateRole = player.role || 'unassigned';
      let team: "affirmative" | "negative" | undefined;

      if (role === 'unassigned') {
        console.warn(`Player ${player.name} has unassigned role`);
        
        // 根据辩论格式分配角色
        const debateFormat = gameConfig.debate?.rules.debateFormat;
        if (debateFormat === 'structured') {
          // 结构化辩论模式
          const playerIndex = parseInt(player.id);
          if (playerIndex <= 2) {
            role = playerIndex === 1 ? 'affirmative1' : 'affirmative2';
            team = "affirmative";
          } else {
            role = playerIndex === 3 ? 'negative1' : 'negative2';
            team = "negative";
          }
        } else {
          // 自由辩论模式 - 使用 free 角色
          role = 'free';
          team = undefined;
        }
      } else {
        // 根据现有角色确定队伍
        if (role.includes('affirmative')) {
          team = "affirmative";
        } else if (role.includes('negative')) {
          team = "negative";
        } else if (role === 'free') {
          team = undefined;
        } else {
          console.warn(`Player ${player.name} has invalid role: ${role}`);
          team = undefined;
        }
      }

      return {
        id: player.id,
        name: player.name,
        isAI: player.isAI,
        role,
        team,
        characterConfig: player.characterId ? {
          id: player.characterId,
          personality: player.personality || '',
          speakingStyle: player.speakingStyle || '',
          background: player.background || '',
          values: player.values ? [player.values] : [],
          argumentationStyle: player.argumentationStyle || ''
        } : undefined
      };
    });

    // 检查是否所有必要的玩家角色都已分配
    const debateFormat = gameConfig.debate?.rules.debateFormat;
    if (debateFormat === 'structured') {
      const hasAffirmative = players.some(p => p.team === 'affirmative');
      const hasNegative = players.some(p => p.team === 'negative');
      
      if (!hasAffirmative || !hasNegative) {
        console.warn('Missing required team roles in structured debate:', {
          hasAffirmative,
          hasNegative,
          players: players.map(p => ({ name: p.name, role: p.role, team: p.team }))
        });
      }
    }

    const rules = {
      debateFormat: gameConfig.debate.rules.debateFormat as 'structured' | 'free',
      canSkipSpeaker: Boolean(gameConfig.debate.rules.advancedRules?.allowQuoting),
      requireInnerThoughts: Boolean(gameConfig.debate.rules.advancedRules?.requireResponse)
    };

    const judge = gameConfig.debate.judging?.dimensions ? {
      id: 'judge-1',
      name: '评委',
      characterId: 'judge-character-1',
      characterConfig: {
        id: 'judge-character-1',
        personality: '公正严谨',
        speakingStyle: '专业客观',
        background: '资深辩论裁判',
        values: ['公平', '专业'],
        argumentationStyle: '逻辑严密'
      }
    } : undefined;

    const config = {
      topic: {
        title: gameConfig.debate.topic.title,
        description: gameConfig.debate.topic.description || '',
        rounds: gameConfig.debate.topic.rounds
      },
      players,
      rules,
      judge
    };

    // 打印完整的配置对象以便调试
    console.log('Debate config created:', JSON.stringify(config, null, 2));

    return config;
  }, [
    gameConfig?.debate?.topic.title,
    gameConfig?.debate?.topic.description,
    gameConfig?.debate?.topic.rounds,
    gameConfig?.debate?.rules.debateFormat,
    gameConfig?.debate?.rules.advancedRules?.allowQuoting,
    gameConfig?.debate?.rules.advancedRules?.requireResponse,
    gameConfig?.debate?.judging?.dimensions,
    JSON.stringify(gameConfig?.players)
  ]);

  // 使用 useDebateFlow 获取辩论流程状态
  const { state: debateFlowState, error: debateFlowError } = useDebateFlow(debateConfig);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 添加更多调试信息的处理函数
  const getPlayerRoleInfo = useCallback((players: any[]) => {
    const roleCount = {
      affirmative: 0,
      negative: 0,
      unassigned: 0
    };
    
    players.forEach(player => {
      if (player.role?.includes('affirmative')) {
        roleCount.affirmative++;
      } else if (player.role?.includes('negative')) {
        roleCount.negative++;
      } else {
        roleCount.unassigned++;
      }
    });
    
    return roleCount;
  }, []);

  const getConfigValidationInfo = useCallback(() => {
    if (!gameConfig?.debate) return null;
    
    const validation = {
      hasValidTopic: Boolean(gameConfig.debate.topic?.title),
      hasValidRounds: gameConfig.debate.topic?.rounds > 0,
      hasValidFormat: ['structured', 'free'].includes(gameConfig.debate.rules?.debateFormat),
      hasValidPlayers: Object.keys(gameConfig.players || {}).length > 0,
      hasValidJudging: Boolean(gameConfig.debate.judging?.dimensions)
    };
    
    return validation;
  }, [gameConfig]);

  // 修改评分状态展示部分
  const renderScoreSection = () => {
    const scores = debugState?.debate?.history?.scores || [];
    const currentRound = debugState?.debate?.currentRound || 1;
    
    return (
      <ScoreDebugSection>
        <DebugTitle>评分状态</DebugTitle>
        <DebugContent>
          <DebugGrid>
            <DebugItem>
              <DebugLabel>总评分数:</DebugLabel>
              <DebugValue>{scores.length}</DebugValue>
            </DebugItem>
            <DebugItem>
              <DebugLabel>当前轮次评分:</DebugLabel>
              <DebugValue>
                {scores.filter(s => s.round === currentRound).length}
              </DebugValue>
            </DebugItem>
            {scores.length > 0 && (
              <DebugItem>
                <DebugLabel>最新评分时间:</DebugLabel>
                <DebugValue>
                  {new Date(scores[scores.length - 1].timestamp).toLocaleTimeString()}
                </DebugValue>
              </DebugItem>
            )}
          </DebugGrid>
          {renderScores()}
        </DebugContent>
      </ScoreDebugSection>
    );
  };

  if (!isVisible) {
    return (
      <Button
        style={{ position: 'fixed', right: '20px', bottom: '20px' }}
        onClick={toggleVisibility}
      >
        显示状态
      </Button>
    );
  }

  const getLastUpdateTime = (namespace: string) => {
    try {
      const store = storeManager.getStore(namespace);
      const metadata = store.getMetadata();
      return new Date(metadata.lastUpdated).toLocaleString();
    } catch {
      return '未知';
    }
  };

  return (
    <Container>
      <Header>
        <Title>辩论室状态调试器 v2.0</Title>
        <div>
          <UpdateTime>最后更新: {new Date(lastUpdate).toLocaleTimeString()}</UpdateTime>
          <Button onClick={() => setViewMode(viewMode === 'simple' ? 'detailed' : 'simple')}>
            {viewMode === 'simple' ? '详细视图' : '简单视图'}
          </Button>
          <Button onClick={toggleVisibility}>隐藏</Button>
        </div>
      </Header>

      {viewMode === 'simple' ? (
        <>
          {/* 游戏配置验证 */}
          <DebugSection>
            <DebugTitle>配置验证状态</DebugTitle>
            <DebugContent>
              {(() => {
                const validation = getConfigValidationInfo();
                if (!validation) return <div>未找到配置</div>;
                
                return (
                  <DebugGrid>
                    <DebugItem>
                      <DebugLabel>主题:</DebugLabel>
                      <DebugValue>{validation.hasValidTopic ? '✅' : '❌'}</DebugValue>
                    </DebugItem>
                    <DebugItem>
                      <DebugLabel>回合:</DebugLabel>
                      <DebugValue>{validation.hasValidRounds ? '✅' : '❌'}</DebugValue>
                    </DebugItem>
                    <DebugItem>
                      <DebugLabel>格式:</DebugLabel>
                      <DebugValue>{validation.hasValidFormat ? '✅' : '❌'}</DebugValue>
                    </DebugItem>
                    <DebugItem>
                      <DebugLabel>玩家:</DebugLabel>
                      <DebugValue>{validation.hasValidPlayers ? '✅' : '❌'}</DebugValue>
                    </DebugItem>
                  </DebugGrid>
                );
              })()}
            </DebugContent>
          </DebugSection>

          {/* 玩家角色分配 */}
          <DebugSection>
            <DebugTitle>玩家角色分配</DebugTitle>
            <DebugContent>
              {(() => {
                const players = Object.values(gameConfig?.players || {});
                const roleInfo = getPlayerRoleInfo(players);
                
                return (
                  <>
                    <DebugGrid>
                      <DebugItem>
                        <DebugLabel>正方:</DebugLabel>
                        <DebugValue>{roleInfo.affirmative}</DebugValue>
                      </DebugItem>
                      <DebugItem>
                        <DebugLabel>反方:</DebugLabel>
                        <DebugValue>{roleInfo.negative}</DebugValue>
                      </DebugItem>
                      <DebugItem>
                        <DebugLabel>未分配:</DebugLabel>
                        <DebugValue>{roleInfo.unassigned}</DebugValue>
                      </DebugItem>
                      <DebugItem>
                        <DebugLabel>总计:</DebugLabel>
                        <DebugValue>{players.length}</DebugValue>
                      </DebugItem>
                    </DebugGrid>
                    
                    <DebugList>
                      {players.map((player: any) => (
                        <DebugListItem key={player.id}>
                          <span>{player.name}</span>
                          <span style={{
                            color: player.role === 'unassigned' ? '#ff4d4f' : 
                                  player.role === 'free' ? '#722ed1' :
                                  player.role?.includes('affirmative') ? '#52c41a' : 
                                  player.role?.includes('negative') ? '#1890ff' : '#d9d9d9'
                          }}>
                            {player.role}
                          </span>
                        </DebugListItem>
                      ))}
                    </DebugList>
                  </>
                );
              })()}
            </DebugContent>
          </DebugSection>

          {/* 辩论流程状态 */}
          <DebugSection>
            <DebugTitle>辩论流程状态</DebugTitle>
            <DebugContent>
              {(() => {
                const flowInfo = getDebateFlowInfo();
                if (!flowInfo) return <div>未初始化辩论流程</div>;
                
                return (
                  <>
                    <DebugGrid>
                      <DebugItem>
                        <DebugLabel>状态:</DebugLabel>
                        <DebugValue>{flowInfo.currentStatus}</DebugValue>
                      </DebugItem>
                      <DebugItem>
                        <DebugLabel>进度:</DebugLabel>
                        <DebugValue>{flowInfo.progress}</DebugValue>
                      </DebugItem>
                      <DebugItem>
                        <DebugLabel>当前发言:</DebugLabel>
                        <DebugValue>{flowInfo.activeSpeaker}</DebugValue>
                      </DebugItem>
                      <DebugItem>
                        <DebugLabel>下一发言:</DebugLabel>
                        <DebugValue>{flowInfo.nextSpeaker}</DebugValue>
                      </DebugItem>
                    </DebugGrid>

                    {flowInfo && debateFlowState?.currentSpeech && (
                      <DebugList>
                        <DebugListItem>
                          <span>发言类型:</span>
                          <span>{debateFlowState?.currentSpeech?.type}</span>
                        </DebugListItem>
                        <DebugListItem>
                          <span>发言状态:</span>
                          <span>{debateFlowState?.currentSpeech?.status}</span>
                        </DebugListItem>
                      </DebugList>
                    )}
                  </>
                );
              })()}

              {debateFlowError && (
                <ErrorMessage>
                  错误: {debateFlowError.message}
                </ErrorMessage>
              )}
            </DebugContent>
          </DebugSection>

          {/* 发言历史记录 */}
          <DebugSection>
            <DebugTitle>发言历史记录</DebugTitle>
            <DebugContent>
              {renderSpeechHistory()}
            </DebugContent>
          </DebugSection>

          {/* 使用新的评分部分 */}
          {renderScoreSection()}
        </>
      ) : (
        <StateView>
          {JSON.stringify({
            gameConfig: storeState,
            debateFlow: debateFlowState,
            error: debateFlowError,
            scores: debugState?.debate?.history?.scores
          }, null, 2)}
        </StateView>
      )}
    </Container>
  );
}; 