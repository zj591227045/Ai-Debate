import React, { useState } from 'react';
import './styles.css';

interface BalanceInfo {
  currency: string;
  total_balance: string;
  granted_balance?: string;
  topped_up_balance?: string;
}

interface DeepseekBalanceResponse {
  is_available: boolean;
  balance_infos: BalanceInfo[];
}

interface SiliconFlowUserData {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  balance: string;
  status: string;
  introduction: string;
  role: string;
  chargeBalance: string;
  totalBalance: string;
  category: string;
}

interface SiliconFlowBalanceResponse {
  code: number;
  message: string;
  status: boolean;
  data: SiliconFlowUserData;
}

interface BalanceCheckerProps {
  apiKey: string;
  provider: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
}

export function BalanceChecker({ apiKey, provider, baseUrl, customHeaders = {} }: BalanceCheckerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);

  const getEndpoint = () => {
    switch (provider) {
      case 'deepseek':
        return `${baseUrl || 'https://api.deepseek.com'}/v1/user/balance`;
      case 'siliconflow':
        return `${baseUrl || 'https://api.siliconflow.cn'}/v1/user/info`;
      default:
        return '';
    }
  };

  const checkBalance = async () => {
    if (!apiKey) {
      setError('请先输入 API 密钥');
      return;
    }

    const endpoint = getEndpoint();
    if (!endpoint) {
      setError('不支持的供应商');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBalance(null);

    try {
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...customHeaders
      };

      console.log('正在请求余额信息:', {
        endpoint,
        provider,
        headers: { ...headers, Authorization: '(hidden)' }
      });

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`查询失败: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API 响应数据:', data);
      
      if (provider === 'siliconflow') {
        const siliconFlowData = data as SiliconFlowBalanceResponse;
        console.log('SiliconFlow 数据:', siliconFlowData);
        
        if (siliconFlowData.code !== 20000 || !siliconFlowData.status) {
          throw new Error(siliconFlowData.message || '查询失败');
        }

        if (siliconFlowData.data.status !== 'normal') {
          throw new Error('账户状态异常');
        }

        setBalance({
          currency: 'CNY', // SiliconFlow 默认使用人民币
          total_balance: siliconFlowData.data.totalBalance,
          granted_balance: siliconFlowData.data.balance,
          topped_up_balance: siliconFlowData.data.chargeBalance
        });
      } else if (provider === 'deepseek') {
        const deepseekData = data as DeepseekBalanceResponse;
        if (!deepseekData.is_available) {
          throw new Error('账户不可用');
        }
        setBalance(deepseekData.balance_infos[0]);
      }
    } catch (err) {
      console.error('查询余额失败:', err);
      setError(err instanceof Error ? err.message : '查询失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="balance-checker">
      <button
        type="button"
        className="balance-check-button"
        onClick={checkBalance}
        disabled={isLoading || !apiKey}
      >
        {isLoading ? '查询中...' : '查询余额'}
      </button>
      
      {error && (
        <div className="balance-error">
          {error}
        </div>
      )}
      
      {balance && (
        <div className="balance-info">
          <div className="balance-amount">
            {balance.total_balance} {balance.currency}
          </div>
          {balance.granted_balance && (
            <div className="balance-detail">
              赠送余额: {balance.granted_balance} {balance.currency}
            </div>
          )}
          {balance.topped_up_balance && (
            <div className="balance-detail">
              充值余额: {balance.topped_up_balance} {balance.currency}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 