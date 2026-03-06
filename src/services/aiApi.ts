// Gemini API 연동 서비스
// 부부동산봇이 DB 데이터에 접근하는 방식:
// 프론트엔드에서 데이터를 조회 → FinancialContext로 정리 → Gemini API prompt에 전달

export interface FinancialAdvice {
  message: string;
  type: 'praise' | 'warning' | 'tip' | 'celebration';
  emoji: string;
  actions?: string[];
}

export interface MonthlyExpenseDetail {
  category: string;
  amount: number;
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
  // 이전달 상세 데이터 (챌린지용)
  previousMonthData?: {
    income: number;
    expense: number;
    savingsRate: number;
    expenseByCategory?: MonthlyExpenseDetail[];
  };
}

// Gemini API 키
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGeminiAPI(prompt: string, systemInstruction?: string): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

// 금융 조언 가져오기
export async function getFinancialAdvice(context: FinancialContext): Promise<FinancialAdvice> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key is not set. Using dummy advice.');
    return getDummyAdvice(context);
  }

  try {
    const prompt = generatePrompt(context);
    const systemInstruction = '당신은 친근한 재무 조언가 봇입니다. 반드시 요청된 JSON 형식으로만 응답하세요.';
    const responseText = await callGeminiAPI(prompt, systemInstruction);
    return parseAdviceResponse(responseText, context);
  } catch (error) {
    console.error('Gemini API error (advice):', error);
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

// 챌린지 생성 프롬프트 - 이전달 실제 데이터 활용
function buildChallengePrompt(context: FinancialContext): string {
  const prevMonth = context.previousMonthData;
  const prevMonthExpenses = prevMonth?.expenseByCategory
    ?.sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(e => `  - ${e.category}: ${e.amount.toLocaleString()}원`)
    .join('\n') || '  (카테고리별 상세 데이터 없음)';

  return `
당신은 신혼부부(${context.coupleNames.join(', ')})의 자산 관리를 돕는 친근하고 똑똑한 금융 AI 비서 '부부동산봇'입니다.
**지난달의 실제 지출 데이터**를 분석하여, **이번 달에 실천할 수 있는 구체적이고 달성 가능한 재정 챌린지 1개**를 제안해주세요.

## 부부 금융 컨텍스트
- 현재 순자산: ${context.currentNetWorth.toLocaleString()}원 (목표: ${context.targetNetWorth.toLocaleString()}원)
- 연간 목표 달성률: ${context.progress.toFixed(1)}% (${context.monthsLeft}개월 남음)
- 평균 저축률: ${context.averageSavingsRate.toFixed(1)}%

## 지난달 실제 데이터 (챌린지 기준)
- 수입: ${prevMonth ? prevMonth.income.toLocaleString() : 0}원
- 지출: ${prevMonth ? prevMonth.expense.toLocaleString() : 0}원
- 저축률: ${prevMonth ? prevMonth.savingsRate.toFixed(1) : 0}%
- 카테고리별 지출 (Top 5):
${prevMonthExpenses}

## 월 평균 데이터
- 월 평균 수입: ${context.monthlyIncome.toLocaleString()}원
- 월 평균 지출: ${context.monthlyExpense.toLocaleString()}원

## 챌린지 생성 가이드라인
1. **지난달 데이터 기반**: 지난달에 가장 많이 지출한 카테고리에서 줄일 수 있는 구체적 챌린지를 제안하세요.
2. **구체성**: "돈 아끼기" 같은 막연한 목표가 아닌 "외식 월 4회로 줄이기, 예상 절감액 15만원" 처럼 구체적으로 제시하세요.
3. **달성 가능성**: 현재 지출의 10~20% 감소 수준의 현실적인 목표를 설정하세요.
4. **긍정적이고 응원하는 톤**: 친근하게 동기부여해 주세요.

응답은 반드시 아래 JSON 형식으로만 작성하세요:
{
  "id": "${Date.now().toString()}",
  "title": "챌린지 제목 (짧고 명확하게, 예: 외식비 줄이기 챌린지)",
  "description": "지난달 데이터 기반으로 친근한 설명과 기대 효과 (구체적 숫자 포함)",
  "targetReduction": 15,
  "currentReduction": 0,
  "category": "절약 카테고리 (예: 식비, 외식, 쇼핑 등)"
}
`;
}

// 월간 챌린지 가져오기
export async function getMonthlyChallenge(context: FinancialContext) {
  const prompt = buildChallengePrompt(context);

  try {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API Key is missing. Using mock challenge.');
      return getMockChallenge();
    }

    const systemInstruction = '당신은 금융 조언가입니다. 반드시 요청된 JSON 형식으로만 응답하세요.';
    const responseText = await callGeminiAPI(prompt, systemInstruction);
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error calling Gemini API for challenge:', error);
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
