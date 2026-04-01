export const lifeScenes = [
  {
    id: 1,
    title: '身高统计',
    description: '统计班级同学的身高数据',
    icon: '📏',
    color: '#4A90E2',
    bgColor: '#E3F2FD',
    content: {
      title: '身高数据整理',
      data: [
        [138, 136, 150, 142, 152, 130, 146, 133, 131, 149],
        [147, 139, 149, 144, 149, 143, 150, 146, 140, 142],
        [140, 140, 142, 132, 140, 142, 147, 142, 147, 151],
        [139, 154, 136, 143, 138, 145, 133, 131, 150, 135]
      ],
      unit: '厘米',
      questions: [
        '下面是淘气班同学的身高情况，你想如何整理？',
        '小组讨论，说一说数据是怎么整理的？',
        '补充完整，想一想，在整理数据的时候应该注意什么？'
      ]
    }
  },
  {
    id: 2,
    title: '鞋号调查',
    description: '调查男女生的鞋号分布',
    icon: '👟',
    color: '#F5A623',
    bgColor: '#FFF3E0',
    content: {
      title: '鞋号数据统计',
      tables: [
        {
          title: '男生的鞋号',
          data: [
            [33, 34, 34, 36, 35],
            [36, 35, 38, 35, 36],
            [36, 35, 33, 35, 35]
          ]
        },
        {
          title: '女生的鞋号',
          data: [
            [33, 35, 34, 35, 37, 35],
            [33, 35, 36, 35, 34, 36],
            [34, 35, 34, 35, 35, 32]
          ]
        }
      ],
      questions: [
        '妙想是这样做的，你看懂了吗？再接着画下去。',
        '小组讨论，说一说数据是怎么整理的？',
        '补充完整，想一想，在整理数据的时候应该注意什么？'
      ]
    }
  },
  {
    id: 3,
    title: '温度变化',
    description: '记录一周的气温变化',
    icon: '🌡️',
    color: '#E74C3C',
    bgColor: '#FFEBEE',
    content: {
      title: '一周温度记录',
      data: [
        { day: '周一', temp: 22 },
        { day: '周二', temp: 24 },
        { day: '周三', temp: 26 },
        { day: '周四', temp: 25 },
        { day: '周五', temp: 23 },
        { day: '周六', temp: 27 },
        { day: '周日', temp: 28 }
      ],
      unit: '℃',
      questions: [
        '这一周的温度是如何变化的？',
        '哪一天的温度最高？哪一天最低？',
        '预测下周的温度趋势。'
      ]
    }
  },
  {
    id: 4,
    title: '零花钱统计',
    description: '统计每月的零花钱使用',
    icon: '💰',
    color: '#7ED321',
    bgColor: '#F1F8E9',
    content: {
      title: '零花钱使用情况',
      categories: [
        { name: '零食', amount: 50 },
        { name: '文具', amount: 30 },
        { name: '玩具', amount: 40 },
        { name: '书籍', amount: 35 },
        { name: '其他', amount: 25 }
      ],
      unit: '元',
      questions: [
        '哪一类的花费最多？',
        '总共花了多少零花钱？',
        '如何合理规划零花钱？'
      ]
    }
  },
  {
    id: 5,
    title: '考试成绩',
    description: '分析班级考试成绩分布',
    icon: '📊',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    content: {
      title: '考试成绩分布',
      ranges: [
        { range: '90-100 分', count: 12 },
        { range: '80-89 分', count: 18 },
        { range: '70-79 分', count: 10 },
        { range: '60-69 分', count: 5 },
        { range: '60 分以下', count: 2 }
      ],
      questions: [
        '哪个分数段的人数最多？',
        '及格率是多少？',
        '优秀率（90 分以上）是多少？'
      ]
    }
  },
  {
    id: 6,
    title: '阅读时间',
    description: '记录每天的阅读时长',
    icon: '📚',
    color: '#00BCD4',
    bgColor: '#E0F7FA',
    content: {
      title: '每日阅读时间',
      data: [
        { day: '周一', minutes: 30 },
        { day: '周二', minutes: 45 },
        { day: '周三', minutes: 25 },
        { day: '周四', minutes: 60 },
        { day: '周五', minutes: 40 },
        { day: '周六', minutes: 90 },
        { day: '周日', minutes: 75 }
      ],
      unit: '分钟',
      questions: [
        '平均每天阅读多长时间？',
        '哪一天阅读时间最长？',
        '一周总共阅读了多少时间？'
      ]
    }
  },
  {
    id: 7,
    title: '运动项目',
    description: '调查最喜欢的运动项目',
    icon: '⚽',
    color: '#FF5722',
    bgColor: '#FBE9E7',
    content: {
      title: '最受欢迎的运动',
      data: [
        { sport: '足球', votes: 15 },
        { sport: '篮球', votes: 12 },
        { sport: '游泳', votes: 10 },
        { sport: '跑步', votes: 8 },
        { sport: '乒乓球', votes: 6 }
      ],
      questions: [
        '最受欢迎的运动是什么？',
        '一共有多少人参与了调查？',
        '你最喜欢哪项运动？'
      ]
    }
  },
  {
    id: 8,
    title: '水果销量',
    description: '统计水果店的水果销量',
    icon: '🍎',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    content: {
      title: '水果销售统计',
      data: [
        { fruit: '苹果', sales: 120 },
        { fruit: '香蕉', sales: 95 },
        { fruit: '橙子', sales: 88 },
        { fruit: '葡萄', sales: 65 },
        { fruit: '西瓜', sales: 50 }
      ],
      unit: '千克',
      questions: [
        '哪种水果卖得最好？',
        '总共卖出了多少千克水果？',
        '苹果比香蕉多卖了多少？'
      ]
    }
  },
  {
    id: 9,
    title: '交通方式',
    description: '调查同学们的出行方式',
    icon: '🚌',
    color: '#3F51B5',
    bgColor: '#E8EAF6',
    content: {
      title: '上学交通方式',
      data: [
        { method: '步行', count: 8 },
        { method: '自行车', count: 6 },
        { method: '公交车', count: 12 },
        { method: '私家车', count: 10 },
        { method: '地铁', count: 4 }
      ],
      questions: [
        '最常用的交通方式是什么？',
        '选择绿色出行的有多少人？',
        '哪种交通方式最环保？'
      ]
    }
  }
]

export function getSceneById(id) {
  return lifeScenes.find(scene => scene.id === id)
}
