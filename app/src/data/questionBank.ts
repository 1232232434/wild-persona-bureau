import type { DimensionScores, Question } from '../types/quiz'

interface QuestionOptionBlueprint {
  key: string
  label: string
  text: string
  weight: DimensionScores
}

interface QuestionBlueprint {
  id: string
  scene: string
  prompt: string
  options: QuestionOptionBlueprint[]
}

const createQuestion = (blueprint: QuestionBlueprint): Question => ({
  id: blueprint.id,
  scene: blueprint.scene,
  prompt: blueprint.prompt,
  options: blueprint.options.map((option) => ({
    id: `${blueprint.id}-${option.key}`,
    label: option.label,
    text: option.text,
    weight: option.weight,
  })),
})

const shuffleArray = <T>(items: T[], random: () => number) => {
  const cloned = [...items]

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]]
  }

  return cloned
}

const shuffleQuestion = (question: Question, random: () => number): Question => ({
  ...question,
  options: shuffleArray(question.options.map((option) => ({ ...option })), random),
})

const questionGroups: Question[][] = [
  [
    createQuestion({
      id: 'late-task',
      scene: '下班前的临时加急',
      prompt: '你刚准备下班，领导突然发来一个今晚要看的方案，信息还不完整。你的第一反应更像哪种？',
      options: [
        {
          key: 'a',
          label: '先捋信息',
          text: '先把缺的条件和关键问题列出来，确认哪些地方必须问清，再决定今晚做到哪一步。',
          weight: { social: 1, risk: 2, stress: 1, tempo: 2, energy: 2 },
        },
        {
          key: 'b',
          label: '拉人协作',
          text: '先把最靠谱的人叫上来一起拆任务，别让未知一点点发酵成失控。',
          weight: { social: 5, risk: 4, stress: 4, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '先做样稿',
          text: '不等信息完全补齐，先按你理解做出一个可用版本，再边做边修。',
          weight: { social: 2, risk: 5, stress: 2, tempo: 4, energy: 3 },
        },
        {
          key: 'd',
          label: '守住边界',
          text: '先把能交付的底线、风险和时间范围一次说清，不让预期越滚越大。',
          weight: { social: 3, risk: 3, stress: 3, tempo: 2, energy: 4 },
        },
      ],
    }),
    createQuestion({
      id: 'client-fire',
      scene: '周五晚上的客户追问',
      prompt: '你刚放下电脑，客户群里突然追着要一个版本说明，还顺手加了新的要求。你更像哪种反应？',
      options: [
        {
          key: 'a',
          label: '先理缺口',
          text: '先把客户真正要的重点和缺失信息理出来，避免自己一头冲进去白忙。',
          weight: { social: 1, risk: 2, stress: 1, tempo: 2, energy: 2 },
        },
        {
          key: 'b',
          label: '先叫支援',
          text: '先把能一起顶一下的人拉进来，快速分工，不让消息越堆越乱。',
          weight: { social: 5, risk: 4, stress: 4, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '先交一版',
          text: '先用现有信息交一个能看的版本，再根据反馈继续补和改。',
          weight: { social: 2, risk: 5, stress: 2, tempo: 4, energy: 3 },
        },
        {
          key: 'd',
          label: '先定范围',
          text: '先把今晚能处理的边界、交付方式和风险说明白，避免后面预期失控。',
          weight: { social: 3, risk: 3, stress: 3, tempo: 2, energy: 4 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'new-team',
      scene: '新团队的第一周',
      prompt: '你刚进入一个陌生团队，流程、关系和潜规则都还没摸清。你通常会怎么进入状态？',
      options: [
        {
          key: 'a',
          label: '先摸路线',
          text: '先搞清楚职责边界、关键人和基本流程，再决定哪里值得你发力。',
          weight: { social: 2, risk: 2, stress: 3, tempo: 1, energy: 3 },
        },
        {
          key: 'b',
          label: '边做边学',
          text: '先接事做起来，在实战里试错和修正，比站着观察更能帮你找到节奏。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 5, energy: 4 },
        },
        {
          key: 'c',
          label: '先连关键人',
          text: '先和最核心的几个人建立工作默契，让信息流和协作节奏尽快跑起来。',
          weight: { social: 5, risk: 3, stress: 4, tempo: 3, energy: 5 },
        },
        {
          key: 'd',
          label: '靠直觉定位',
          text: '先凭感觉判断这个团队真正看重什么，再顺着那个方向站稳自己的位置。',
          weight: { social: 1, risk: 3, stress: 2, tempo: 2, energy: 1 },
        },
      ],
    }),
    createQuestion({
      id: 'cross-project',
      scene: '临时加入跨部门项目',
      prompt: '你被临时塞进一个跨部门项目，大家都很忙，也没人有空完整带你。你一般会怎么切进去？',
      options: [
        {
          key: 'a',
          label: '先抓地图',
          text: '先搞清楚项目目标、谁说了算、哪些环节最容易掉链子，再决定怎么动。',
          weight: { social: 2, risk: 2, stress: 3, tempo: 1, energy: 3 },
        },
        {
          key: 'b',
          label: '先上手做',
          text: '先接一块最具体的事情做起来，在动手里快速补齐理解。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 5, energy: 4 },
        },
        {
          key: 'c',
          label: '先找核心人',
          text: '先对齐最关键的几个人，让你一进来就能接上主节奏。',
          weight: { social: 5, risk: 3, stress: 4, tempo: 3, energy: 5 },
        },
        {
          key: 'd',
          label: '先看风向',
          text: '先判断这个项目真正吃哪一套，再选最适合自己的切入姿势。',
          weight: { social: 1, risk: 3, stress: 2, tempo: 2, energy: 1 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'offer-choice',
      scene: '稳定工作还是高成长机会',
      prompt: '你手里同时有两个机会，一个稳定清晰，一个更冒险但成长更快。你更可能怎么选？',
      options: [
        {
          key: 'a',
          label: '先算代价',
          text: '先把最坏情况想透，看自己能不能承受，再决定值不值得跳过去。',
          weight: { social: 2, risk: 1, stress: 2, tempo: 2, energy: 3 },
        },
        {
          key: 'b',
          label: '果断冲高',
          text: '只要上限足够吸引你，你会更愿意先拿下机会，再回头补秩序。',
          weight: { social: 4, risk: 5, stress: 5, tempo: 5, energy: 5 },
        },
        {
          key: 'c',
          label: '先留侧门',
          text: '你会优先找一个能试水、又不至于把主线全盘打碎的切入方式。',
          weight: { social: 3, risk: 4, stress: 3, tempo: 4, energy: 4 },
        },
        {
          key: 'd',
          label: '稳住主线',
          text: '如果这件事会打乱你长期的生活秩序，你更愿意先保住稳定。',
          weight: { social: 2, risk: 1, stress: 1, tempo: 1, energy: 2 },
        },
      ],
    }),
    createQuestion({
      id: 'city-relocation',
      scene: '换城市去更大的平台',
      prompt: '你在考虑要不要离开熟悉的城市，去一个更难但机会更多的平台。你会更像哪种选择方式？',
      options: [
        {
          key: 'a',
          label: '先算下行',
          text: '先认真评估生活成本、风险和失败后怎么退，再决定要不要跳。',
          weight: { social: 2, risk: 1, stress: 2, tempo: 2, energy: 3 },
        },
        {
          key: 'b',
          label: '先抢窗口',
          text: '只要这个机会确实稀缺，你会更倾向于先拿下，再慢慢适应新秩序。',
          weight: { social: 4, risk: 5, stress: 5, tempo: 5, energy: 5 },
        },
        {
          key: 'c',
          label: '先试半步',
          text: '你会先找一个不过度撕裂原生活、又能摸到新机会的过渡方案。',
          weight: { social: 3, risk: 4, stress: 3, tempo: 4, energy: 4 },
        },
        {
          key: 'd',
          label: '先保根基',
          text: '如果新机会会让你失去现有的稳定感，你更愿意把主线先留在原地。',
          weight: { social: 2, risk: 1, stress: 1, tempo: 1, energy: 2 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'friend-group',
      scene: '朋友局突然冷场',
      prompt: '聚会里两个人话赶话气氛变僵，其他人也开始沉默。你通常会先做什么？',
      options: [
        {
          key: 'a',
          label: '拆开处理',
          text: '先把情绪重的人拉开聊几句，听清楚问题到底卡在哪，再决定怎么接。',
          weight: { social: 4, risk: 2, stress: 2, tempo: 2, energy: 4 },
        },
        {
          key: 'b',
          label: '直接接管',
          text: '主动把话题和节奏拎回来，因为你知道场子一死，大家都会更难受。',
          weight: { social: 5, risk: 4, stress: 5, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '先看一眼',
          text: '你会先看谁是真的不爽、谁只是被带情绪，确认后再决定是否介入。',
          weight: { social: 1, risk: 2, stress: 1, tempo: 1, energy: 2 },
        },
        {
          key: 'd',
          label: '转移气氛',
          text: '故意抛一个新话题或新动作，把原本僵住的气压带离那条线上。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 4, energy: 3 },
        },
      ],
    }),
    createQuestion({
      id: 'dinner-table',
      scene: '饭桌上气氛突然变硬',
      prompt: '一桌人聊天时，有两个人越说越顶，其他人已经开始尴尬低头。你通常会怎么处理？',
      options: [
        {
          key: 'a',
          label: '先分开聊',
          text: '你会先把最容易上头的人从场里挪开，私下问清到底哪里不舒服。',
          weight: { social: 4, risk: 2, stress: 2, tempo: 2, energy: 4 },
        },
        {
          key: 'b',
          label: '把场接住',
          text: '你会主动把桌上的节奏接回来，先让大家别继续陷在那股气里。',
          weight: { social: 5, risk: 4, stress: 5, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '先观察谁真在意',
          text: '你会先看谁是真的受伤、谁只是嘴上不饶人，再决定要不要出手。',
          weight: { social: 1, risk: 2, stress: 1, tempo: 1, energy: 2 },
        },
        {
          key: 'd',
          label: '把气压带走',
          text: '你会故意换话题、换座位或拉人做别的事，让那股顶牛的气先散掉。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 4, energy: 3 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'weekend-recharge',
      scene: '一个周末怎么回血',
      prompt: '连续高压一周后，什么安排最能让你在周一前真正恢复状态？',
      options: [
        {
          key: 'a',
          label: '一个人待着',
          text: '把社交和消息都降到最低，自己安静待一阵，反而最能让你恢复完整。',
          weight: { social: 1, risk: 2, stress: 2, tempo: 2, energy: 1 },
        },
        {
          key: 'b',
          label: '和熟人聊聊',
          text: '和最信任的人吃顿饭、散个步，你会恢复得比独处更快。',
          weight: { social: 5, risk: 3, stress: 3, tempo: 3, energy: 4 },
        },
        {
          key: 'c',
          label: '收拢生活',
          text: '把房间、计划和待办重新收拢起来，你会明显感觉自己又有电了。',
          weight: { social: 4, risk: 4, stress: 4, tempo: 4, energy: 5 },
        },
        {
          key: 'd',
          label: '换个地方',
          text: '去一个新地方走走、看点新鲜东西，会更容易把你重新点亮。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 5, energy: 4 },
        },
      ],
    }),
    createQuestion({
      id: 'holiday-reset',
      scene: '假期最后一天怎么回电',
      prompt: '假期快结束了，你想在明天回到状态更好的自己。什么做法最像你？',
      options: [
        {
          key: 'a',
          label: '给自己留白',
          text: '尽量减少外界打扰，让自己安静待着，状态会一点点自然回来。',
          weight: { social: 1, risk: 2, stress: 2, tempo: 2, energy: 1 },
        },
        {
          key: 'b',
          label: '去见想见的人',
          text: '和能让你放松的人见一面，反而会让你更快找回情绪和动力。',
          weight: { social: 5, risk: 3, stress: 3, tempo: 3, energy: 4 },
        },
        {
          key: 'c',
          label: '收拾生活感',
          text: '把作息、环境和明天的安排重新收好，你会更快进入正轨。',
          weight: { social: 4, risk: 4, stress: 4, tempo: 4, energy: 5 },
        },
        {
          key: 'd',
          label: '找点新刺激',
          text: '最后一天去接触一点新鲜感，会比一直躺着更能让你重新亮起来。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 5, energy: 4 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'meeting-spot',
      scene: '会议上被临时点名',
      prompt: '会议进行到一半，负责人突然点名让你现在表态，所有人都在等。你更像哪种反应？',
      options: [
        {
          key: 'a',
          label: '只说重点',
          text: '先停一秒，把信息压缩到最关键，只讲你最确定、最能站住的一句。',
          weight: { social: 2, risk: 2, stress: 2, tempo: 2, energy: 2 },
        },
        {
          key: 'b',
          label: '顺手接住',
          text: '你会直接把局面接过来，在注意力散掉之前帮这场会议重新定节奏。',
          weight: { social: 5, risk: 4, stress: 4, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '借势转向',
          text: '你会顺着这个机会把话题拧向一个更有用、也更对你有利的方向。',
          weight: { social: 4, risk: 5, stress: 4, tempo: 5, energy: 4 },
        },
        {
          key: 'd',
          label: '边缘影响',
          text: '你不太想站在正中，但会用补充和追问悄悄影响最后的结论。',
          weight: { social: 1, risk: 3, stress: 1, tempo: 2, energy: 1 },
        },
      ],
    }),
    createQuestion({
      id: 'demo-callout',
      scene: '汇报时被突然追问态度',
      prompt: '你正在听别人汇报，老板突然转头问你“你怎么看”。全场都停下来看你，你更像哪种反应？',
      options: [
        {
          key: 'a',
          label: '先压缩成一句',
          text: '先把结论压成最稳的一句话，说清立场，不额外扩展太多。',
          weight: { social: 2, risk: 2, stress: 2, tempo: 2, energy: 2 },
        },
        {
          key: 'b',
          label: '直接接棒',
          text: '你会顺势把这一轮关注接住，帮全场重新把讨论带回核心。',
          weight: { social: 5, risk: 4, stress: 4, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '把局面扳向更有利方向',
          text: '你会借着这次发言机会，把话题引到一个更对结果有帮助的方向上。',
          weight: { social: 4, risk: 5, stress: 4, tempo: 5, energy: 4 },
        },
        {
          key: 'd',
          label: '用补充代替站中间',
          text: '你不一定想成为焦点，但会用精准补充悄悄影响最后走向。',
          weight: { social: 1, risk: 3, stress: 1, tempo: 2, energy: 1 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'hidden-risk',
      scene: '方案里有个隐患',
      prompt: '大家都觉得一个方案没问题，但你隐约觉得它后面会出事。你通常会怎么处理？',
      options: [
        {
          key: 'a',
          label: '先做验证',
          text: '先找一个低成本方式试一下，拿到一点证据后再决定要不要拦下来。',
          weight: { social: 3, risk: 4, stress: 3, tempo: 3, energy: 4 },
        },
        {
          key: 'b',
          label: '当场点明',
          text: '哪怕会打断气氛，你也会先把那个风险说出来，不想让大家带着错觉往前冲。',
          weight: { social: 5, risk: 3, stress: 4, tempo: 3, energy: 5 },
        },
        {
          key: 'c',
          label: '再看一眼',
          text: '你会先继续观察，等自己更确定，再用最少的话把事情讲准。',
          weight: { social: 1, risk: 2, stress: 2, tempo: 1, energy: 1 },
        },
        {
          key: 'd',
          label: '悄悄备选',
          text: '不急着推翻原方案，但你会先把备用方案和退出路径准备好。',
          weight: { social: 2, risk: 5, stress: 3, tempo: 4, energy: 3 },
        },
      ],
    }),
    createQuestion({
      id: 'contract-clause',
      scene: '合作条款里藏着风险',
      prompt: '一份合作条款表面看都能过，但你总觉得其中一条后面会埋雷。你更可能怎么做？',
      options: [
        {
          key: 'a',
          label: '先拿小证据',
          text: '先用一个小范围验证把疑点试出来，再决定要不要正面拦。',
          weight: { social: 3, risk: 4, stress: 3, tempo: 3, energy: 4 },
        },
        {
          key: 'b',
          label: '先说出来',
          text: '你会直接把这条风险指出来，哪怕会让原本顺畅的推进停一下。',
          weight: { social: 5, risk: 3, stress: 4, tempo: 3, energy: 5 },
        },
        {
          key: 'c',
          label: '先多看一轮',
          text: '你会再确认一遍，不想在自己还没完全把握之前过早打断局势。',
          weight: { social: 1, risk: 2, stress: 2, tempo: 1, energy: 1 },
        },
        {
          key: 'd',
          label: '先留后手',
          text: '你会在不撕开桌面的前提下，提前准备另一套更安全的退路。',
          weight: { social: 2, risk: 5, stress: 3, tempo: 4, energy: 3 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'boundary-repeat',
      scene: '边界被反复踩',
      prompt: '有人一再越过你的边界，占用你的时间、情绪或资源。你更可能怎么回应？',
      options: [
        {
          key: 'a',
          label: '讲清规则',
          text: '先把规则和底线讲清楚，让这段关系回到你能长期承受的节奏里。',
          weight: { social: 4, risk: 1, stress: 2, tempo: 1, energy: 4 },
        },
        {
          key: 'b',
          label: '立刻收手',
          text: '如果你已经感觉不对，你会很快撤回投入，不让问题继续扩大。',
          weight: { social: 3, risk: 5, stress: 4, tempo: 5, energy: 4 },
        },
        {
          key: 'c',
          label: '先试反应',
          text: '你会先给一次提醒，看看对方到底是无心、试探，还是习惯性越界。',
          weight: { social: 2, risk: 3, stress: 3, tempo: 3, energy: 2 },
        },
        {
          key: 'd',
          label: '改接触方式',
          text: '你会重新安排回应频率和接触次序，让对方很难再踩到你的边线。',
          weight: { social: 5, risk: 3, stress: 5, tempo: 4, energy: 5 },
        },
      ],
    }),
    createQuestion({
      id: 'favor-overload',
      scene: '熟人总把你的帮忙当默认',
      prompt: '一个熟人总在临时找你救火，时间久了像把你的帮忙当成默认。你通常会怎么处理？',
      options: [
        {
          key: 'a',
          label: '先说清规矩',
          text: '你会把能帮到什么程度、什么情况不能接，先讲清楚。',
          weight: { social: 4, risk: 1, stress: 2, tempo: 1, energy: 4 },
        },
        {
          key: 'b',
          label: '直接撤投入',
          text: '一旦你感觉这段互动开始失衡，就会很快收回自己的时间和精力。',
          weight: { social: 3, risk: 5, stress: 4, tempo: 5, energy: 4 },
        },
        {
          key: 'c',
          label: '先试一次提醒',
          text: '你会先给一个提醒，看看对方是真没意识到，还是故意把你当兜底。',
          weight: { social: 2, risk: 3, stress: 3, tempo: 3, energy: 2 },
        },
        {
          key: 'd',
          label: '调整互动节奏',
          text: '你会改变回复频率、接触方式和可用性，让对方自然碰不到你的边界。',
          weight: { social: 5, risk: 3, stress: 5, tempo: 4, energy: 5 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'credit-stolen',
      scene: '功劳被别人顺手拿走',
      prompt: '本来是你的成果，却在公开场合被别人顺势拿走了功劳。你第一时间更像什么？',
      options: [
        {
          key: 'a',
          label: '平静更正',
          text: '不带火气地把事实补完整，让大家自然知道这件事到底是谁做的。',
          weight: { social: 4, risk: 3, stress: 4, tempo: 3, energy: 4 },
        },
        {
          key: 'b',
          label: '先记账',
          text: '你不会当场撕开，但会记住这次失衡，等更值得的时机再处理。',
          weight: { social: 1, risk: 2, stress: 1, tempo: 1, energy: 1 },
        },
        {
          key: 'c',
          label: '借势反打',
          text: '你会顺着现场局势，把下一轮主动权重新拧回到自己手上。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 4, energy: 3 },
        },
        {
          key: 'd',
          label: '用结果夺回',
          text: '你不会在嘴上纠缠太久，而是立刻用下一步行动把位置拿回来。',
          weight: { social: 5, risk: 4, stress: 5, tempo: 5, energy: 5 },
        },
      ],
    }),
    createQuestion({
      id: 'idea-echo',
      scene: '你的点子被别人复述成他的',
      prompt: '开会时你刚讲过的点子，被别人换个说法复述后得到了全场认可。你更像哪种反应？',
      options: [
        {
          key: 'a',
          label: '补全上下文',
          text: '你会平静把这件事的来龙去脉补完整，让功劳自然回到正确位置。',
          weight: { social: 4, risk: 3, stress: 4, tempo: 3, energy: 4 },
        },
        {
          key: 'b',
          label: '先记住这笔账',
          text: '你不会立刻撕破，但会把这个失衡记下来，之后再判断值不值得处理。',
          weight: { social: 1, risk: 2, stress: 1, tempo: 1, energy: 1 },
        },
        {
          key: 'c',
          label: '顺势拿回主动',
          text: '你会顺着这个点继续往前推进，让后面的主动权重新回到自己这边。',
          weight: { social: 3, risk: 5, stress: 3, tempo: 4, energy: 3 },
        },
        {
          key: 'd',
          label: '直接用下一步证明',
          text: '你更愿意用后续动作和成果把位置拿回来，而不是卡在这一句里争。',
          weight: { social: 5, risk: 4, stress: 5, tempo: 5, energy: 5 },
        },
      ],
    }),
  ],
  [
    createQuestion({
      id: 'hard-partner',
      scene: '和很强但难信的人合作',
      prompt: '你必须和一个能力很强、但让你不太放心的人合作一段时间。你会怎么开始？',
      options: [
        {
          key: 'a',
          label: '先划边界',
          text: '先把能共享什么、不能碰什么、什么行为会让合作终止都讲清楚。',
          weight: { social: 3, risk: 2, stress: 5, tempo: 2, energy: 3 },
        },
        {
          key: 'b',
          label: '先跑起来',
          text: '先让事情动起来，用明确的成果和节奏去压住彼此之间的猜疑。',
          weight: { social: 5, risk: 4, stress: 3, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '分层交换',
          text: '每一步只给必要的信息，边合作边看对方到底怎么处理这些信息。',
          weight: { social: 2, risk: 4, stress: 2, tempo: 3, energy: 2 },
        },
        {
          key: 'd',
          label: '保留撤离',
          text: '可以合作，但你会从一开始就留好抽身空间，避免自己被绑死。',
          weight: { social: 2, risk: 5, stress: 3, tempo: 5, energy: 4 },
        },
      ],
    }),
    createQuestion({
      id: 'strong-reputation',
      scene: '和能力强但风评一般的人并肩',
      prompt: '你被安排和一个能力确实很强、但大家私下都不太放心的人一起做关键任务。你会怎么开局？',
      options: [
        {
          key: 'a',
          label: '先讲边线',
          text: '你会先把合作规则、信息边界和不可接受的行为讲得很清楚。',
          weight: { social: 3, risk: 2, stress: 5, tempo: 2, energy: 3 },
        },
        {
          key: 'b',
          label: '先用结果压住猜疑',
          text: '你会先把合作跑起来，让“这件事得先做成”暂时压过彼此的戒心。',
          weight: { social: 5, risk: 4, stress: 3, tempo: 4, energy: 5 },
        },
        {
          key: 'c',
          label: '一步一步试交换',
          text: '你会控制信息和权限的节奏，边合作边看对方值不值得继续信。',
          weight: { social: 2, risk: 4, stress: 2, tempo: 3, energy: 2 },
        },
        {
          key: 'd',
          label: '一开始就留退路',
          text: '你会让自己随时都能抽身，不把全部筹码都押在这段合作里。',
          weight: { social: 2, risk: 5, stress: 3, tempo: 5, energy: 4 },
        },
      ],
    }),
  ],
]

const questionGroupById = new Map<string, number>()
const optionIdsByQuestionId = new Map<string, Set<string>>()

questionGroups.forEach((group, groupIndex) => {
  group.forEach((question) => {
    questionGroupById.set(question.id, groupIndex)
    optionIdsByQuestionId.set(question.id, new Set(question.options.map((option) => option.id)))
  })
})

export const questionSetSize = questionGroups.length

export const buildQuestionSet = (random: () => number = Math.random) =>
  shuffleArray(
    questionGroups.map((group) => {
      const picked = group[Math.floor(random() * group.length)]
      return shuffleQuestion(picked, random)
    }),
    random,
  )

export const isValidQuestionSet = (value: unknown): value is Question[] => {
  if (!Array.isArray(value) || value.length !== questionSetSize) {
    return false
  }

  const seenGroups = new Set<number>()

  return value.every((question) => {
    if (!question || typeof question !== 'object') {
      return false
    }

    const questionId = typeof question.id === 'string' ? question.id : null

    if (!questionId) {
      return false
    }

    const groupIndex = questionGroupById.get(questionId)
    const validOptionIds = optionIdsByQuestionId.get(questionId)

    if (groupIndex === undefined || !validOptionIds || seenGroups.has(groupIndex)) {
      return false
    }

    if (
      typeof question.scene !== 'string' ||
      typeof question.prompt !== 'string' ||
      !Array.isArray(question.options) ||
      question.options.length !== validOptionIds.size
    ) {
      return false
    }

    const optionIds = new Set<string>()
    const optionsAreValid = question.options.every((option: unknown) => {
      if (!option || typeof option !== 'object') {
        return false
      }

      const optionRecord = option as Record<string, unknown>

      if (
        typeof optionRecord.id !== 'string' ||
        optionIds.has(optionRecord.id) ||
        !validOptionIds.has(optionRecord.id) ||
        typeof optionRecord.label !== 'string' ||
        typeof optionRecord.text !== 'string' ||
        !optionRecord.weight ||
        typeof optionRecord.weight !== 'object'
      ) {
        return false
      }

      optionIds.add(optionRecord.id)
      return true
    })

    if (!optionsAreValid) {
      return false
    }

    seenGroups.add(groupIndex)
    return true
  })
}
