// 지출/수입 카테고리 상수

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
}

// 지출 카테고리 (사용자 요청 기준)
export const EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: '생활', label: '생활', icon: '🏠' },
  { id: '쇼핑', label: '쇼핑', icon: '🛍️' },
  { id: '자동차비', label: '자동차비', icon: '🚗' },
  { id: '외식비', label: '외식비', icon: '🍽️' },
  { id: '여행/숙박', label: '여행/숙박', icon: '✈️' },
  { id: '대중교통', label: '대중교통', icon: '🚌' },
  { id: '문화/여가', label: '문화/여가', icon: '🎬' },
  { id: '의료/건강', label: '의료/건강', icon: '💊' },
  { id: '카페', label: '카페', icon: '☕' },
  { id: '구독료', label: '구독료', icon: '📱' },
  { id: '주거/통신', label: '주거/통신', icon: '📡' },
  { id: '교육', label: '교육', icon: '📚' },
  { id: '육아', label: '육아', icon: '👶' },
  { id: '경조사', label: '경조사', icon: '🎁' },
  { id: '식비/집밥', label: '식비/집밥', icon: '🥘' },
];

// 수입 카테고리
export const INCOME_CATEGORIES: CategoryItem[] = [
  { id: '급여', label: '급여', icon: '💰' },
  { id: '부업/프리랜서', label: '부업/프리랜서', icon: '💼' },
  { id: '투자수익', label: '투자수익', icon: '📈' },
  { id: '용돈', label: '용돈', icon: '🎀' },
  { id: '상여금', label: '상여금', icon: '🎉' },
  { id: '기타', label: '기타', icon: '✨' },
];

// 카테고리 이름으로 아이콘 조회 (지출+수입 전체 검색)
export function getCategoryIcon(categoryName: string): string {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  return all.find((c) => c.id === categoryName)?.icon ?? '📌';
}
