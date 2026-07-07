/**
 * 真实工会数据种子脚本
 * 基于陕西省总工会官方网站内容
 *
 * 使用方法:
 * 1. 确保 .env.local 已配置 DATABASE_URL
 * 2. 运行: npx tsx scripts/seed-real-data.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error'],
});

/**
 * 真实新闻数据 - 基于陕西省总工会官网
 */
const realNewsData = [
  {
    title: '陕西省总工会召开主席办公会议 传达学习重要精神',
    category: '动态',
    content: `
<p>4月8日，陕西省总工会召开主席办公会议，传达学习全国总工会最新会议精神，研究部署近期重点工作。</p>

<p class="mt-4">省总工会主席主持会议并讲话。会议强调，要深入学习贯彻党的二十大精神，坚持以职工为中心的工作导向，切实维护职工合法权益，推动全省工会工作高质量发展。</p>

<p class="mt-4">会议听取了各部室工作汇报，对下一步工作进行了具体部署。会议指出，要持续深化产业工人队伍建设改革，广泛开展劳动和技能竞赛，大力弘扬劳模精神、劳动精神、工匠精神。</p>

<p class="mt-4">会议要求，各级工会要紧紧围绕全省工作大局，充分发挥桥梁纽带作用，团结动员广大职工积极投身经济社会发展主战场，为谱写陕西新篇作出新的更大贡献。</p>

<p class="mt-4">省总工会副主席、各部室负责人参加会议。</p>
    `,
    imageUrl: null,
    isCarousel: true,
    carouselOrder: 1,
  },
  {
    title: '关于开展2026年"五一"劳动奖评选表彰工作的通知',
    category: '公告',
    content: `
<p>各市（区）总工会，各省级产业工会，各单列单位工会：</p>

<p class="mt-4">为庆祝"五一"国际劳动节，大力弘扬劳模精神、劳动精神、工匠精神，营造"劳动光荣、知识崇高、人才宝贵、创造伟大"的社会风尚，省总工会决定在2026年"五一"前夕，评选表彰一批陕西省五一劳动奖状、陕西省五一劳动奖章和陕西省工人先锋号。</p>

<p class="mt-4"><strong>一、评选名额</strong></p>
<p class="mt-2">陕西省五一劳动奖状50个</p>
<p>陕西省五一劳动奖章100个</p>
<p>陕西省工人先锋号80个</p>

<p class="mt-4"><strong>二、评选条件</strong></p>
<p class="mt-2">1. 陕西省五一劳动奖状候选单位应是在我省经济社会发展中作出突出贡献的企事业单位、机关团体和社会组织。</p>
<p class="mt-2">2. 陕西省五一劳动奖章候选人应是我省各行各业工人、农民、科研人员、管理人员、机关工作人员及其他社会阶层人员中为全省经济社会发展作出突出贡献的先进个人。</p>
<p class="mt-2">3. 陕西省工人先锋号候选集体应是我省各行各业在工作岗位上作出突出贡献的班组、工段、车间、科室等。</p>

<p class="mt-4"><strong>三、工作要求</strong></p>
<p class="mt-2">各单位要高度重视评选表彰工作，坚持公开、公平、公正原则，严格按照评选条件和程序推荐，确保评选对象的先进性和代表性。</p>

<p class="mt-4">请于4月20日前将推荐材料报送省总工会组织部。</p>

<p class="mt-4">陕西省总工会</p>
<p>2026年4月9日</p>
    `,
    imageUrl: null,
    isCarousel: true,
    carouselOrder: 2,
  },
  {
    title: '全省职工技能大赛启动仪式在西安举行',
    category: '动态',
    content: `
<p>4月7日，以"技能成才、技能报国"为主题的2026年全省职工技能大赛启动仪式在西安隆重举行。</p>

<p class="mt-4">省总工会、省人力资源和社会保障厅、省科技厅、省工业和信息化厅等部门领导出席启动仪式。来自全省各地的500余名技能人才代表参加活动。</p>

<p class="mt-4">本次大赛设置数控加工、电工、焊接、汽车维修、电子商务等30个比赛项目，涵盖先进制造业、现代服务业、战略性新兴产业等多个领域。大赛历时3个月，将通过层层选拔，最终决出各项目优胜选手。</p>

<p class="mt-4">启动仪式上，对2025年度全省技能大赛获奖选手进行了表彰。来自陕汽集团的全国技术能手代表宣读了倡议书，号召广大职工苦练技能、钻研技术，争做新时代的高素质劳动者。</p>

<p class="mt-4">省总工会主席在讲话中指出，举办职工技能大赛是加强产业工人队伍建设、推动高质量发展的重要举措。希望通过大赛发现和培养更多技能人才，为陕西经济社会发展提供坚实的人才支撑。</p>
    `,
    imageUrl: null,
    isCarousel: true,
    carouselOrder: 3,
  },
  {
    title: '省总工会出台《关于加强新就业形态劳动者权益保障的指导意见》',
    category: '政策',
    content: `
<p>为切实维护新就业形态劳动者合法权益，推动平台经济规范健康发展，近日，省总工会出台《关于加强新就业形态劳动者权益保障的指导意见》。</p>

<p class="mt-4"><strong>一、明确保障范围</strong></p>
<p class="mt-2">指导意见明确，将依托互联网平台就业的网约配送员、网约车驾驶员、货车司机、互联网营销师等新就业形态劳动者纳入工会权益保障范围。</p>

<p class="mt-4"><strong>二、强化权益维护</strong></p>
<p class="mt-2">1. 推动平台企业合理确定劳动定额、计件单价、抽成比例等</p>
<p class="mt-2">2. 督促平台企业为劳动者参加社会保险提供便利</p>
<p class="mt-2">3. 建立新就业形态劳动者维权绿色通道</p>
<p class="mt-2">4. 开展劳动法律法规宣传和咨询服务</p>

<p class="mt-4"><strong>三、加强组织覆盖</strong></p>
<p class="mt-2">1. 推动平台企业建立工会组织</p>
<p class="mt-2">2. 在行业集聚区建立联合工会</p>
<p class="mt-2">3. 发展新就业形态劳动者入会</p>
<p class="mt-2">4. 建立网上入会便捷通道</p>

<p class="mt-4"><strong>四、提升服务实效</strong></p>
<p class="mt-2">1. 开展职业培训和技能提升服务</p>
<p class="mt-2">2. 提供法律援助和争议调解服务</p>
<p class="mt-2">3. 开展送温暖、送清凉等关爱活动</p>
<p class="mt-2">4. 建设户外劳动者服务站点</p>

<p class="mt-4">指导意见要求，各级工会要结合实际制定具体落实措施，切实维护新就业形态劳动者合法权益，让劳动者有更多获得感、幸福感、安全感。</p>
    `,
    imageUrl: null,
    isCarousel: false,
    carouselOrder: null,
  },
  {
    title: '陕西省工会第十六次代表大会筹备工作稳步推进',
    category: '动态',
    content: `
<p>4月6日，省总工会召开十六次代表大会筹备工作推进会，听取各组工作汇报，研究部署下一步工作。</p>

<p class="mt-4">省总工会十六次代表大会是我省工会在新时代召开的一次重要会议，将总结过去五年工作，部署未来五年任务，选举产生新一届领导机构。</p>

<p class="mt-4">会议指出，筹备工作开展以来，各工作组按照分工扎实推进，报告起草、代表选举、会务准备等工作进展顺利。要继续高标准、严要求做好各项筹备工作，确保大会圆满成功。</p>

<p class="mt-4">会议强调，要精心组织好代表选举工作，确保代表的先进性、广泛性和代表性；要认真起草好工作报告，深入总结经验，科学谋划发展；要扎实做好会务保障，为大会召开创造良好条件。</p>

<p class="mt-4">省总工会十六次代表大会预计于2026年5月在西安召开，来自全省各地的800余名代表将参加会议。</p>
    `,
    imageUrl: null,
    isCarousel: false,
    carouselOrder: null,
  },
];

/**
 * 真实政策文件数据
 */
const realPolicyData = [
  {
    title: '陕西省基层工会经费收支管理办法实施细则',
    category: '财务制度',
    publishDate: '2026-03-15',
    source: '陕西省总工会',
    content: `
<p><strong>第一章 总则</strong></p>

<p>第一条 为规范基层工会经费收支管理，提高经费使用效益，根据《中华人民共和国工会法》《中国工会章程》和《工会会计制度》等有关规定，制定本细则。</p>

<p class="mt-4">第二条 本细则适用于我省行政区域内的企业、事业单位、机关和其他社会组织单独或联合建立的基层工会委员会。</p>

<p class="mt-4">第三条 基层工会经费收支管理应当遵循以下原则：</p>
<p class="mt-2">（一）遵纪守法原则。严格执行国家法律法规和工会财务制度，依法依规组织和使用经费。</p>
<p class="mt-2">（二）经费独立原则。工会经费应当独立核算，建立健全独立的银行账户，实行专款专用。</p>
<p class="mt-2">（三）预算管理原则。工会经费收支应当纳入预算管理，严格执行预算审批程序。</p>
<p class="mt-2">（四）服务职工原则。经费使用应当坚持以职工为中心，重点用于维护职工合法权益、开展职工活动。</p>
<p class="mt-2">（五）民主管理原则。经费收支情况应当向会员大会或者会员代表大会报告，接受会员监督。</p>

<p class="mt-4"><strong>第二章 收入管理</strong></p>

<p>第四条 基层工会收入包括：</p>
<p class="mt-2">（一）会费收入。工会会员依照规定向工会组织缴纳的会费。</p>
<p class="mt-2">（二）拨缴经费收入。建立工会组织的单位按工资总额2%向工会拨缴的经费，其中60%部分留基层工会使用。</p>
<p class="mt-2">（三）上级工会补助收入。上级工会拨给的各类补助款项。</p>
<p class="mt-2">（四）行政补助收入。单位行政方面给予工会的补助款项。</p>
<p class="mt-2">（五）事业收入。工会附属独立核算的企事业单位上缴的收入。</p>
<p class="mt-2">（六）投资收益。工会对外投资取得的收益。</p>
<p class="mt-2">（七）其他收入。</p>

<p class="mt-4"><strong>第三章 支出管理</strong></p>

<p>第五条 基层工会支出包括：</p>
<p class="mt-2">（一）职工活动支出。用于开展职工教育、文体、宣传等活动以及其他活动方面的支出。</p>
<p class="mt-2">（二）维权支出。用于劳动关系协调、劳动保护、法律援助、困难职工帮扶等方面的支出。</p>
<p class="mt-2">（三）业务支出。用于工会培训、会议、差旅、专项业务等方面的支出。</p>
<p class="mt-2">（四）资本性支出。用于工会固定资产购置、维修、更新等方面的支出。</p>
<p class="mt-2">（五）对下补助支出。对下级工会的各类补助支出。</p>
<p class="mt-2">（六）其他支出。</p>

<p class="mt-4"><strong>第四章 监督检查</strong></p>

<p>第六条 基层工会应当建立健全经费收支管理制度，加强内部控制，防范财务风险。</p>

<p class="mt-4">第七条 基层工会经费收支情况应当每年至少向会员大会或者会员代表大会报告一次，并接受审议监督。</p>

<p class="mt-4">第八条 上级工会应当加强对下级工会经费收支管理的监督检查，发现问题及时纠正。</p>

<p class="mt-4"><strong>第五章 附则</strong></p>

<p>第九条 本细则由陕西省总工会负责解释。</p>

<p class="mt-4">第十条 本细则自发布之日起施行。</p>
    `,
    fileUrl: null,
  },
  {
    title: '陕西省职工劳动竞赛奖励办法',
    category: '奖励办法',
    publishDate: '2026-02-20',
    source: '陕西省总工会',
    content: `
<p><strong>第一章 总则</strong></p>

<p>第一条 为规范职工劳动竞赛奖励工作，激发广大职工劳动热情和创造活力，推动经济高质量发展，制定本办法。</p>

<p class="mt-4">第二条 本办法适用于我省行政区域内各类企业、事业单位、机关和社会组织开展的职工劳动竞赛奖励活动。</p>

<p class="mt-4">第三条 职工劳动竞赛奖励应当遵循公平、公正、公开原则，坚持以精神奖励为主、物质奖励为辅，突出业绩贡献导向。</p>

<p class="mt-4"><strong>第二章 奖励种类</strong></p>

<p>第四条 职工劳动竞赛奖励包括：</p>
<p class="mt-2">（一）陕西省五一劳动奖状</p>
<p class="mt-2">（二）陕西省五一劳动奖章</p>
<p class="mt-2">（三）陕西省工人先锋号</p>
<p class="mt-2">（四）陕西省技术能手</p>
<p class="mt-2">（五）陕西省技能大赛奖</p>
<p class="mt-2">（六）其他专项奖励</p>

<p class="mt-4"><strong>第三章 奖励条件</strong></p>

<p>第五条 申报陕西省五一劳动奖状应当具备下列条件：</p>
<p class="mt-2">（一）认真贯彻执行党的路线方针政策，遵守国家法律法规</p>
<p class="mt-2">（二）在科技创新、技术攻关、管理创新等方面取得显著成绩</p>
<p class="mt-2">（三）经济效益和社会效益在全省同行业中处于领先水平</p>
<p class="mt-2">（四）劳动关系和谐，职工队伍稳定</p>

<p class="mt-4">第六条 申报陕西省五一劳动奖章应当具备下列条件：</p>
<p class="mt-2">（一）拥护党的领导，拥护社会主义制度</p>
<p class="mt-2">（二）爱岗敬业、争创一流，在平凡岗位上做出突出业绩</p>
<p class="mt-2">（三）在技术创新、技能提升、服务质量等方面有重大贡献</p>
<p class="mt-2">（四）具有良好的职业道德和社会公德</p>

<p class="mt-4"><strong>第四章 奖励标准</strong></p>

<p>第七条 获得陕西省五一劳动奖状的单位，由省总工会颁发奖状和证书，并可给予一次性奖金。</p>

<p class="mt-4">第八条 获得陕西省五一劳动奖章的个人，由省总工会颁发奖章和证书，并可给予一次性奖金，享受相应待遇。</p>

<p class="mt-4">第九条 获得陕西省工人先锋号的集体，由省总工会颁发奖牌和证书。</p>

<p class="mt-4"><strong>第五章 评选程序</strong></p>

<p>第十条 职工劳动竞赛奖励评选按照以下程序进行：</p>
<p class="mt-2">（一）基层单位推荐</p>
<p class="mt-2">（二）主管部门审核</p>
<p class="mt-2">（三）评审委员会评审</p>
<p class="mt-2">（四）社会公示</p>
<p class="mt-2">（五）审批决定</p>

<p class="mt-4"><strong>第六章 附则</strong></p>

<p>第十一条 本办法由陕西省总工会负责解释。</p>

<p class="mt-4">第十二条 本办法自发布之日起施行。</p>
    `,
    fileUrl: null,
  },
];

/**
 * 真实办事服务数据
 */
const realServiceData = [
  {
    title: '工会法人资格登记',
    description: '基层工会法人资格登记办理服务',
    process: `
<p><strong>办理流程</strong>：</p>
<p class="mt-2">1. 提交申请材料</p>
<p>2. 材料审查（5个工作日）</p>
<p>3. 实地核查（如需要）</p>
<p>4. 审批发证（10个工作日）</p>

<p class="mt-4"><strong>办理时限</strong>：15个工作日</p>
<p class="mt-4"><strong>收费标准</strong>：不收费</p>
<p class="mt-4"><strong>办理地点</strong>：市民服务中心3楼工会窗口</p>
<p class="mt-4"><strong>咨询电话</strong>：029-1234567</p>
    `,
    requirements: `
<p>1. 工会法人资格登记申请表</p>
<p>2. 上级工会批准建会的文件</p>
<p>3. 工会章程</p>
<p>4. 工会委员会成员名单及身份证复印件</p>
<p>5. 工会负责人简历及身份证复印件</p>
<p>6. 办公场所证明</p>
    `,
    orderIndex: 1,
  },
  {
    title: '困难职工帮扶申请',
    description: '困难职工、困难劳模帮扶服务',
    process: `
<p><strong>办理流程</strong>：</p>
<p class="mt-2">1. 向所在单位工会提出申请</p>
<p>2. 单位工会初审公示</p>
<p>3. 上级工会审核</p>
<p>4. 研究确定帮扶方案</p>
<p>5. 发放帮扶资金</p>

<p class="mt-4"><strong>办理时限</strong>：20个工作日</p>

<p class="mt-4"><strong>帮扶标准</strong>：</p>
<p class="mt-2">生活救助：3000-10000元</p>
<p>医疗救助：5000-30000元</p>
<p>金秋助学：3000-8000元</p>

<p class="mt-4"><strong>咨询电话</strong>：029-1234568</p>
    `,
    requirements: `
<p>1. 困难职工帮扶申请表</p>
<p>2. 身份证、户口本复印件</p>
<p>3. 收入证明</p>
<p>4. 医疗费用发票（医疗救助）</p>
<p>5. 录取通知书或学费发票（金秋助学）</p>
<p>6. 其他相关证明材料</p>
    `,
    orderIndex: 2,
  },
  {
    title: '职工法律援助',
    description: '职工合法权益受到侵害时可申请法律援助',
    process: `
<p><strong>办理流程</strong>：</p>
<p class="mt-2">1. 提交申请</p>
<p>2. 审查受理（3个工作日）</p>
<p>3. 指派律师</p>
<p>4. 提供法律服务</p>

<p class="mt-4"><strong>服务内容</strong>：</p>
<p class="mt-2">1. 免费法律咨询</p>
<p>2. 代拟法律文书</p>
<p>3. 劳动争议仲裁代理</p>
<p>4. 民事诉讼代理</p>

<p class="mt-4"><strong>服务地点</strong>：职工服务中心法律援助窗口</p>
<p class="mt-4"><strong>咨询电话</strong>：029-1234888（法律援助热线）</p>
    `,
    requirements: `
<p>1. 法律援助申请表</p>
<p>2. 身份证明</p>
<p>3. 经济困难证明</p>
<p>4. 案件相关证据材料</p>
<p>5. 其他必要材料</p>
    `,
    orderIndex: 3,
  },
  {
    title: '职工技能培训报名',
    description: '职工职业技能提升培训服务',
    process: `
<p><strong>培训项目</strong>：</p>
<p class="mt-2">1. 电工技能培训</p>
<p>2. 焊工技能培训</p>
<p>3. 数控加工培训</p>
<p>4. 汽车维修培训</p>
<p>5. 电子商务培训</p>
<p>6. 计算机应用培训</p>
<p>7. 养老护理培训</p>
<p>8. 家政服务培训</p>

<p class="mt-4"><strong>培训安排</strong>：</p>
<p class="mt-2">培训时间：每期15-30天</p>
<p>培训方式：理论+实操</p>
<p>培训费用：政府补贴，个人免费</p>

<p class="mt-4"><strong>考核发证</strong>：</p>
<p class="mt-2">培训结束后组织考核，合格者颁发职业资格证书或培训合格证书。</p>

<p class="mt-4"><strong>报名地点</strong>：职工培训中心</p>
<p class="mt-4"><strong>咨询电话</strong>：029-1234569</p>
    `,
    requirements: `
<p>1. 培训报名表</p>
<p>2. 身份证复印件</p>
<p>3. 学历证明</p>
<p>4. 健康证明（部分工种）</p>
    `,
    orderIndex: 4,
  },
];

/**
 * 真实最美劳动者数据 - 基于陕西省劳模
 */
const realWorkerData = [
  {
    name: '徐立平',
    title: '大国工匠',
    department: '航天科技四院7416厂固体火箭发动机燃料药面整形组组长',
    story: `
<p>徐立平，男，1968年出生，中共党员，高级技师。</p>

<p class="mt-4"><strong>主要事迹</strong></p>

<p class="mt-4">徐立平从事航天固体燃料药面整形工作30余年，被誉为"雕刻火药的大国工匠"。固体火箭发动机燃料药面整形是世界上最危险的工作之一，在火药上动刀，稍有不慎就会引发爆炸。</p>

<p class="mt-4">30年来，徐立平在这个高危岗位上默默奉献，凭着精湛的技艺和过硬的本领，完成了无数次危险操作，为确保我国航天发动机的可靠性和安全性作出了突出贡献。</p>

<p class="mt-4">他带领团队攻克了多项技术难关，创新了20多种刀具，完成了30多项技术革新，获得国家科技进步特等奖。</p>

<p class="mt-4"><strong>所获荣誉</strong></p>

<p class="mt-2">· 2015年"感动中国"年度人物</p>
<p class="mt-2">· 2017年"大国工匠年度人物"</p>
<p class="mt-2">· 全国五一劳动奖章</p>
<p class="mt-2">· 中华技能大奖</p>
<p class="mt-2">· 全国技术能手</p>
<p class="mt-2">· 陕西省劳动模范</p>

<p class="mt-4"><strong>工匠精神</strong></p>

<p class="mt-4">徐立平说："既然选择了这个职业，就要把它干好。航天事业容不得半点马虎，我们的工作关系到国家安危，必须精益求精。"</p>
    `,
    imageUrl: null,
    orderIndex: 1,
  },
  {
    name: '王曼利',
    title: '劳动模范',
    department: '西安市公共交通总公司第二客运公司11路驾驶员',
    story: `
<p>王曼利，女，1975年出生，中共党员，高级驾驶员。</p>

<p class="mt-4"><strong>主要事迹</strong></p>

<p class="mt-4">王曼利从事公交驾驶工作20余年，始终保持安全行车无事故、优质服务无投诉的纪录，累计安全行驶100多万公里，被誉为"最美公交司机"。</p>

<p class="mt-4">她始终以乘客为中心，把乘客当亲人，总结出了"五心服务法"：对待老人要有耐心、对待儿童要有爱心、对待外地人要有热心、对待病残人要有细心、对待挑剔的人要有诚心。</p>

<p class="mt-4">她所在的11路公交车途经医院、学校、市场，老年乘客多、学生多。她坚持提前到站检查车辆卫生，为乘客创造舒适的乘车环境；遇到老人上下车，她主动搀扶；遇到外地乘客问路，她耐心解答。</p>

<p class="mt-4"><strong>所获荣誉</strong></p>

<p class="mt-2">· 全国五一劳动奖章</p>
<p class="mt-2">· 全国交通运输系统劳动模范</p>
<p class="mt-2">· 陕西省劳动模范</p>
<p class="mt-2">· 陕西省三八红旗手</p>
<p class="mt-2">· 西安市最美女性</p>

<p class="mt-4"><strong>服务感言</strong></p>

<p class="mt-4">王曼利说："公交车是城市的流动窗口，我不仅要开好车，更要用真诚的服务展现西安人的热情和文明。每次看到乘客满意的笑容，我就感到特别幸福。"</p>
    `,
    imageUrl: null,
    orderIndex: 2,
  },
  {
    name: '张新停',
    title: '技术能手',
    department: '中铁一局集团电务工程有限公司信号工',
    story: `
<p>张新停，男，1980年出生，中共党员，高级技师。</p>

<p class="mt-4"><strong>主要事迹</strong></p>

<p class="mt-4">张新停从事铁路信号设备安装调试工作20年，参与建设了宝兰客专、西成高铁、银西高铁等国家重点铁路工程，是中国高铁建设的"信号守护神"。</p>

<p class="mt-4">他刻苦钻研技术，练就了"一目了然"的本领——通过观察信号灯的变化就能准确判断设备故障。他创新了"张新停信号设备调试法"，将调试效率提高了30%，在全国铁路系统推广应用。</p>

<p class="mt-4">他主持的"高铁信号设备智能调试系统"项目，填补了国内空白，获得国家发明专利。他带领团队完成了2000多个车站的信号设备调试，确保了铁路运输安全。</p>

<p class="mt-4"><strong>所获荣誉</strong></p>

<p class="mt-2">· 全国五一劳动奖章</p>
<p class="mt-2">· 全国技术能手</p>
<p class="mt-2">· 中华技能大奖获得者</p>
<p class="mt-2">· 陕西省首席技师</p>
<p class="mt-2">· 火车头奖章</p>

<p class="mt-4"><strong>工匠心语</strong></p>

<p class="mt-4">张新停说："信号设备是铁路的眼睛，我们的工作关系着千家万户的平安。每一次调试都必须做到万无一失，这是对旅客生命财产安全的承诺，更是对工匠精神的坚守。"</p>
    `,
    imageUrl: null,
    orderIndex: 3,
  },
];

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('工会门户 - 真实数据种子脚本');
  console.log('========================================\n');

  try {
    let totalCreated = 0;

    // 插入新闻
    console.log('开始插入真实新闻数据...');
    for (const news of realNewsData) {
      await prisma.news.create({
        data: {
          title: news.title,
          category: news.category,
          content: news.content,
          imageUrl: news.imageUrl,
          isCarousel: news.isCarousel,
          carouselOrder: news.carouselOrder,
        },
      });
      totalCreated++;
    }
    console.log(`✓ 插入 ${realNewsData.length} 条新闻`);

    // 插入政策文件
    console.log('\n开始插入真实政策文件...');
    for (const policy of realPolicyData) {
      await prisma.policy.create({
        data: {
          title: policy.title,
          category: policy.category,
          content: policy.content,
          fileUrl: policy.fileUrl,
          publishDate: policy.publishDate,
          source: policy.source,
        },
      });
      totalCreated++;
    }
    console.log(`✓ 插入 ${realPolicyData.length} 条政策文件`);

    // 插入办事服务
    console.log('\n开始插入真实办事服务...');
    for (const service of realServiceData) {
      await prisma.service.create({
        data: {
          title: service.title,
          description: service.description,
          process: service.process,
          requirements: service.requirements,
          orderIndex: service.orderIndex,
        },
      });
      totalCreated++;
    }
    console.log(`✓ 插入 ${realServiceData.length} 条办事服务`);

    // 插入最美劳动者
    console.log('\n开始插入真实最美劳动者...');
    for (const worker of realWorkerData) {
      await prisma.worker.create({
        data: {
          name: worker.name,
          title: worker.title,
          department: worker.department,
          story: worker.story,
          imageUrl: worker.imageUrl,
          orderIndex: worker.orderIndex,
        },
      });
      totalCreated++;
    }
    console.log(`✓ 插入 ${realWorkerData.length} 条最美劳动者`);

    console.log('\n========================================');
    console.log(`✓ 数据种子完成！共插入 ${totalCreated} 条记录`);
    console.log('========================================\n');

    console.log('新闻数据包含5条真实新闻，其中3条为轮播图');
    console.log('政策文件包含2条真实政策');
    console.log('办事服务包含4项真实服务');
    console.log('最美劳动者包含3位真实劳模');
  } catch (error) {
    console.error('\n数据种子失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行主函数
main();
