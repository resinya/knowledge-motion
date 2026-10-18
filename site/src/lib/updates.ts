export type Update = {
  id: string;
  date: string;
  sections: { title: string; description: string; items?: readonly string[] }[];
};

// 按日期倒序维护；同一天的功能合并记录，正文自然撑开时间线。
export const updates: readonly Update[] = [
  {
    id: '2026-10-18',
    date: '2026-10-18',
    sections: [
      {
        title: '新增效果案例',
        description: '支持在线播放和下载三条完整静音视频，直观看到不同知识内容的表达方式。',
        items: ['常见网络端口：分类列表逐项聚焦，局部动画解释用途。', '网购订单流程：步骤依次亮起，对象沿路径传递。', '家庭收支变化：操作、金额与余额同步更新。'],
      },
      {
        title: '官网界面更新',
        description: '统一首页、文档与案例页面的排版，精简导航和说明，增加独立的效果案例与版本更新入口。',
      },
      {
        title: '支持知识动态信息图制作',
        description: '输入主题或已有资料，即可制作分类、流程与状态变化三种布局的知识动画。',
        items: ['默认输出二十秒竖屏高清视频，不包含音轨。', '支持关键画面预览，保留可修改的动画源项目与分镜。', '自动检查成片尺寸、时长、帧率与音轨。'],
      },
    ],
  },
];
