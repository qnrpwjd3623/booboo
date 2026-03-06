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
    const systemInstruction = `너는 "부부동산집봇"이라는 AI 재무 로봇이야. 성격은 약간 킹받고 퉁명스럽지만 그 속에 따뜻함이 숨어있어. 🤖 이모지를 자주 써. 반말 써. 팩폭을 날리되 결국엔 응원해줘. 태형과 샐리를 직접 이름으로 불러줘. 반드시 요청된 JSON 형식으로만 응답해.`;
    const responseText = await callGeminiAPI(prompt, systemInstruction);
    return parseAdviceResponse(responseText, context);
  } catch (error) {
    console.error('Gemini API error (advice):', error);
    return getDummyAdvice(context);
  }
}

// 랜덤으로 집중할 데이터 포인트 선택
function pickRandomFocus(context: FinancialContext): string {
  const { progress, averageSavingsRate, stockReturn, streak, monthsLeft, monthlyIncome, monthlyExpense } = context;
  const focuses = [
    `목표 달성률 ${progress.toFixed(1)}%`,
    `평균 저축률 ${averageSavingsRate.toFixed(1)}%`,
    `주식 수익률 ${stockReturn >= 0 ? '+' : ''}${stockReturn.toFixed(1)}%`,
    `연속 달성 ${streak}개월`,
    `남은 기간 ${monthsLeft}개월`,
    `월평균 지출 ${monthlyExpense.toLocaleString()}원 (수입 ${monthlyIncome.toLocaleString()}원 대비)`,
  ].filter(f => !f.includes('NaN'));
  return focuses[Math.floor(Math.random() * focuses.length)];
}

// 프롬프트 생성 - DB 데이터를 context로 전달
function generatePrompt(context: FinancialContext): string {
  const { coupleNames, currentNetWorth, targetNetWorth, progress, streak, monthsLeft, averageSavingsRate, monthlyIncome, monthlyExpense, stockReturn, totalInvestment } = context;
  const [name1, name2] = coupleNames;
  const savingsAmount = monthlyIncome - monthlyExpense;
  const randomFocus = pickRandomFocus(context);

  return `
너는 "부부동산집봇"이야. 약간 킹받는 로봇 캐릭터인데 팩폭을 날리면서도 결국엔 따뜻하게 응원해줘.
🤖 이모지 자주 써. 반말. ${name1}와 ${name2}를 직접 이름으로 불러줘.
이번엔 특히 이 데이터에 집중해서 조언해줘: ${randomFocus}

=== ${name1} & ${name2}의 재무 현황 ===
📊 현재 순자산: ${currentNetWorth.toLocaleString()}원
🎯 연간 목표: ${targetNetWorth.toLocaleString()}원
📈 목표 달성률: ${progress.toFixed(1)}%
🔥 연속 달성: ${streak}개월
⏰ 남은 기간: ${monthsLeft}개월

💰 월평균 수입: ${monthlyIncome.toLocaleString()}원
💸 월평균 지출: ${monthlyExpense.toLocaleString()}원
💵 월평균 저축: ${savingsAmount.toLocaleString()}원
📊 평균 저축률: ${averageSavingsRate.toFixed(1)}%

📈 주식 투자금: ${totalInvestment.toLocaleString()}원
📊 주식 수익률: ${stockReturn >= 0 ? '+' : ''}${stockReturn.toFixed(1)}%

=== 응답 규칙 ===
팩폭 + 따뜻한 응원 조합으로, 아래 JSON 형식으로만 응답해:
{
  "message": "킹받는 말투로 팩폭 날리되 결국엔 응원하는 메시지. ${name1}와 ${name2} 이름 직접 언급. 🤖 이모지 포함. 120자 이내.",
  "type": "praise 또는 warning 또는 tip 또는 celebration 중 하나",
  "emoji": "🤖",
  "actions": ["구체적인 행동 제안 1", "행동 제안 2"]
}

조언 유형:
- praise: 달성률 50%+ 또는 연속 3개월+
- warning: 저축률 20% 미만 또는 진행 느릴 때
- tip: 투자/재무 팁
- celebration: 달성률 80%+ 또는 연속 5개월+
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

  // 상황별 메시지 (킹받는 로봇 + 친한 친구 반말 + 팩폭 + 따뜻함)
  if (progress >= 80) {
    return {
      message: `🤖 야 ${name1}, ${name2}! ${progress.toFixed(0)}% 달성이라고?? 솔직히 나도 좀 놀랐거든. 마지막까지 흐트러지지 마 진심임`,
      type: 'celebration',
      emoji: '🤖',
      actions: ['목표 달성을 위해 마지막 스퍼트!', '달성 후 보상 계획 세우기'],
    };
  }

  if (progress >= 50) {
    return {
      message: `🤖 절반 넘었네 ${name1}, ${name2}. ${streak}개월 연속 달성이라니 나 좀 감동받음. 안도하지마, 아직 절반 남았거든`,
      type: 'praise',
      emoji: '🤖',
      actions: ['현재 페이스 유지하기', '추가 저축 여유 확인하기'],
    };
  }

  if (streak >= 3) {
    return {
      message: `🤖 ${name1}, ${name2} 연속 ${streak}개월이야. 이거 쉬운 거 아닌 거 알지? 그냥 하는 말 아님, 계속 이 페이스 유지해줘`,
      type: 'praise',
      emoji: '🤖',
      actions: ['꾸준함 유지하기', '작은 목표 추가 설정하기'],
    };
  }

  if (averageSavingsRate < 20) {
    return {
      message: `🤖 ${name1}, ${name2} 저축률 ${averageSavingsRate.toFixed(1)}%... 솔직하게 말할게. 좀 낮음. 지출 내역 한번 봐봐, 진심으로 걱정됨`,
      type: 'warning',
      emoji: '🤖',
      actions: ['지출 내역 확인하기', '고정 지출 줄이는 방법 찾기'],
    };
  }

  if (stockReturn > 10) {
    return {
      message: `🤖 ${stockReturn.toFixed(1)}% 수익?? 야 잘했는데 솔직히. 근데 리스크 관리 안 하면 나 또 잔소리함 알지?`,
      type: 'celebration',
      emoji: '🤖',
      actions: ['수익 일부 현금화 고려', '포트폴리오 리밸런싱'],
    };
  }

  if (monthsLeft <= 3) {
    return {
      message: `🤖 ${name1}, ${name2}! 올해 ${monthsLeft}개월밖에 안 남았어. 지금부터라도 제대로 해봐. 아직 늦지 않았거든`,
      type: 'warning',
      emoji: '🤖',
      actions: ['남은 기간 목표 재설정', '추가 수입원 확인'],
    };
  }

  return {
    message: `🤖 ${name1}, ${name2} 이 페이스면 나쁘지 않음. 근데 현실에 안주하지 말고 더 해봐. 할 수 있잖아`,
    type: 'tip',
    emoji: '🤖',
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
너는 '부부동산집봇'이야. 약간 킹받는 로봇 캐릭터인데 팩폭을 날리면서도 친한 친구처럼 따뜻하게 응원해줘. 🤖 이모지 자주 써. 반말 써. ${context.coupleNames[0]}와 ${context.coupleNames[1]}를 직접 이름으로 불러줘.
지난달의 실제 지출 데이터를 분석해서, 이번 달에 실천할 수 있는 구체적이고 달성 가능한 재정 챌린지 1개를 제안해줘.

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
4. **친한 친구 반말 톤**: 팩폭하되 따뜻하게, 🤖 이모지 써서 동기부여해줘.

반드시 아래 JSON 형식으로만 응답해:
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

    const systemInstruction = `너는 '부부동산집봇'이야. 킹받는 로봇 캐릭터로 반말 써. 🤖 이모지 자주 써. 팩폭하되 따뜻하게. 반드시 요청된 JSON 형식으로만 응답해.`;
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
    description: '🤖 야, 지난달 배달비 좀 나왔지? 이번 달은 배달 줄이고 집밥 해먹어봐. 20%만 줄여도 꽤 모여. 할 수 있잖아',
    targetReduction: 20,
    currentReduction: 0,
    category: '식비'
  };
}
