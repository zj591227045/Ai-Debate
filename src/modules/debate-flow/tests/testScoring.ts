import { LLMService } from '../services/LLMService';
import { ScoringSystem } from '../services/ScoringSystem';
import type { ProcessedSpeech, ScoringContext, ScoringRules } from '../types/interfaces';

// 测试用的评分规则
const testScoringRules: ScoringRules = {
  dimensions: [
    {
      name: "逻辑性",
      weight: 30,
      description: "论证的逻辑严密程度",
      criteria: ["论点清晰", "论证充分", "结构完整"]
    },
    {
      name: "创新性",
      weight: 20,
      description: "观点和论证的创新程度",
      criteria: ["视角新颖", "论证方式创新", "例证独特"]
    },
    {
      name: "表达性",
      weight: 20,
      description: "语言表达的准确性和流畅性",
      criteria: ["用词准确", "语言流畅", "表达清晰"]
    },
    {
      name: "互动性",
      weight: 30,
      description: "与对方观点的互动和回应程度",
      criteria: ["回应准确", "反驳有力", "互动充分"]
    }
  ]
};

// 测试用的发言
const testSpeech: ProcessedSpeech = {
  id: "test_speech_1",
  playerId: "player_1",
  content: `我认为人工智能的发展应该受到适度监管。首先，从安全角度来看，AI技术的快速发展可能带来不可预见的风险。
例如，在自动驾驶领域，如果没有适当的监管标准，可能会导致严重的安全事故。

其次，从伦理角度考虑，AI的决策过程需要保持透明和可解释性。如果没有监管，AI系统可能会做出带有偏见或歧视的决策，
这将损害社会公平。

最后，针对对方提出的"监管会阻碍创新"的观点，我认为恰恰相反。合理的监管框架能够为AI发展提供清晰的指导方向，
反而会促进负责任的创新。就像交通规则不是为了限制出行，而是为了确保安全有序一样。`,
  type: "speech",
  timestamp: Date.now(),
  round: 1,
  role: "assistant",
  metadata: {
    wordCount: 150
  }
};

// 测试用的评分上下文
const testContext: ScoringContext = {
  topic: {
    title: "",
    description: ""
  },
  currentRound: 1,
  totalRounds: 1,
  judge: {
    id: "judge_1",
    name: "评委A",
    characterConfig: {
      id: "judge_char_1",
      personality: "严谨公正",
      speakingStyle: "专业客观",
      background: "资深辩论评委",
      values: ["公平", "理性"],
      argumentationStyle: "分析性思维"
    }
  },
  rules: testScoringRules,
  previousScores: []
};

async function testScoring() {
  console.log("=== 开始测试评分系统 ===");
  
  try {
    // 初始化服务
    const llmService = new LLMService();
    const scoringSystem = new ScoringSystem(llmService);

    console.log("测试发言内容:", testSpeech.content);
    console.log("\n评分规则:", JSON.stringify(testScoringRules, null, 2));

    // 生成评分
    console.log("\n正在生成评分...");
    const score = await scoringSystem.generateScore(testSpeech, testContext);

    console.log("\n=== 评分结果 ===");
    console.log("维度得分:", JSON.stringify(score.dimensions, null, 2));
    console.log("总分:", score.totalScore);
    console.log("评语:", score.comment);

    // 获取统计信息
    const stats = scoringSystem.getScoreStatistics();
    console.log("\n=== 统计信息 ===");
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error("测试过程出错:", error);
  }
}

// 运行测试
 