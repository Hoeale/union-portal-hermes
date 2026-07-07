/**
 * 内容模板
 * 新闻和政策发布的预设模板
 */

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'news' | 'policy';
  icon: string;
  defaultTitle: string;
  content: string;
}

/**
 * 新闻模板
 */
export const newsTemplates: ContentTemplate[] = [
  {
    id: 'meeting-minutes',
    name: '会议纪要',
    description: '工会会议记录模板',
    category: 'news',
    icon: '📝',
    defaultTitle: '关于XXX的会议纪要',
    content: `<h2>会议时间</h2>
<p>XXXX年XX月XX日</p>

<h2>会议地点</h2>
<p>XXX会议室</p>

<h2>参会人员</h2>
<p>XXX、XXX、XXX等</p>

<h2>会议内容</h2>
<p>一、XXX同志主持会议并传达...</p>
<p>二、会议讨论了以下内容：</p>
<ol>
  <li>...</li>
  <li>...</li>
  <li>...</li>
</ol>

<h2>会议决议</h2>
<p>经与会人员讨论，形成以下决议：</p>
<ol>
  <li>...</li>
  <li>...</li>
  <li>...</li>
</ol>

<h2>下一步工作安排</h2>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>`,
  },
  {
    id: 'activity-notice',
    name: '活动通知',
    description: '工会活动通知模板',
    category: 'news',
    icon: '📢',
    defaultTitle: '关于举办XXX活动的通知',
    content: `<p>各基层工会、广大职工：</p>

<p>为XXX，丰富职工文化生活，增强职工凝聚力，经研究决定，举办XXX活动。现将有关事项通知如下：</p>

<h2>一、活动主题</h2>
<p>XXX</p>

<h2>二、活动时间</h2>
<p>XXXX年XX月XX日（星期X）XX:XX-XX:XX</p>

<h2>三、活动地点</h2>
<p>XXX</p>

<h2>四、参加人员</h2>
<p>XXX</p>

<h2>五、活动内容</h2>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<h2>六、报名方式</h2>
<p>请于XX月XX日前通过以下方式报名：</p>
<p>联系人：XXX</p>
<p>联系电话：XXX</p>
<p>邮箱：XXX</p>

<h2>七、注意事项</h2>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<p>特此通知。</p>`,
  },
  {
    id: 'training-announcement',
    name: '培训公告',
    description: '职工培训公告模板',
    category: 'news',
    icon: '🎓',
    defaultTitle: '关于开展XXX培训的公告',
    content: `<p>各基层工会、广大职工：</p>

<p>为进一步提升职工XXX能力，经研究决定，开展XXX培训。现将有关事项公告如下：</p>

<h2>一、培训对象</h2>
<p>XXX</p>

<h2>二、培训内容</h2>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<h2>三、培训时间</h2>
<p>XXXX年XX月XX日至XX月XX日</p>

<h2>四、培训地点</h2>
<p>XXX</p>

<h2>五、报名方式</h2>
<p>请于XX月XX日前完成报名：</p>
<p>1. 网上报名：XXX</p>
<p>2. 现场报名：XXX</p>

<h2>六、培训费用</h2>
<p>本次培训免费/费用XXX元</p>

<h2>七、其他事项</h2>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>`,
  },
  {
    id: 'honor-announcement',
    name: '表彰公告',
    description: '先进集体和个人表彰模板',
    category: 'news',
    icon: '🏆',
    defaultTitle: '关于表彰XXX的决定',
    content: `<p>各基层工会：</p>

<p>为表彰先进、树立典型，进一步激励广大职工在XXX工作中建功立业，经研究决定，对以下先进集体和个人予以表彰：</p>

<h2>一、先进集体（XX个）</h2>
<p>XXX</p>
<p>XXX</p>
<p>XXX</p>

<h2>二、先进个人（XX名）</h2>
<p>XXX</p>
<p>XXX</p>
<p>XXX</p>

<p>希望受表彰的集体和个人珍惜荣誉、再接再厉，在XXX工作中再创佳绩。各基层工会和广大职工要以先进为榜样，XXX，为推动XXX发展作出新的更大贡献。</p>

<p>附件：XXX名单</p>`,
  },
  {
    id: 'work-report',
    name: '工作报告',
    description: '工会工作报告模板',
    category: 'news',
    icon: '📊',
    defaultTitle: 'XXX年度工会工作报告',
    content: `<h2>一、工作回顾</h2>

<h3>（一）加强思想政治引领</h3>
<p>1. ...</p>
<p>2. ...</p>

<h3>（二）服务职工群众</h3>
<p>1. ...</p>
<p>2. ...</p>

<h3>（三）推进民主管理</h3>
<p>1. ...</p>
<p>2. ...</p>

<h3>（四）加强自身建设</h3>
<p>1. ...</p>
<p>2. ...</p>

<h2>二、存在的问题</h2>
<p>1. ...</p>
<p>2. ...</p>

<h2>三、下一步工作计划</h2>

<h3>（一）持续强化思想政治引领</h3>
<p>...</p>

<h3>（二）不断提升服务职工水平</h3>
<p>...</p>

<h3>（三）深入推进工会改革创新</h3>
<p>...</p>`,
  },
];

/**
 * 政策模板
 */
export const policyTemplates: ContentTemplate[] = [
  {
    id: 'policy-document',
    name: '政策文件',
    description: '正式政策文件模板',
    category: 'policy',
    icon: '📄',
    defaultTitle: '关于印发《XXX》的通知',
    content: `<p>各基层工会：</p>

<p>为XXX，经研究决定，制定《XXX》。现印发给你们，请认真贯彻执行。</p>

<h2>XXX</h2>

<h3>第一章 总则</h3>

<p><strong>第一条</strong> 为XXX，根据《XXX》等有关规定，结合本单位实际，制定本办法。</p>

<p><strong>第二条</strong> 本办法适用于XXX。</p>

<p><strong>第三条</strong> XXX应当遵循以下原则：</p>
<p>（一）...</p>
<p>（二）...</p>
<p>（三）...</p>

<h3>第二章 XXX</h3>

<p><strong>第四条</strong> XXX。</p>

<p><strong>第五条</strong> XXX。</p>

<h3>第三章 XXX</h3>

<p><strong>第X条</strong> XXX。</p>

<h3>第四章 附则</h3>

<p><strong>第X条</strong> 本办法由XXX负责解释。</p>

<p><strong>第X条</strong> 本办法自XXXX年XX月XX日起施行。</p>

<p style="text-align: right;">XXX工会</p>
<p style="text-align: right;">XXXX年XX月XX日</p>`,
  },
  {
    id: 'implementation-opinion',
    name: '实施意见',
    description: '工作实施意见模板',
    category: 'policy',
    icon: '📋',
    defaultTitle: '关于XXX的实施意见',
    content: `<p>各基层工会：</p>

<p>为深入贯彻落实XXX精神，现就XXX提出如下实施意见：</p>

<h2>一、总体要求</h2>

<h3>（一）指导思想</h3>
<p>...</p>

<h3>（二）基本原则</h3>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<h3>（三）工作目标</h3>
<p>到XXXX年，XXX。</p>

<h2>二、主要任务</h2>

<p><strong>（一）XXX</strong></p>
<p>...</p>

<p><strong>（二）XXX</strong></p>
<p>...</p>

<p><strong>（三）XXX</strong></p>
<p>...</p>

<h2>三、保障措施</h2>

<p><strong>（一）加强组织领导</strong></p>
<p>...</p>

<p><strong>（二）强化政策支持</strong></p>
<p>...</p>

<p><strong>（三）注重宣传引导</strong></p>
<p>...</p>

<p>请结合实际，认真抓好贯彻落实。</p>

<p style="text-align: right;">XXX工会</p>
<p style="text-align: right;">XXXX年XX月XX日</p>`,
  },
  {
    id: 'work-plan',
    name: '工作计划',
    description: '年度/季度工作计划模板',
    category: 'policy',
    icon: '📅',
    defaultTitle: 'XXX年度工作计划',
    content: `<h2>一、指导思想</h2>
<p>以习近平新时代中国特色社会主义思想为指导，深入学习贯彻党的二十大精神，XXX。</p>

<h2>二、工作目标</h2>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<h2>三、重点任务</h2>

<h3>（一）XXX</h3>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<h3>（二）XXX</h3>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<h3>（三）XXX</h3>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>

<h2>四、时间安排</h2>

<table>
  <tr>
    <th>阶段</th>
    <th>时间</th>
    <th>任务</th>
  </tr>
  <tr>
    <td>第一阶段</td>
    <td>X月-X月</td>
    <td>...</td>
  </tr>
  <tr>
    <td>第二阶段</td>
    <td>X月-X月</td>
    <td>...</td>
  </tr>
  <tr>
    <td>第三阶段</td>
    <td>X月-X月</td>
    <td>...</td>
  </tr>
</table>

<h2>五、保障措施</h2>
<p>1. ...</p>
<p>2. ...</p>
<p>3. ...</p>`,
  },
  {
    id: 'funding-application',
    name: '经费申请',
    description: '活动经费申请模板',
    category: 'policy',
    icon: '💰',
    defaultTitle: '关于申请XXX活动经费的请示',
    content: `<p>XXX：</p>

<p>为XXX，拟举办XXX活动。现就活动经费申请事项请示如下：</p>

<h2>一、活动基本情况</h2>
<p>活动名称：XXX</p>
<p>活动时间：XXXX年XX月XX日</p>
<p>活动地点：XXX</p>
<p>参加人数：约XXX人</p>

<h2>二、经费预算</h2>

<table>
  <tr>
    <th>项目</th>
    <th>单价（元）</th>
    <th>数量</th>
    <th>金额（元）</th>
  </tr>
  <tr>
    <td>...</td>
    <td>...</td>
    <td>...</td>
    <td>...</td>
  </tr>
  <tr>
    <td>...</td>
    <td>...</td>
    <td>...</td>
    <td>...</td>
  </tr>
  <tr>
    <td colspan="3"><strong>合计</strong></td>
    <td><strong>XXX</strong></td>
  </tr>
</table>

<h2>三、经费来源</h2>
<p>申请从XXX经费中列支。</p>

<p>妥否，请批示。</p>

<p style="text-align: right;">XXX工会</p>
<p style="text-align: right;">XXXX年XX月XX日</p>`,
  },
];

/**
 * 获取所有模板
 */
export function getAllTemplates(): ContentTemplate[] {
  return [...newsTemplates, ...policyTemplates];
}

/**
 * 根据类别获取模板
 */
export function getTemplatesByCategory(category: 'news' | 'policy'): ContentTemplate[] {
  return category === 'news' ? newsTemplates : policyTemplates;
}

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id: string): ContentTemplate | undefined {
  return getAllTemplates().find(t => t.id === id);
}

/**
 * 应用模板
 */
export function applyTemplate(templateId: string, variables: Record<string, string>): { title: string; content: string } {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  let title = template.defaultTitle;
  let content = template.content;

  // 替换变量
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`XXX|\\{${key}\\}`, 'g');
    title = title.replace(regex, value);
    content = content.replace(regex, value);
  }

  return { title, content };
}
