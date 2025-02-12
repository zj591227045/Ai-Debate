import { useEffect } from 'react';
import { useStore, useStorePersistence } from '../modules/state';
import { StateLogger } from '../modules/state/utils';
import { StoreError } from '../modules/state/types/error';
import { GameConfigStore } from '../modules/state/stores/GameConfigStore';

const logger = StateLogger.getInstance();
const gameConfigStore = GameConfigStore.getInstance();

export function GameConfig() {
  const { state: gameConfig, setState: setGameConfig } = useStore('gameConfig');

  // 记录初始化和状态变更
  useEffect(() => {
    logger.debug('gameConfig', '组件初始化', {
      initialState: gameConfig,
      timestamp: new Date().toISOString(),
      source: 'GameConfig.init'
    });
    
    return () => {
      logger.debug('gameConfig', '组件卸载', {
        finalState: gameConfig,
        timestamp: new Date().toISOString(),
        source: 'GameConfig.cleanup'
      });
    };
  }, []);

  useEffect(() => {
    logger.debug('gameConfig', '状态发生变化', {
      newState: gameConfig,
      timestamp: new Date().toISOString(),
      source: 'GameConfig.stateChange'
    });
  }, [gameConfig]);

  // 更新主题
  const handleTopicChange = (title: string) => {
    if (!gameConfig?.debate) return;
    
    logger.debug('gameConfig', '更新主题', {
      oldTitle: gameConfig.debate.topic.title,
      newTitle: title,
      timestamp: new Date().toISOString(),
      source: 'GameConfig.topicChange'
    });
    
    gameConfigStore.updateTopicConfig({ title });
  };

  // 更新规则
  const handleRulesChange = (debateFormat: string) => {
    if (!gameConfig?.debate) return;
    
    logger.debug('gameConfig', '更新规则', {
      oldFormat: gameConfig.debate.rules.debateFormat,
      newFormat: debateFormat,
      timestamp: new Date().toISOString(),
      source: 'GameConfig.rulesChange'
    });
    
    gameConfigStore.updateRuleConfig({ debateFormat });
  };

  // 更新主题描述
  const handleDescriptionChange = (description: string) => {
    gameConfigStore.updateTopicConfig({
      description
    });
  };

  return (
    <div>
      <h2>游戏配置</h2>
      
      {gameConfig?.debate ? (
        <>
          {/* 主题配置 */}
          <section>
            <h3>主题设置</h3>
            <input
              value={gameConfig.debate.topic.title}
              onChange={e => handleTopicChange(e.target.value)}
              placeholder="输入主题标题"
            />
            <textarea
              value={gameConfig.debate.topic.description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder="输入主题描述"
            />
          </section>

          {/* 规则配置 */}
          <section>
            <h3>规则设置</h3>
            <div>
              <label>辩论格式：</label>
              <select
                value={gameConfig.debate.rules.debateFormat}
                onChange={e => handleRulesChange(e.target.value)}
              >
                <option value="structured">结构化辩论</option>
                <option value="free">自由辩论</option>
              </select>
            </div>
          </section>
        </>
      ) : (
        <div>加载中...</div>
      )}

      {/* 持久化控制 */}
      <section>
        <SaveConfigButton />
        <LoadConfigButton />
        <ResetConfigButton />
      </section>
    </div>
  );
}

// 保存配置按钮组件
function SaveConfigButton() {
  const { state: gameConfig } = useStore('gameConfig');
  const { persist } = useStorePersistence('gameConfig');
  
  return (
    <button onClick={async () => {
      try {
        await persist();
        logger.debug('gameConfig', '手动保存配置', {
          state: gameConfig,
          timestamp: new Date().toISOString(),
          source: 'SaveConfigButton'
        });
      } catch (error) {
        logger.error('gameConfig', '手动保存配置失败', error instanceof Error ? error : new Error('Unknown error'));
      }
    }}>
      保存配置
    </button>
  );
}

// 加载配置按钮组件
function LoadConfigButton() {
  const { hydrate } = useStorePersistence('gameConfig');
  
  return (
    <button onClick={async () => {
      try {
        await hydrate();
        logger.debug('gameConfig', '手动加载配置成功', {
          timestamp: new Date().toISOString(),
          source: 'LoadConfigButton'
        });
      } catch (error) {
        logger.error('gameConfig', '手动加载配置失败', error instanceof Error ? error : new Error('Unknown error'));
      }
    }}>
      加载配置
    </button>
  );
}

// 重置配置按钮组件
function ResetConfigButton() {
  return (
    <button onClick={() => {
      try {
        gameConfigStore.resetConfig();
        logger.debug('gameConfig', '手动重置配置成功', {
          timestamp: new Date().toISOString(),
          source: 'ResetConfigButton'
        });
      } catch (error) {
        logger.error('gameConfig', '手动重置配置失败', error instanceof Error ? error : new Error('Unknown error'));
      }
    }}>
      重置配置
    </button>
  );
} 