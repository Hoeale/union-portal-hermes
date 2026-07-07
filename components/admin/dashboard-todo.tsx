'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationCircle, faClock, faComment, faCalendar,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

interface TodoItem {
  id: string;
  title: string;
  count: number;
  link: string;
  priority: 'high' | 'medium' | 'low';
}

interface DashboardTodoProps {
  todos: TodoItem[];
}

export default function DashboardTodo({ todos }: DashboardTodoProps) {
  const priorityConfig = {
    high: {
      bg: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-700',
      icon: faExclamationCircle,
      iconColor: 'text-red-500',
    },
    medium: {
      bg: 'bg-orange-50 border-orange-200',
      badge: 'bg-orange-100 text-orange-700',
      icon: faClock,
      iconColor: 'text-orange-500',
    },
    low: {
      bg: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      icon: faCalendar,
      iconColor: 'text-blue-500',
    },
  };

  const priorityLabels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };

  if (todos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">待办事项</h3>
        <div className="text-center py-8 text-gray-500">
          <FontAwesomeIcon icon={faComment} className="text-4xl mb-3 text-gray-300" />
          <p>暂无待办事项</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">待办事项</h3>
        <span className="text-sm text-gray-500">{todos.length} 项待办</span>
      </div>

      <div className="space-y-3">
        {todos.map((todo) => {
          const config = priorityConfig[todo.priority];
          return (
            <Link
              key={todo.id}
              href={todo.link}
              className={`block border rounded-lg p-4 ${config.bg} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <FontAwesomeIcon
                    icon={config.icon}
                    className={`text-xl ${config.iconColor}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{todo.title}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                        {priorityLabels[todo.priority]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-white text-gray-900">
                    {todo.count}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-gray-400 text-sm"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
