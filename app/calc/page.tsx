'use client';

import React, { useState } from 'react';

// --- 组件: 通用数字输入框 (DRY, SOLID - 单一职责) ---
// 封装了 Label、Input 和可选的后缀/辅助信息，保持主逻辑整洁
const NumberInput = ({
  label,
  value,
  onChange,
  placeholder,
  prefix = '$',
  suffix,
  helperText,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  helperText?: string;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-gray-500 sm:text-sm">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`block w-full rounded-md border-gray-300 py-2 pl-7 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all ${
          suffix ? 'pr-12' : 'pr-3'
        }`}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-500 sm:text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

// --- 组件: 结果展示卡片 (Composition) ---
const ResultCard = ({
  label,
  value,
  subValue,
  isPositive,
}: {
  label: string;
  value: string;
  subValue: string;
  isPositive: boolean;
}) => (
  <div
    className={`p-4 rounded-lg border ${
      isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}
  >
    <div className="text-sm text-gray-600">{label}</div>
    <div
      className={`text-2xl font-bold ${
        isPositive ? 'text-green-700' : 'text-red-700'
      }`}
    >
      {value}
    </div>
    {subValue && <div className="text-sm text-gray-500 mt-1">{subValue}</div>}
  </div>
);

// --- 主程序: 收益计算器 ---
export default function StockCalculator() {
  // 1. 核心状态
  const [buyPrice, setBuyPrice] = useState('');
  const [buyCount, setBuyCount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellCount, setSellCount] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [exchangeRate, setExchangeRate] = useState('7.2');

  // 状态标志：用于判断用户是否手动修改过卖出股数
  const [isSellCountDirty, setIsSellCountDirty] = useState(false);

  // 2. 事件处理 (Convention over Configuration)
  // 处理买入股数变化，自动同步卖出股数（如果用户未手动修改过）
  const handleBuyCountChange = (val: string) => {
    setBuyCount(val);
    if (!isSellCountDirty) {
      setSellCount(val);
    }
  };

  const handleSellCountChange = (val: string) => {
    setSellCount(val);
    setIsSellCountDirty(true);
  };

  // 3. 计算逻辑 (KISS - 直接计算衍生状态，无需 useEffect)
  const numBuyPrice = parseFloat(buyPrice) || 0;
  const numBuyCount = parseFloat(buyCount) || 0;
  const numSellPrice = parseFloat(sellPrice) || 0;
  const numSellCount = parseFloat(sellCount) || 0; // 默认值为买入股数在 handleBuyCountChange 中处理，这里只处理空值
  const numCurrentPrice = parseFloat(currentPrice) || 0;
  const numExchangeRate = parseFloat(exchangeRate) || 7.2;

  // 计算逻辑：目标收益
  const totalCost = numBuyPrice * numSellCount; // 计算成本时按卖出的股数算，为了计算这部分股票的纯利
  const totalRevenue = numSellPrice * numSellCount;
  const profitUSD = totalRevenue - totalCost;
  const profitCNY = profitUSD * numExchangeRate;
  const isProfitPositive = profitUSD >= 0;

  // 计算逻辑：当前股价到目标价的涨幅 (Input 3 需求)
  // 公式: (目标价 - 当前价) / 当前价
  let growthRateToTarget = 0;
  let showGrowthRate = false;

  if (numCurrentPrice > 0 && numSellPrice > 0) {
    growthRateToTarget =
      ((numSellPrice - numCurrentPrice) / numCurrentPrice) * 100;
    showGrowthRate = true;
  }

  // 辅助格式化函数
  const formatCurrency = (num: number, currency = 'USD') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">美股收益计算器</h1>
          <p className="text-blue-100 text-sm mt-1">快速规划交易目标与收益</p>
        </div>

        <div className="p-6 space-y-6">
          {/* 第一部分：买入设置 */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 border-l-4 border-blue-600 pl-2">
              1. 买入基础信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="买入股价"
                value={buyPrice}
                onChange={setBuyPrice}
                placeholder="0.00"
              />
              <NumberInput
                label="买入股数"
                value={buyCount}
                onChange={handleBuyCountChange}
                placeholder="0"
                prefix=""
                suffix="股"
              />
            </div>
          </div>

          {/* 第二部分：目标设置 */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 border-l-4 border-indigo-600 pl-2">
              2. 目标卖出设置
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="目标卖出股价"
                value={sellPrice}
                onChange={setSellPrice}
                placeholder="0.00"
              />
              <NumberInput
                label="卖出股数"
                value={sellCount}
                onChange={handleSellCountChange}
                placeholder="0"
                prefix=""
                suffix="股"
                helperText={
                  !isSellCountDirty ? '默认同步买入股数' : '已手动修改'
                }
              />
            </div>
          </div>

          {/* 第三部分：行情分析 (需求点3) */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              3. 行情差距分析
              <span className="ml-2 text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border">
                当前价 → 目标价
              </span>
            </h2>
            <div className="flex items-end gap-4">
              <NumberInput
                label="当前股价"
                value={currentPrice}
                onChange={setCurrentPrice}
                placeholder="0.00"
                className="flex-1"
              />

              {/* 实时计算展示区域 */}
              <div
                className={`flex-1 p-2 rounded border text-center mb-0.5 h-[42px] flex items-center justify-center ${
                  showGrowthRate
                    ? growthRateToTarget > 0
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-green-50 border-green-200 text-green-600' // 美股红涨绿跌，这里按照常规逻辑：正数为涨
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                {showGrowthRate ? (
                  <span className="font-bold text-lg">
                    {growthRateToTarget > 0 ? '+' : ''}
                    {growthRateToTarget.toFixed(2)}%
                    <span className="text-xs font-normal ml-1">需涨幅</span>
                  </span>
                ) : (
                  <span className="text-xs">输入当前价与目标价以计算</span>
                )}
              </div>
            </div>
          </div>

          {/* 第四部分：汇率设置 */}
          <div className="flex items-center justify-end gap-2">
            <label className="text-sm text-gray-500">美元/人民币汇率:</label>
            <div className="w-24">
              <NumberInput
                label=""
                value={exchangeRate}
                onChange={setExchangeRate}
                prefix=""
                placeholder="7.2"
                className="mb-0"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 第五部分：收益展示 (需求点4) */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              预计收益结果
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="美元收益 (USD)"
                value={formatCurrency(profitUSD, 'USD')}
                subValue={`成本: ${formatCurrency(
                  totalCost
                )} | 营收: ${formatCurrency(totalRevenue)}`}
                isPositive={isProfitPositive}
              />
              <ResultCard
                label="人民币收益 (CNY)"
                value={formatCurrency(profitCNY, 'CNY')}
                subValue={`按汇率 ${exchangeRate} 计算`}
                isPositive={isProfitPositive}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
