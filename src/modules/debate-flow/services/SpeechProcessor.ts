import type { Speech } from '@debate/types';
import type { Player } from '@game-config/types';

export interface ProcessedSpeech extends Speech {
  metadata: {
    wordCount: number;
  };
}

export class SpeechProcessor {
  // 处理发言内容
  async processSpeech(speech: Speech, context: {
    currentRound: number;
    previousSpeeches: Speech[];
    player: Player;
  }): Promise<ProcessedSpeech> {
    // 计算元数据
    const metadata = {
      wordCount: this.countWords(speech.content)
    };

    return {
      ...speech,
      metadata
    };
  }

  // 计算字数
  private countWords(content: string): number {
    return content.replace(/\s+/g, '').length;
  }
} 