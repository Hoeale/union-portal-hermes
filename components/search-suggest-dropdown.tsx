'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, TrendingUp } from 'lucide-react';

interface Suggestion {
  text: string;
  type: string;
  count: number;
}

interface SearchSuggestDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchSuggestDropdown({
  value,
  onChange,
  onSearch,
  placeholder = '输入关键词搜索...',
  className = '',
}: SearchSuggestDropdownProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载最近搜索历史
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, []);

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search/suggest?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 防抖处理
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 保存搜索历史
  const saveToRecentSearches = (query: string) => {
    try {
      const updated = [
        query,
        ...recentSearches.filter((s) => s !== query),
      ].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent searches:', e);
    }
  };

  // 处理选择建议
  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    saveToRecentSearches(suggestion);
    onSearch(suggestion);
    router.push(`/search/?q=${encodeURIComponent(suggestion)}`);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex].text);
      } else if (value.trim()) {
        handleSelectSuggestion(value.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // 获取类型标签样式
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      news: 'bg-blue-100 text-blue-700',
      policy: 'bg-green-100 text-green-700',
      service: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      news: '新闻',
      policy: '政策',
      service: '服务',
    };
    const style = styles[type] || 'bg-gray-100 text-gray-700';
    const label = labels[type] || '';
    return label ? (
      <span className={`px-2 py-0.5 rounded text-xs ${style}`}>{label}</span>
    ) : null;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0 || recentSearches.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-6 py-4 pr-14 text-lg border-2 border-[hsl(var(--card-border))] rounded-xl focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all shadow-sm"
          aria-label="搜索关键词"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[hsl(var(--primary))] border-t-transparent"></div>
          ) : (
            <Search className="w-6 h-6 text-[hsl(var(--foreground-muted))]" />
          )}
        </div>
      </div>

      {/* 搜索建议下拉 */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-[hsl(var(--card-border))] overflow-hidden animate-fade-in"
          role="listbox"
        >
          {/* 最近搜索 */}
          {!value.trim() && recentSearches.length > 0 && (
            <div className="border-b border-[hsl(var(--card-border))]">
              <div className="px-4 py-2 text-xs font-medium text-[hsl(var(--foreground-muted))] flex items-center gap-2">
                <Clock className="w-3 h-3" />
                最近搜索
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleSelectSuggestion(search)}
                  className="w-full px-4 py-3 text-left hover:bg-[hsl(var(--muted))] flex items-center gap-3 transition-colors"
                  role="option"
                  aria-selected={false}
                >
                  <Clock className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
                  <span className="text-sm text-[hsl(var(--foreground))]">
                    {search}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-[hsl(var(--foreground-muted))] flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                搜索建议
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggest-${index}`}
                  onClick={() => handleSelectSuggestion(suggestion.text)}
                  className={`w-full px-4 py-3 text-left hover:bg-[hsl(var(--muted))] flex items-center gap-3 transition-colors ${
                    index === selectedIndex ? 'bg-[hsl(var(--muted))]' : ''
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <Search className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
                  <span className="flex-1 text-sm text-[hsl(var(--foreground))] truncate">
                    {suggestion.text}
                  </span>
                  {getTypeBadge(suggestion.type)}
                  {suggestion.count > 1 && (
                    <span className="text-xs text-[hsl(var(--foreground-muted))]">
                      {suggestion.count}次
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 无结果提示 */}
          {value.trim() && suggestions.length === 0 && !isLoading && (
            <div className="px-4 py-6 text-center text-sm text-[hsl(var(--foreground-muted))]">
              按回车键搜索 &quot;{value}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
