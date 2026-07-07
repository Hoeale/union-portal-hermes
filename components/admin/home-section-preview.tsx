'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faSearch, faConciergeBell, faQrcode,
  faMapMarkedAlt, faUserPlus, faExchangeAlt, faCommentDots,
  faGraduationCap, faFemale, faHandHoldingHeart, faEllipsisH,
  faArrowCircleRight, faImage, faNewspaper, faBullhorn
} from '@fortawesome/free-solid-svg-icons';
import { faWeixin } from '@fortawesome/free-brands-svg-icons';

interface SectionPreviewProps {
  sectionId: string;
  isDragging?: boolean;
  isDropTarget?: boolean;
  className?: string;
}

// 顶部导航栏预览
function HeaderPreview() {
  return (
    <div className="space-y-0">
      {/* TopBar */}
      <div className="bg-[#f5f5f5] px-6 py-2 text-xs text-gray-500 flex justify-between items-center">
        <span>欢迎访问西安高新区总工会</span>
        <div className="flex gap-3">
          <span>设为首页</span>
          <span>加入收藏</span>
        </div>
      </div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2b3c] to-[#2d4a6a] px-6 py-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#b71c1c] font-bold text-lg">工会</div>
        <div>
          <h1 className="text-xl font-bold text-white">西安高新区总工会</h1>
          <p className="text-xs text-gray-300">服务职工 凝聚力量</p>
        </div>
      </div>
      {/* NavBar */}
      <div className="bg-[#b71c1c] px-6 py-3 flex items-center gap-6 text-sm text-white font-medium">
        {['首页', '新闻中心', '办事服务', '政策文件', '最美劳动者', '视频中心'].map(item => (
          <span key={item} className={item === '首页' ? 'text-[#ffd966]' : 'text-white/90'}>{item}</span>
        ))}
        <div className="ml-auto flex items-center bg-white/20 rounded-lg px-3 py-1.5">
          <FontAwesomeIcon icon={faSearch} className="text-xs mr-2" />
          <span className="text-xs text-white/60">搜索...</span>
        </div>
      </div>
    </div>
  );
}

// 轮播图预览
function HeroCarouselPreview() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* 轮播区 */}
      <div className="col-span-2 relative h-28 bg-gradient-to-br from-[#b71c1c] to-[#8b0000] rounded-lg overflow-hidden">
        <FontAwesomeIcon icon={faImage} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30 text-3xl" />
        <div className="absolute bottom-2 left-3 right-3">
          <span className="inline-block px-2 py-0.5 bg-[#b71c1c] text-white text-[10px] rounded-full mb-1">动态</span>
          <h3 className="text-white text-xs font-bold line-clamp-1">2026年&ldquo;大国工匠年度人物&rdquo;正式揭晓</h3>
          <p className="text-white/70 text-[10px]">2026-05-26</p>
        </div>
        {/* 指示器 */}
        <div className="absolute bottom-2 right-3 flex gap-1">
          <span className="w-4 h-1 bg-[#ffd966] rounded-full" />
          <span className="w-1 h-1 bg-white/50 rounded-full" />
          <span className="w-1 h-1 bg-white/50 rounded-full" />
        </div>
      </div>
      {/* 右侧列表 */}
      <div className="bg-white rounded-lg p-2 border border-gray-100">
        <h4 className="text-xs font-bold text-[#1e2b3c] mb-2">轮播新闻</h4>
        <div className="space-y-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="w-4 h-4 bg-[#b71c1c] text-white text-[8px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i}</span>
              <p className="text-[10px] text-gray-700 line-clamp-2 leading-tight">超龄劳动者权益保障新规7月1日起施行</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 通知公告预览
function NoticePanelPreview() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* 通知公告 */}
      <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-bold text-[#1e2b3c]">通知公告</h4>
          <span className="text-xs text-[#b71c1c]">更多 →</span>
        </div>
        <div className="space-y-1.5">
          {['动态', '通知', '公告'].map((cat, i) => (
            <div key={cat} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 text-[8px] rounded ${
                  i === 0 ? 'bg-blue-50 text-blue-600' : i === 1 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                }`}>{cat}</span>
                <span className="text-xs text-gray-700 line-clamp-1">2026年陕西省直属事业单位招聘公告</span>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">05-26</span>
            </div>
          ))}
        </div>
      </div>
      {/* 欢迎关注 */}
      <div className="bg-[#f2f6fc] rounded-lg p-3 border border-[#e2e9f0]">
        <h4 className="text-xs font-bold text-[#1e3a6f] mb-2">
          <FontAwesomeIcon icon={faQrcode} className="mr-1" />欢迎关注
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded p-1.5 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded mx-auto mb-1 flex items-center justify-center">
                <FontAwesomeIcon icon={i === 1 ? faWeixin : faQrcode} className="text-gray-300 text-sm" />
              </div>
              <p className="text-[8px] text-gray-500">{i === 1 ? '公众号' : '视频号'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 新闻动态区预览
function NewsSectionsPreview() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 左侧：工会新闻 */}
      <div className="bg-white rounded-lg p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-[#1e2b3c]">
            <FontAwesomeIcon icon={faNewspaper} className="mr-1.5 text-[#b71c1c]" />
            工会新闻
          </h4>
          <span className="text-xs text-[#b71c1c]">更多 →</span>
        </div>
        <div className="space-y-1.5">
          {[
            { tag: '动态', color: 'bg-red-50 text-red-600', title: '高新区总工会开展"送清凉"慰问活动' },
            { tag: '动态', color: 'bg-red-50 text-red-600', title: '陕西省职工职业技能竞赛正式启动' },
            { tag: '动态', color: 'bg-red-50 text-red-600', title: '西安市总工会举办就业服务专场招聘会' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 text-[8px] rounded ${item.color}`}>{item.tag}</span>
                <span className="text-xs text-gray-700 line-clamp-1">{item.title}</span>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">05-2{i}</span>
            </div>
          ))}
        </div>
      </div>
      {/* 右侧：时政新闻 */}
      <div className="bg-white rounded-lg p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-[#1e2b3c]">
            <FontAwesomeIcon icon={faBullhorn} className="mr-1.5 text-[#b71c1c]" />
            时政新闻
          </h4>
          <span className="text-xs text-[#b71c1c]">更多 →</span>
        </div>
        <div className="space-y-1.5">
          {[
            { tag: '政策', color: 'bg-blue-50 text-blue-600', title: '国务院印发就业促进政策指导意见' },
            { tag: '政策', color: 'bg-blue-50 text-blue-600', title: '人社部发布新就业形态劳动者权益保障办法' },
            { tag: '政策', color: 'bg-blue-50 text-blue-600', title: '全国总工会推进产业工人队伍建设改革' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 text-[8px] rounded ${item.color}`}>{item.tag}</span>
                <span className="text-xs text-gray-700 line-clamp-1">{item.title}</span>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">05-2{i}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 办事服务预览
function ServiceGridPreview() {
  const services = [
    { icon: faMapMarkedAlt, label: '工会地图' },
    { icon: faUserPlus, label: '入会' },
    { icon: faExchangeAlt, label: '转会' },
    { icon: faCommentDots, label: '职工诉求' },
    { icon: faGraduationCap, label: '求学圆梦' },
    { icon: faFemale, label: '女职工评优' },
    { icon: faHandHoldingHeart, label: '困难职工' },
    { icon: faEllipsisH, label: '更多服务' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-[#1e2b3c]">
          <FontAwesomeIcon icon={faConciergeBell} className="mr-1.5" />
          办事服务
        </h4>
      </div>
      <div className="grid grid-cols-8 gap-2 text-center">
        {services.map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-1">
              <FontAwesomeIcon icon={s.icon} className="text-[#b22222] text-sm" />
            </div>
            <span className="text-[10px] text-gray-700 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 主预览组件
export default function HomeSectionPreview({ sectionId, isDragging, isDropTarget, className }: SectionPreviewProps) {
  const renderPreview = () => {
    switch (sectionId) {
      case 'header':
        return <HeaderPreview />;
      case 'hero-carousel':
        return <HeroCarouselPreview />;
      case 'news-sections':
        return <NewsSectionsPreview />;
      case 'notice-panel':
        return <NoticePanelPreview />;
      case 'service-grid':
        return <ServiceGridPreview />;
      default:
        return <div className="h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">未知区块</div>;
    }
  };

  return (
    <div
      className={`
        rounded-xl overflow-hidden transition-all duration-200
        ${isDragging ? 'opacity-50 border-2 border-dashed border-blue-400' : 'opacity-100'}
        ${isDropTarget ? 'border-t-4 border-t-blue-500' : 'border border-gray-200'}
        hover:shadow-md bg-white
        ${className || ''}
      `}
    >
      {renderPreview()}
    </div>
  );
}
