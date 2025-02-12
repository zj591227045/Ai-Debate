import { useEffect } from 'react';
import { useStore } from '../modules/state';
import { StateLogger } from '../modules/state/utils';
import { StoreError } from '../modules/state/types/error';

const logger = StateLogger.getInstance();

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
    logger.debug('gameConfig', '更新主题', {
      oldTitle: gameConfig.topic.title,
      newTitle: title,
      timestamp: new Date().toISOString(),
      source: 'GameConfig.topicChange'
    });
    
    setGameConfig({
      topic: {
        ...gameConfig.topic,
        title
      }
    });
  };

  // 更新规则
  const handleRulesChange = (totalRounds: number) => {
    logger.debug('gameConfig', '更新规则', {
      oldTotalRounds: gameConfig.rules.totalRounds,
      newTotalRounds: totalRounds,
      timestamp: new Date().toISOString(),
      source: 'GameConfig.rulesChange'
    });
    
    setGameConfig({
      rules: {
        ...gameConfig.rules,
        totalRounds
      }
    });
  };

  return (
    <div>
      <h2>游戏配置</h2>
      
      {/* 主题配置 */}
      <section>
        <h3>主题设置</h3>
        <input
          value={gameConfig.topic.title}
          onChange={e => handleTopicChange(e.target.value)}
          placeholder="输入主题标题"
        />
        <textarea
          value={gameConfig.topic.description}
          onChange={e => setGameConfig({
            topic: { ...gameConfig.topic, description: e.target.value }
          })}
          placeholder="输入主题描述"
        />
      </section>

      {/* 规则配置 */}
      <section>
        <h3>规则设置</h3>
        <div>
          <label>回合数：</label>
          <input
            type="number"
            value={gameConfig.rules.totalRounds}
            onChange={e => handleRulesChange(Number(e.target.value))}
            min={1}
          />
        </div>
      </section>

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
  
  return (
    <button onClick={() => {
      try {
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
  const { state: gameConfig } = useStore('gameConfig');
  
  return (
    <button onClick={() => {
      try {
        logger.debug('gameConfig', '手动加载配置', {
          state: gameConfig,
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
  const { setState: setGameConfig } = useStore('gameConfig');
  
  return (
    <button onClick={() => {
      try {
        setGameConfig({});  // 重置为默认状态
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