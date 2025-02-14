import { useState, useCallback } from 'react';

export interface Speech {
  id: string;
  playerId: string;
  content: string;
  timestamp: Date;
  references?: string[];  // 引用其他发言的ID
  type: 'speech' | 'innerThoughts' | 'system';
  editHistory?: {
    content: string;
    timestamp: Date;
  }[];
}

interface SpeechValidation {
  isValid: boolean;
  errors: {
    type: 'length' | 'content' | 'reference';
    message: string;
  }[];
}

interface UseSpeechRecorderProps {
  maxLength?: number;  // 最大字数限制
  minLength?: number;  // 最小字数限制
  validateContent?: (content: string) => Promise<boolean>;  // 自定义内容验证
  onSpeechAdded?: (speech: Speech) => void;  // 发言添加回调
  onSpeechEdited?: (speech: Speech) => void;  // 发言编辑回调
}

interface UseSpeechRecorderReturn {
  speeches: Speech[];
  addSpeech: (playerId: string, content: string, type: Speech['type'], references?: string[]) => Promise<boolean>;
  editSpeech: (speechId: string, newContent: string) => Promise<boolean>;
  getSpeechById: (speechId: string) => Speech | undefined;
  getSpeechesByPlayer: (playerId: string) => Speech[];
  getReferencedSpeeches: (speechId: string) => Speech[];
  validateSpeech: (content: string, references?: string[]) => Promise<SpeechValidation>;
}

export function useSpeechRecorder({
  maxLength = 1000,
  minLength = 10,
  validateContent,
  onSpeechAdded,
  onSpeechEdited
}: UseSpeechRecorderProps = {}): UseSpeechRecorderReturn {
  const [speeches, setSpeeches] = useState<Speech[]>([]);

  // 验证发言内容
  const validateSpeech = useCallback(async (
    content: string,
    references?: string[]
  ): Promise<SpeechValidation> => {
    const errors: { type: 'length' | 'content' | 'reference'; message: string; }[] = [];

    // 检查长度
    if (content.length > maxLength) {
      errors.push({
        type: 'length',
        message: `发言超过最大长度限制 ${maxLength} 字`
      });
    }

    if (content.length < minLength) {
      errors.push({
        type: 'length',
        message: `发言不足最小长度要求 ${minLength} 字`
      });
    }

    // 检查引用
    if (references?.length) {
      const invalidRefs = references.filter(
        ref => !speeches.find(s => s.id === ref)
      );
      if (invalidRefs.length) {
        errors.push({
          type: 'reference',
          message: `引用的发言不存在: ${invalidRefs.join(', ')}`
        });
      }
    }

    // 自定义内容验证
    if (validateContent) {
      const isContentValid = await validateContent(content);
      if (!isContentValid) {
        errors.push({
          type: 'content',
          message: '发言内容未通过验证'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [maxLength, minLength, validateContent, speeches]);

  // 添加新发言
  const addSpeech = useCallback(async (
    playerId: string,
    content: string,
    type: Speech['type'],
    references?: string[]
  ): Promise<boolean> => {
    const validation = await validateSpeech(content, references);
    
    if (!validation.isValid) {
      console.error('发言验证失败:', validation.errors);
      return false;
    }

    const newSpeech: Speech = {
      id: `speech_${Date.now()}`,
      playerId,
      content,
      timestamp: new Date(),
      type,
      references,
      editHistory: []
    };

    setSpeeches(prev => [...prev, newSpeech]);
    onSpeechAdded?.(newSpeech);
    return true;
  }, [validateSpeech, onSpeechAdded]);

  // 编辑发言
  const editSpeech = useCallback(async (
    speechId: string,
    newContent: string
  ): Promise<boolean> => {
    const speech = speeches.find(s => s.id === speechId);
    if (!speech) {
      console.error('未找到要编辑的发言:', speechId);
      return false;
    }

    const validation = await validateSpeech(newContent, speech.references);
    if (!validation.isValid) {
      console.error('发言验证失败:', validation.errors);
      return false;
    }

    const editedSpeech: Speech = {
      ...speech,
      content: newContent,
      editHistory: [
        ...(speech.editHistory || []),
        {
          content: speech.content,
          timestamp: new Date()
        }
      ]
    };

    setSpeeches(prev => 
      prev.map(s => s.id === speechId ? editedSpeech : s)
    );
    onSpeechEdited?.(editedSpeech);
    return true;
  }, [speeches, validateSpeech, onSpeechEdited]);

  // 根据ID获取发言
  const getSpeechById = useCallback((speechId: string) => {
    return speeches.find(s => s.id === speechId);
  }, [speeches]);

  // 获取选手的所有发言
  const getSpeechesByPlayer = useCallback((playerId: string) => {
    return speeches.filter(s => s.playerId === playerId);
  }, [speeches]);

  // 获取被引用的发言
  const getReferencedSpeeches = useCallback((speechId: string) => {
    const speech = speeches.find(s => s.id === speechId);
    if (!speech?.references?.length) return [];
    return speeches.filter(s => speech.references?.includes(s.id));
  }, [speeches]);

  return {
    speeches,
    addSpeech,
    editSpeech,
    getSpeechById,
    getSpeechesByPlayer,
    getReferencedSpeeches,
    validateSpeech
  };
}

export default useSpeechRecorder; 