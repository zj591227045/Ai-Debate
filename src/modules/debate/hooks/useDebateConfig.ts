import { useState, useCallback } from 'react';
import { TopicConfig, RuleConfig, ConfigTemplate, topicConfigSchema, ruleConfigSchema } from '../validation/config.schema';

export interface ValidationError {
  field: string;
  message: string;
}

export interface UseDebateConfigReturn {
  topic: TopicConfig;
  rules: RuleConfig;
  errors: ValidationError[];
  selectedTemplate: string;
  templates: ConfigTemplate[];
  updateTopic: (updates: Partial<TopicConfig>) => void;
  updateRules: (updates: Partial<RuleConfig>) => void;
  resetTopic: () => void;
  resetRules: () => void;
  loadTemplate: (templateId: string) => void;
  saveAsTemplate: (name: string) => Promise<void>;
  validate: () => boolean;
  setSelectedTemplate: (templateId: string) => void;
}

const defaultTopicConfig: TopicConfig = {
  title: '',
  background: '',
};

const defaultRuleConfig: RuleConfig = {
  format: 'structured',
  description: '',
  advancedRules: {
    maxLength: 500,
    minLength: 0,
    allowQuoting: false,
    requireResponse: false,
    allowStanceChange: false,
    requireEvidence: false,
  },
};

export const useDebateConfig = (): UseDebateConfigReturn => {
  const [topic, setTopic] = useState<TopicConfig>(defaultTopicConfig);
  const [rules, setRules] = useState<RuleConfig>(defaultRuleConfig);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);

  const validate = useCallback(() => {
    const newErrors: ValidationError[] = [];

    try {
      topicConfigSchema.parse(topic);
    } catch (error) {
      if (error instanceof Error) {
        newErrors.push({ field: 'topic', message: error.message });
      }
    }

    try {
      ruleConfigSchema.parse(rules);
    } catch (error) {
      if (error instanceof Error) {
        newErrors.push({ field: 'rules', message: error.message });
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [topic, rules]);

  const updateTopic = useCallback((updates: Partial<TopicConfig>) => {
    setTopic(prev => ({ ...prev, ...updates }));
  }, []);

  const updateRules = useCallback((updates: Partial<RuleConfig>) => {
    setRules(prev => ({ ...prev, ...updates }));
  }, []);

  const resetTopic = useCallback(() => {
    setTopic(defaultTopicConfig);
  }, []);

  const resetRules = useCallback(() => {
    setRules(defaultRuleConfig);
  }, []);

  const loadTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTopic(template.topic);
      setRules(template.rules);
      setSelectedTemplate(templateId);
    }
  }, [templates]);

  const saveAsTemplate = useCallback(async (name: string) => {
    if (!validate()) {
      throw new Error('配置验证失败');
    }

    const newTemplate: ConfigTemplate = {
      id: Date.now().toString(),
      name,
      topic,
      rules,
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplate(newTemplate.id);
  }, [topic, rules, validate]);

  return {
    topic,
    rules,
    errors,
    selectedTemplate,
    templates,
    updateTopic,
    updateRules,
    resetTopic,
    resetRules,
    loadTemplate,
    saveAsTemplate,
    validate,
    setSelectedTemplate,
  };
}; 