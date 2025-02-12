import type { DebateConfig } from '../types/debate';

export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

export class TemplateValidator {
  /**
   * 验证基础配置
   * @param config 辩论配置
   */
  static validateBasicConfig(config: DebateConfig): ValidationResult {
    const errors = [];

    // 验证主题配置
    if (!config.topic?.title) {
      errors.push({
        field: 'topic.title',
        message: '主题名称不能为空'
      });
    }

    if (!config.topic?.description) {
      errors.push({
        field: 'topic.description',
        message: '主题背景说明不能为空'
      });
    }

    // 验证规则配置
    if (!config.rules) {
      errors.push({
        field: 'rules',
        message: '规则配置不能为空'
      });
    }

    // 验证基础规则
    if (!config.rules?.basicRules) {
      errors.push({
        field: 'rules.basicRules',
        message: '基础规则不能为空'
      });
    }

    // 验证发言长度限制
    if (!config.rules?.basicRules?.speechLengthLimit) {
      errors.push({
        field: 'rules.basicRules.speechLengthLimit',
        message: '发言长度限制不能为空'
      });
    }

    // 验证评分维度
    if (!config.judging?.dimensions || config.judging.dimensions.length === 0) {
      errors.push({
        field: 'judging.dimensions',
        message: '评分维度不能为空'
      });
    }

    // 验证总分
    if (!config.judging?.totalScore) {
      errors.push({
        field: 'judging.totalScore',
        message: '总分不能为空'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证动态配置
   * @param config 辩论配置
   */
  static validateDynamicConfig(config: DebateConfig): ValidationResult {
    const errors = [];

    // 验证规则配置
    if (!config.rules) {
      errors.push({
        field: 'rules',
        message: '规则配置不能为空'
      });
    }

    // 验证基础规则
    if (!config.rules?.basicRules) {
      errors.push({
        field: 'rules.basicRules',
        message: '基础规则不能为空'
      });
    }

    // 验证评分维度
    if (!config.judging?.dimensions || config.judging.dimensions.length === 0) {
      errors.push({
        field: 'judging.dimensions',
        message: '评分维度不能为空'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证数据完整性
   * @param config 辩论配置
   */
  static validateDataIntegrity(config: DebateConfig): ValidationResult {
    const errors = [];

    // 验证必要字段是否存在
    if (!config.topic) {
      errors.push({
        field: 'topic',
        message: '主题配置不能为空'
      });
    }

    if (!config.rules) {
      errors.push({
        field: 'rules',
        message: '规则配置不能为空'
      });
    }

    if (!config.participants) {
      errors.push({
        field: 'participants',
        message: '参与者配置不能为空'
      });
    }

    // 验证数据类型
    if (config.topic && typeof config.topic !== 'object') {
      errors.push({
        field: 'topic',
        message: '主题配置必须是对象类型'
      });
    }

    if (config.rules && typeof config.rules !== 'object') {
      errors.push({
        field: 'rules',
        message: '规则配置必须是对象类型'
      });
    }

    if (config.participants && typeof config.participants !== 'object') {
      errors.push({
        field: 'participants',
        message: '参与者配置必须是对象类型'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 完整验证
   * @param config 辩论配置
   */
  static validate(config: DebateConfig): ValidationResult {
    // 验证数据完整性
    const integrityResult = this.validateDataIntegrity(config);
    if (!integrityResult.isValid) {
      return integrityResult;
    }

    // 验证基础配置
    const basicResult = this.validateBasicConfig(config);
    if (!basicResult.isValid) {
      return basicResult;
    }

    // 验证动态配置
    const dynamicResult = this.validateDynamicConfig(config);
    if (!dynamicResult.isValid) {
      return dynamicResult;
    }

    return {
      isValid: true,
      errors: []
    };
  }
} 