import React, { useState } from 'react';
import './styles.css';

interface BalanceInfo {
  currency: string;
  total_balance: string;
  granted_balance?: string;
  topped_up_balance?: string;
}

interface BalanceResponse {
  is_available: boolean;
  balance_infos: BalanceInfo[];
}

interface BalanceCheckerProps {
  apiKey: string;
  endpoint: string;
  provider: string;
  customHeaders?: Record<string, string>;
}

export function BalanceChecker({ apiKey, endpoint, provider, customHeaders = {} }: BalanceCheckerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);

  const checkBalance = async () => {
    if (!apiKey) {
      setError('请先输入 API 密钥');
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

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`查询失败: ${response.statusText}`);
      }

      const data: BalanceResponse = await response.json();
      
      if (!data.is_available) {
        throw new Error('账户不可用');
      }

      setBalance(data.balance_infos[0]);
    } catch (err) {
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