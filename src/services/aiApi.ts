// Claude API 연동 서비스
// 부부동산봇이 DB 데이터에 접근하는 방식:
// 프론트엔드에서 데이터를 조회 → FinancialContext로 정리 → Claude API prompt에 전달
// Claude는 DB에 직접 접근하지 않고, 프론트에서 전달한 context를 기반으로 조언 생성

import Anthropic from '@anthropic-ai/sdk';

export interface FinancialAdvice {
  message: string;
  type: 'praise' | 'warning' | 'tip' | 'celebration';
  emoji: string;
  actions?: string[];
}

export interface FinancialContext {
  currentNetWorth: number;
  targetNetWorth: number;
  progress: number;
  streak: number;
  monthsLeft: number;
  averageSavingsRate: number;
  monthlyIncome: number;
  monthlyExpense: number;
  stockReturn: number;
  totalInvestment: number;
  coupleNames: string[];
}

// Claude API 키 (환경 변수에서 가져오기)
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // 프론트엔드 직접 호출 허용
});

// Gemini API 호출
export async function getFinancialAdvice(context: FinancialContext): Promise<FinancialAdvice> {
  // API 키가 없으면 더미 응답 반환
  if (!ANTHROPIC_API_KEY) {
    console.warn('Anthropic API key is not set. Using dummy advice.');
    return getDummyAdvice(context);
  }

  try {
    const prompt = generatePrompt(context);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: 'You are a friendly financial advisor bot. Always respond in valid JSON format only, matching the exact requested structure.',
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    return parseAdviceResponse(contentBlock.text, context);
  } catch (error) {
    console.error('Anthropic API error:', error);
    return getDummyAdvice(context);
  }
}

// 프롬프트 생성 - DB 데이터를 context로 전달
function generatePrompt(context: FinancialContext): string {
  const { coupleNames, currentNetWorth, targetNetWorth, progress, streak, monthsLeft, averageSavingsRate, monthlyIncome, monthlyExpense, stockReturn, totalInvestment } = context;
  const [name1, name2] = coupleNames;
  const savingsAmount = monthlyIncome - monthlyExpense;

  return `
당신은 친근한 부부의 재무 조언가 "부부동산봇"입니다. 반말을 사용하고 이모지를 적극 활용하세요.
${name1}와 ${name2} 부부에게 맞춤형 재무 조언을 해주세요.

=== 부부의 현재 재무 데이터 ===
📊 현재 순자산: ${currentNetWorth.toLocaleString()}원
🎯 연간 목표 순자산: ${targetNetWorth.toLocaleString()}원
📈 목표 달성률: ${progress.toFixed(1)}%
🔥 연속 목표 달성: ${streak}개월
⏰ 올해 남은 기간: ${monthsLeft}개월

💰 월평균 수입: ${monthlyIncome.toLocaleString()}원
💸 월평균 지출: ${monthlyExpense.toLocaleString()}원
💵 월평균 저축: ${savingsAmount.toLocaleString()}원
📊 평균 저축률: ${averageSavingsRate.toFixed(1)}%

📈 주식 투자금: ${totalInvestment.toLocaleString()}원
📊 주식 수익률: ${stockReturn >= 0 ? '+' : ''}${stockReturn.toFixed(1)}%

=== 응답 규칙 ===
위 데이터를 분석하고 다음 JSON 형식으로 응답해주세요:
{
  "message": "친근하고 구체적인 조언 메시지 (숫자를 활용한 구체적 피드백, 120자 이내)",
  "type": "praise 또는 warning 또는 tip 또는 celebration 중 하나",
  "emoji": "적절한 이모지 1개",
  "actions": ["구체적인 행동 제안 1", "행동 제안 2"]
}

조언 유형:
- praise: 목표를 잘 달성하고 있을 때 (달성률 50% 이상, 연속 달성 3개월+)
- warning: 저축률이 낮거나 (20% 미만) 목표 대비 진행이 느릴 때
- tip: 투자 관련 조언이나 재무 팁을 줄 때
- celebration: 큰 성과를 달성했을 때 (달성률 80%+, 연속 5개월+)
`;
}

// 응답 파싱
function parseAdviceResponse(text: string, context: FinancialContext): FinancialAdvice {
  try {
    // JSON 추출 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        message: parsed.message || getDefaultMessage(context),
        type: parsed.type || 'tip',
        emoji: parsed.emoji || '💡',
        actions: parsed.actions || [],
      };
    }
  } catch {
    // 파싱 실패 시 기본 메시지
  }

  return getDummyAdvice(context);
}

// 더미 조언 (API 없을 때)
export function getDummyAdvice(context: FinancialContext): FinancialAdvice {
  const { progress, streak, monthsLeft, averageSavingsRate, stockReturn, coupleNames } = context;
  const [name1, name2] = coupleNames;

  // 상황별 메시지
  if (progress >= 80) {
    return {
      message: `와 ${name1}, ${name2}! 거의 다 왔어! ${progress.toFixed(0)}% 달성! 🎉 마지막까지 힘내자 💪`,
      type: 'celebration',
      emoji: '🎉',
      actions: ['목표 달성을 위해 마지막 스퍼트!', '달성 후 보상 계획 세우기'],
    };
  }

  if (progress >= 50) {
    return {
      message: `벌써 절반 넘었네! ${streak}개월 연속 달성 중이야 🔥 이러면 올해 목표 눈앞이야!`,
      type: 'praise',
      emoji: '🔥',
      actions: ['현재 페이스 유지하기', '추가 저축 여유 확인하기'],
    };
  }

  if (streak >= 3) {
    return {
      message: `연속 ${streak}개월 달성! 이 기세 그대로 가보자 🚀 ${name1}와 ${name2} 최고야!`,
      type: 'praise',
      emoji: '🚀',
      actions: ['꾸준함 유지하기', '작은 목표 추가 설정하기'],
    };
  }

  if (averageSavingsRate < 20) {
    return {
      message: `저축률이 좀 낮은 것 같은데... 지출 한 번 점검필요할듯? 🤔 ${name1}, ${name2} 화이팅!`,
      type: 'warning',
      emoji: '🤔',
      actions: ['지출 내역 확인하기', '고정 지출 줄이는 방법 찾기'],
    };
  }

  if (stockReturn > 10) {
    return {
      message: `주식 대박났네? ${stockReturn.toFixed(1)}% 수익! 🚀 근데 리스크 관리도 잊지 마!`,
      type: 'celebration',
      emoji: '🚀',
      actions: ['수익 일부 현금화 고려', '포트폴리오 리밸런싱'],
    };
  }

  if (monthsLeft <= 3) {
    return {
      message: `올해 목표 달성까지 ${monthsLeft}개월 남았어! 마지막 스퍼트 가보자 🔥`,
      type: 'warning',
      emoji: '🔥',
      actions: ['남은 기간 목표 재설정', '추가 수입원 확인'],
    };
  }

  return {
    message: `상위 15% 부부야! 이런 페이스면 올해 목표 눈에 보인다 👀 ${name1}, ${name2} 힘내자!`,
    type: 'tip',
    emoji: '👀',
    actions: ['현재 저축률 유지하기', '다음 달 목표 설정하기'],
  };
}

// 기본 메시지
function getDefaultMessage(context: FinancialContext): string {
  const { coupleNames, progress } = context;
  return `${coupleNames[0]}, ${coupleNames[1]}! ${progress.toFixed(0)}% 달성했네! 힘내자 💪`;
}

// 챌린지 생성 프롬프트
function buildChallengePrompt(context: FinancialContext): string {
  return `
당신은 신혼부부(${context.coupleNames.join(', ')})의 자산 관리를 돕는 친근하고 똑똑한 금융 AI 비서 '부부동산봇'입니다.
주어진 금융 데이터를 분석하여, **이번 달에 실천할 수 있는 구체적이고 달성 가능한 재정 챌린지 1개**를 제안해주세요.

## 부부 금융 컨텍스트
- 현재 순자산: ${context.currentNetWorth.toLocaleString()}원 (목표: ${context.targetNetWorth.toLocaleString()}원)
- 연간 목표 달성률: ${context.progress.toFixed(1)}% (${context.monthsLeft}개월 남음)
- 평균 저축률: ${context.averageSavingsRate}%
- 월 평균 수입: ${context.monthlyIncome.toLocaleString()}원
- 월 평균 지출: ${context.monthlyExpense.toLocaleString()}원

## 챌린지 생성 가이드라인
1. **구체성**: 막연한 목표(예: "돈 아끼기")가 아닌 구체적인 목표(예: "배달음식 월 3회로 줄이기")를 제시하세요.
2. **달성 가능성**: 현재 상태에서 무리하지 않고 달성할 수 있는 현실적인 목표여야 합니다.
3. **긍정적이고 응원하는 톤**: 딱딱하지 않고 친근하게 동기부여를 해주세요.
4. **목표 수치 산출 기준**: 지출 절감 목표인 경우, 평균 지출의 10~20% 수준이 적당합니다.

응답은 **반드시** 아래 JSON 형식으로만 작성하세요. 다른 설명이나 텍스트를 추가하지 마세요. (마크다운 백틱 없이 순수 JSON만 반환)

{
  "id": "${Date.now().toString()}",
  "title": "챌린지 제목 (짧고 명확하게)",
  "description": "챌린지에 대한 친근한 설명과 기대 효과",
  "targetReduction": 10,
  "currentReduction": 0,
  "category": "절약 카테고리 (예: 식비, 쇼핑, 문화생활 등)"
}
`;
}

// 월간 챌린지 가져오기
export async function getMonthlyChallenge(context: FinancialContext) {
  const prompt = buildChallengePrompt(context);

  try {
    if (!ANTHROPIC_API_KEY) {
      console.warn('Anthropic API Key is missing. Using mock challenge.');
      return getMockChallenge();
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: 'You are a financial advisor. Respond in JSON format only without any markdown formatting.',
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // JSON 문자열 파싱 시도
    const responseText = contentBlock.text;
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return result;
  } catch (error) {
    console.error('Error calling Claude API for challenge:', error);
    return getMockChallenge();
  }
}

function getMockChallenge() {
  return {
    id: Date.now().toString(),
    title: '배달음식 줄이기 챌린지',
    description: '이번 달은 배달음식을 줄이고 집밥을 더 자주 먹어봐요! 식비를 20% 줄일 수 있어요 🍳',
    targetReduction: 20,
    currentReduction: 0,
    category: '식비'
  };
}
