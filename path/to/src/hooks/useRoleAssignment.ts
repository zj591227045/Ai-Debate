const newPlayer: Player = {
  id: `player_${Date.now()}`,
  name,
  role: 'unassigned',
  score: 0, // 默认分数
  isActive: false // 默认活跃状态
}; 