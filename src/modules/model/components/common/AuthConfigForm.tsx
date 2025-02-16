import React from 'react';
import { AuthConfig } from '../../types/config';
import './styles.css';

interface AuthConfigFormProps {
  auth: AuthConfig;
  requirements: {
    requiresApiKey: boolean;
    requiresBaseUrl: boolean;
    defaultBaseUrl?: string;
  };
  onChange: (key: keyof AuthConfig, value: string) => void;
}

const FormField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', required, placeholder }) => (
  <div className="form-group">
    <label>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
    />
  </div>
);

export const AuthConfigForm: React.FC<AuthConfigFormProps> = ({
  auth,
  requirements,
  onChange
}) => {
  return (
    <div className="auth-form">
      {requirements.requiresBaseUrl && (
        <FormField
          label="服务地址"
          value={auth.baseUrl}
          onChange={v => onChange('baseUrl', v)}
          placeholder={requirements.defaultBaseUrl || '请输入服务地址'}
          required
        />
      )}
      {requirements.requiresApiKey && (
        <FormField
          label="API密钥"
          value={auth.apiKey || ''}
          onChange={v => onChange('apiKey', v)}
          type="password"
          placeholder="请输入API密钥"
          required
        />
      )}
    </div>
  );
}; 