import React from 'react';
import { ModelParameters } from '../../types/config';
import './styles.css';

interface ParameterRange {
  min: number;
  max: number;
  default: number;
  step?: number;
}

interface ParameterRanges {
  temperature?: ParameterRange;
  maxTokens?: ParameterRange;
  topP?: ParameterRange;
}

interface ModelParameterFormProps {
  parameters: ModelParameters;
  ranges: ParameterRanges;
  onChange: (key: keyof ModelParameters, value: number) => void;
}

const ParameterInput: React.FC<{
  label: string;
  value: number;
  range: ParameterRange;
  onChange: (value: number) => void;
}> = ({ label, value, range, onChange }) => (
  <div className="form-group">
    <label>{label}</label>
    <div className="parameter-input">
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step || (range.max - range.min) / 100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="parameter-value">{value}</span>
    </div>
  </div>
);

export const ModelParameterForm: React.FC<ModelParameterFormProps> = ({
  parameters,
  ranges,
  onChange
}) => {
  return (
    <div className="parameter-form">
      {ranges.temperature && (
        <ParameterInput
          label="温度"
          value={parameters.temperature}
          range={ranges.temperature}
          onChange={v => onChange('temperature', v)}
        />
      )}
      {ranges.maxTokens && (
        <ParameterInput
          label="最大Token数"
          value={parameters.maxTokens}
          range={ranges.maxTokens}
          onChange={v => onChange('maxTokens', v)}
        />
      )}
      {ranges.topP && (
        <ParameterInput
          label="Top P"
          value={parameters.topP}
          range={ranges.topP}
          onChange={v => onChange('topP', v)}
        />
      )}
    </div>
  );
}; 