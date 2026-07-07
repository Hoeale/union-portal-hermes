'use client';

import { useEffect, useState } from 'react';
import FrontendWrapper from '@/components/frontend-wrapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

function AboutContent() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const defaultContent = `
    <p>西安高新区总工会成立于2019年11月，自成立以来，始终坚守以职工为中心的服务导向，聚焦职工急难愁盼，扎实推进维权服务、困难帮扶、法律援助、心理咨询等一系列暖心举措，着力打造职工信赖依靠的"职工之家"。</p>
    <p class="mt-4">与此同时，工会积极锚定区域发展大局，充分发挥桥梁纽带作用，团结动员区内广大职工投身科技创新与经济建设主战场。通过常态化组织劳动竞赛、技能培训、文体活动等多元化载体，既有效提升了职工队伍的专业素养与综合能力，又丰富了职工的精神文化生活，为加快推动"四个高新"高质量发展和世界领先科技园区建设注入工会力量。</p>
  `;

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/about');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setContent(data || defaultContent);
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[hsl(var(--background))] min-h-screen">
      {/* 页面标题 */}
      <div className="gradient-primary text-white py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">工会概况</h1>
          <p className="text-white/90 text-lg">了解我们的组织</p>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* 工会简介 */}
        <section className="mb-12 animate-slide-up">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-3">
              <span className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full" />
              工会简介
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : (
              <div
                className="rich-text-content max-w-none text-[hsl(var(--foreground-muted))] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return <FrontendWrapper><AboutContent /></FrontendWrapper>;
}
