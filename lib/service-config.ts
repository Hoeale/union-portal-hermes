import {
  faMapMarkedAlt, faUserPlus, faExchangeAlt, faCommentDots,
  faGraduationCap, faFemale, faHandHoldingHeart, faTh,
  type IconDefinition
} from '@fortawesome/free-solid-svg-icons';

export interface ServiceConfig {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  icon: IconDefinition;
  gradient: string;
  bgClass: string;
  features: string[];
  route: string;
}

export const SERVICE_ITEMS: ServiceConfig[] = [
  {
    id: 'map',
    title: '工会地图',
    description: '查找附近工会组织',
    fullDescription: '通过工会地图，您可以方便地查找附近的工会组织，了解各工会的服务范围和联系方式，就近享受工会服务。',
    icon: faMapMarkedAlt,
    gradient: 'from-blue-500 to-blue-600',
    bgClass: 'bg-blue-500',
    features: ['查找附近工会', '查看服务范围', '获取联系方式', '导航到工会'],
    route: '/services/map',
  },
  {
    id: 'join',
    title: '入会',
    description: '申请加入工会',
    fullDescription: '职工可以申请加入工会，享受工会提供的各项服务和权益保障。',
    icon: faUserPlus,
    gradient: 'from-green-500 to-green-600',
    bgClass: 'bg-green-500',
    features: ['提交入会申请', '准备相关材料', '现场审核办理', '领取会员证'],
    route: '/services/join',
  },
  {
    id: 'transfer',
    title: '转会',
    description: '工会关系转移办理',
    fullDescription: '工作单位变更时，可以申请工会关系转移，保持会员权益的连续性。',
    icon: faExchangeAlt,
    gradient: 'from-indigo-500 to-indigo-600',
    bgClass: 'bg-indigo-500',
    features: ['提交转移申请', '会籍接续办理', '权益延续确认', '档案转移'],
    route: '/services/transfer',
  },
  {
    id: 'appeal',
    title: '职工诉求',
    description: '反映您的意见建议',
    fullDescription: '职工可以通过此渠道向工会反映诉求、提出建议，工会将及时处理并反馈。',
    icon: faCommentDots,
    gradient: 'from-orange-500 to-orange-600',
    bgClass: 'bg-orange-500',
    features: ['提交诉求申请', '意见建议反馈', '处理进度查询', '结果反馈通知'],
    route: '/services/appeal',
  },
  {
    id: 'education',
    title: '求学圆梦',
    description: '职工学历提升计划',
    fullDescription: '工会助力职工学历提升，提供助学补贴和学历提升通道，帮助职工实现求学梦想。',
    icon: faGraduationCap,
    gradient: 'from-purple-500 to-purple-600',
    bgClass: 'bg-purple-500',
    features: ['学历提升补贴', '合作院校优惠', '学习指导服务', '毕业证书认证'],
    route: '/services/education',
  },
  {
    id: 'female',
    title: '女职工评优申报',
    description: '女职工优秀评选',
    fullDescription: '开展女职工评优活动，表彰在各自岗位上做出突出贡献的优秀女职工。',
    icon: faFemale,
    gradient: 'from-pink-500 to-pink-600',
    bgClass: 'bg-pink-500',
    features: ['优秀女职工申报', '巾帼建功评选', '三八红旗手推荐', '荣誉表彰'],
    route: '/services/female',
  },
  {
    id: 'difficulty',
    title: '困难职工申报',
    description: '困难帮扶申请',
    fullDescription: '为遭遇重大疾病、意外灾害等困难的职工提供帮扶救助，传递工会温暖。',
    icon: faHandHoldingHeart,
    gradient: 'from-red-500 to-red-600',
    bgClass: 'bg-red-500',
    features: ['困难职工认定', '应急救助申请', '长期帮扶计划', '子女助学帮扶'],
    route: '/services/difficulty',
  },
  {
    id: 'more',
    title: '更多服务',
    description: '查看全部服务项目',
    fullDescription: '更多工会服务项目持续更新中，敬请关注。',
    icon: faTh,
    gradient: 'from-gray-500 to-gray-600',
    bgClass: 'bg-gray-500',
    features: ['服务项目介绍', '办理流程说明', '所需材料清单', '常见问题解答'],
    route: '/services',
  },
];

// 根据 ID 获取服务配置
export function getServiceById(id: string): ServiceConfig | undefined {
  return SERVICE_ITEMS.find(item => item.id === id);
}

// 获取所有服务路由
export function getServiceRoutes(): string[] {
  return SERVICE_ITEMS.map(item => item.route);
}
