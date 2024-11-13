export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizHistory {
  score: number;
  totalQuestions: number;
  createdAt: Date;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
} 