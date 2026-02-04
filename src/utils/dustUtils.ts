/**
 * 미세먼지 등급 정보 인터페이스
 */
export interface DustGradeInfo {
  grade: number;
  label: string;
  color: string; // Tailwind 텍스트 색상 클래스
  bg: string; // Tailwind 배경 색상 클래스
  guide: string; // 행동 요령 가이드
}

/**
 * PM10 농도에 따른 등급 정보를 반환합니다.
 */
export const getPm10GradeInfo = (value: string | number): DustGradeInfo => {
  const numValue = typeof value === "string" ? parseInt(value) : value;
  if (isNaN(numValue)) return defaultGrade;

  if (numValue <= 30) return grades.good;
  if (numValue <= 80) return grades.moderate;
  if (numValue <= 150) return grades.bad;
  return grades.veryBad;
};

/**
 * PM2.5 농도에 따른 등급 정보를 반환합니다.
 */
export const getPm25GradeInfo = (value: string | number): DustGradeInfo => {
  const numValue = typeof value === "string" ? parseInt(value) : value;
  if (isNaN(numValue)) return defaultGrade;

  if (numValue <= 15) return grades.good;
  if (numValue <= 35) return grades.moderate;
  if (numValue <= 75) return grades.bad;
  return grades.veryBad;
};

const grades = {
  good: {
    grade: 1,
    label: "좋음",
    color: "text-blue-500",
    bg: "bg-blue-50",
    guide: "마음껏 실외 활동 및 환기 가능",
  },
  moderate: {
    grade: 2,
    label: "보통",
    color: "text-green-600",
    bg: "bg-green-50",
    guide: "실외 활동 시 몸 상태에 따라 주의",
  },
  bad: {
    grade: 3,
    label: "나쁨",
    color: "text-orange-500",
    bg: "bg-orange-50",
    guide: "마스크 착용 권고 및 장시간 실외 활동 자제",
  },
  veryBad: {
    grade: 4,
    label: "매우 나쁨",
    color: "text-red-500",
    bg: "bg-red-50",
    guide: "일반인도 실외 활동 제한 및 마스크 필수",
  },
};

const defaultGrade: DustGradeInfo = {
  grade: 0,
  label: "정보없음",
  color: "text-gray-400",
  bg: "bg-gray-50",
  guide: "데이터를 불러올 수 없습니다.",
};
