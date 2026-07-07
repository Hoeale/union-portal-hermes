'use client';

import React from 'react';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

interface LineChartProps {
  data: ChartData;
  height?: number;
  title?: string;
}

/**
 * 简单的 SVG 折线图组件
 * 无需外部依赖
 */
export function LineChart({ data, height = 300, title }: LineChartProps) {
  const padding = 40;
  const chartWidth = 100 - padding * 2;
  const chartHeight = height - padding * 2;
  
  // 计算最大值
  const allValues = data.datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;
  
  // 生成路径
  const generatePath = (values: number[]) => {
    return values.map((value, index) => {
      const x = padding + (index / (values.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  // 颜色
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={100 - padding}
            y2={padding + chartHeight * ratio}
            stroke="#e5e7eb"
            strokeWidth="0.2"
          />
        ))}
        
        {/* 数据线 */}
        {data.datasets.map((dataset, i) => (
          <path
            key={i}
            d={generatePath(dataset.data)}
            fill="none"
            stroke={dataset.color || colors[i % colors.length]}
            strokeWidth="0.5"
          />
        ))}
        
        {/* 数据点 */}
        {data.datasets.map((dataset, di) => (
          dataset.data.map((value, vi) => {
            const x = padding + (vi / (dataset.data.length - 1 || 1)) * chartWidth;
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            return (
              <circle
                key={`${di}-${vi}`}
                cx={x}
                cy={y}
                r="0.8"
                fill={dataset.color || colors[di % colors.length]}
              />
            );
          })
        ))}
      </svg>
      
      {/* 图例 */}
      <div className="flex justify-center gap-4 mt-2">
        {data.datasets.map((dataset, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.color || colors[i % colors.length] }}
            />
            <span className="text-xs text-gray-600">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: ChartData;
  height?: number;
  title?: string;
}

/**
 * 简单的 SVG 柱状图组件
 */
export function BarChart({ data, height = 300, title }: BarChartProps) {
  const padding = 40;
  const chartWidth = 100 - padding * 2;
  const chartHeight = height - padding * 2;
  
  const allValues = data.datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues, 1);
  
  const barWidth = chartWidth / (data.labels.length * data.datasets.length + data.labels.length);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
        {/* Y轴网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * (1 - ratio)}
            x2={100 - padding}
            y2={padding + chartHeight * (1 - ratio)}
            stroke="#e5e7eb"
            strokeWidth="0.2"
          />
        ))}
        
        {/* 柱状图 */}
        {data.labels.map((label, li) => (
          data.datasets.map((dataset, di) => {
            const value = dataset.data[li];
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + li * (barWidth * (data.datasets.length + 1)) + di * barWidth + barWidth / 2;
            const y = padding + chartHeight - barHeight;
            
            return (
              <rect
                key={`${li}-${di}`}
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={barHeight}
                fill={dataset.color || colors[di % colors.length]}
                rx="0.5"
              />
            );
          })
        ))}
      </svg>
      
      {/* X轴标签 */}
      <div className="flex justify-between px-10 mt-2">
        {data.labels.map((label, i) => (
          <span key={i} className="text-xs text-gray-600 truncate max-w-[80px]">
            {label}
          </span>
        ))}
      </div>
      
      {/* 图例 */}
      <div className="flex justify-center gap-4 mt-4">
        {data.datasets.map((dataset, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: dataset.color || colors[i % colors.length] }}
            />
            <span className="text-xs text-gray-600">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  title?: string;
}

/**
 * 简单的 SVG 饼图组件
 */
export function PieChart({ data, size = 200, title }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  let currentAngle = 0;
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
      <div className="flex items-center justify-center">
        <svg width={size} height={size} viewBox="0 0 100 100">
          {data.map((item, i) => {
            const percentage = item.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            
            // 计算路径
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            const path = `
              M 50 50
              L ${x1} ${y1}
              A 40 40 0 ${largeArc} 1 ${x2} ${y2}
              Z
            `;
            
            return (
              <path
                key={i}
                d={path}
                fill={item.color || colors[i % colors.length]}
                stroke="white"
                strokeWidth="0.5"
              />
            );
          })}
          
          {/* 中心圆（甜甜圈效果） */}
          <circle cx="50" cy="50" r="20" fill="white" />
          <text x="50" y="52" textAnchor="middle" fontSize="8" fill="#374151">
            {total}
          </text>
        </svg>
      </div>
      
      {/* 图例 */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color || colors[i % colors.length] }}
            />
            <span className="text-xs text-gray-600">
              {item.label} ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

/**
 * 统计卡片组件
 */
export function StatCard({ title, value, change, icon, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        {icon && <div className="text-3xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
}
