'use client';

import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
}

interface EditorTemplatePickerProps {
  onSelect: (content: string) => void;
  onClose: () => void;
}

const TEMPLATES: Template[] = [
  {
    id: 'news-standard',
    name: '标准新闻稿',
    category: '新闻',
    content: `
      <h2>新闻标题</h2>
      <p><strong>发布时间：</strong>2024年XX月XX日</p>
      <p><strong>来源：</strong>西安高新区总工会</p>
      
      <p>（本报讯/本网讯）正文内容...</p>
      
      <h3>一、活动背景</h3>
      <p>详细介绍活动的背景和目的...</p>
      
      <h3>二、活动内容</h3>
      <p>具体活动内容...</p>
      
      <h3>三、活动成果</h3>
      <p>活动取得的成果和意义...</p>
      
      <p><strong>（编辑：XXX 审核：XXX）</strong></p>
    `,
  },
  {
    id: 'notice-standard',
    name: '通知公告模板',
    category: '通知',
    content: `
      <h2>关于XXXX的通知</h2>
      
      <p><strong>各有关单位/职工：</strong></p>
      
      <p>为了XXXX，经研究决定，现将有关事项通知如下：</p>
      
      <h3>一、时间安排</h3>
      <p>XXXX年XX月XX日至XX月XX日</p>
      
      <h3>二、参加对象</h3>
      <p>XXXX</p>
      
      <h3>三、活动内容</h3>
      <ol>
        <li>第一项内容</li>
        <li>第二项内容</li>
        <li>第三项内容</li>
      </ol>
      
      <h3>四、相关要求</h3>
      <p>请各单位/职工XXXX。</p>
      
      <p style="text-align: right;">西安高新区总工会</p>
      <p style="text-align: right;">XXXX年XX月XX日</p>
    `,
  },
  {
    id: 'meeting-minutes',
    name: '会议纪要模板',
    category: '公文',
    content: `
      <h2>XXXX会议纪要</h2>
      
      <p><strong>会议时间：</strong>XXXX年XX月XX日 XX:XX-XX:XX</p>
      <p><strong>会议地点：</strong>XXX会议室</p>
      <p><strong>主持人：</strong>XXX</p>
      <p><strong>参会人员：</strong>XXX、XXX、XXX</p>
      <p><strong>记录人：</strong>XXX</p>
      
      <h3>会议议题</h3>
      <ol>
        <li>议题一</li>
        <li>议题二</li>
        <li>议题三</li>
      </ol>
      
      <h3>会议内容</h3>
      <p><strong>一、关于XXXX</strong></p>
      <p>会议听取了XXX关于XXXX的汇报，经过讨论研究，形成如下意见：</p>
      <ol>
        <li>意见一</li>
        <li>意见二</li>
      </ol>
      
      <h3>会议决定</h3>
      <ol>
        <li>决定事项一</li>
        <li>决定事项二</li>
      </ol>
    `,
  },
  {
    id: 'activity-report',
    name: '活动总结报告',
    category: '报告',
    content: `
      <h2>XXXX活动总结报告</h2>
      
      <h3>一、活动概况</h3>
      <p>XXXX年XX月XX日，西安高新区总工会成功举办了XXXX活动。本次活动由XXX主办，XXX承办，共有XXX名职工参加。</p>
      
      <h3>二、活动内容</h3>
      <p>本次活动主要包括以下几个方面：</p>
      <ol>
        <li><strong>XXX环节：</strong>具体内容...</li>
        <li><strong>XXX环节：</strong>具体内容...</li>
        <li><strong>XXX环节：</strong>具体内容...</li>
      </ol>
      
      <h3>三、活动成效</h3>
      <p>本次活动取得了良好的效果，主要表现在：</p>
      <ul>
        <li>成效一</li>
        <li>成效二</li>
        <li>成效三</li>
      </ul>
      
      <h3>四、存在不足与改进方向</h3>
      <p>虽然活动取得了一定成效，但也存在一些不足之处：</p>
      <ul>
        <li>不足一</li>
        <li>不足二</li>
      </ul>
      
      <h3>五、下一步工作计划</h3>
      <p>针对以上不足，下一步将：</p>
      <ol>
        <li>改进措施一</li>
        <li>改进措施二</li>
      </ol>
    `,
  },
];

export default function EditorTemplatePicker({ onSelect, onClose }: EditorTemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewContent, setPreviewContent] = useState<string>('');

  const categories = ['all', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">选择模板</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Template List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setPreviewContent(template.content)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      previewContent === template.content
                        ? 'border-[hsl(var(--primary))] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto p-6">
              {previewContent ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  请选择模板查看预览
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-500">
            共 {filteredTemplates.length} 个模板
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => previewContent && onSelect(previewContent)}
              disabled={!previewContent}
              className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded hover:bg-[hsl(var(--primary-dark))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              使用此模板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
