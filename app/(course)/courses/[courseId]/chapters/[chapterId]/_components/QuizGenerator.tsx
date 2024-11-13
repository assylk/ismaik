"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaRobot } from "react-icons/fa6";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from 'sonner';
import { ScrollText } from "lucide-react";
import { useConfettiStore } from "@/hooks/use-confetti-store";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
type Chapter = {
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

interface QuizHistory {
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

interface QuizGeneratorProps {
  chapterContent: Chapter;
  purchase: boolean;
  userProgress?: {
    isCompleted?: boolean;
  };
}

const QuizGenerator = ({ 
  chapterContent, 
  purchase, 
  userProgress
}: QuizGeneratorProps) => {
  console.log(purchase);
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const MAX_ATTEMPTS = 3;
  const [showHistory, setShowHistory] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const confetti = useConfettiStore();

  const fetchAttempts = async () => {
    try {
      setIsLoadingAttempts(true);
      const [attemptsResponse, historyResponse] = await Promise.all([
        axios.post(`/api/quiz/attempts`, {
          userId,
          chapterId: chapterContent.id
        }),
        axios.get(`/api/quiz/history`, {
          params: {
            userId,
            chapterId: chapterContent.id
          }
        })
      ]);
      
      setAttemptCount(Math.max(attemptsResponse.data.attempts, historyResponse.data.history.length));
      setQuizHistory(historyResponse.data.history);
    } catch (error) {
      console.error("Failed to fetch quiz data:", error);
    } finally {
      setIsLoadingAttempts(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAttempts();
    }
  }, [userId, chapterContent.id]);

  useEffect(() => {
    if (questions.length > 0) {
      const answeredQuestions = Object.keys(userAnswers).length;
      const progressPercentage = (answeredQuestions / questions.length) * 100;
      setProgress(progressPercentage);
    }
  }, [userAnswers, questions]);

  const generateQuiz = async () => {
    if (attemptCount >= MAX_ATTEMPTS) {
      toast.error('You have reached the maximum number of quiz attempts');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const response = await axios.post("/api/quiz", {
        content: chapterContent
      });
      
      console.log("Raw response:", response);
      
      let quizData = response.data;
      
      if (!quizData) {
        console.error("Empty response received");
        throw new Error("No data received from server");
      }
      
      if (typeof quizData === 'string') {
        try {
          quizData = JSON.parse(quizData);
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      }
      
      if (!quizData?.questions || !Array.isArray(quizData.questions)) {
        console.error("Invalid questions format:", quizData);
        throw new Error("Invalid quiz data structure received from server");
      }
      
      const validQuestions = quizData.questions.every((q: any) => {
        const isValid = q.question && 
          Array.isArray(q.options) && 
          q.options.length > 0 && 
          q.correctAnswer;
        
        if (!isValid) {
          console.error("Invalid question format:", q);
        }
        return isValid;
      });
      
      if (!validQuestions) {
        throw new Error("Received malformed question data");
      }

      setQuestions(quizData.questions);
      await fetchAttempts();
    } catch (error: any) {
      console.error("Quiz generation error:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error || 
        error.message || 
        "Failed to generate quiz. Please try again.";
      setError(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));

    const nextQuestion = document.querySelector(`#question-${questionIndex + 1}`);
    if (nextQuestion && questionIndex < questions.length - 1) {
      setTimeout(() => {
        nextQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const calculateResults = async () => {
    setIsSubmitting(true);
    let correctAnswers = 0;
    
    try {
      questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      if (correctAnswers === questions.length) {
        confetti.onOpen();
      }

      await axios.post("/api/quiz/results", {
        userId,
        courseId: chapterContent.courseId,
        chapterId: chapterContent.id,
        score: correctAnswers,
        totalQuestions: questions.length,
        answers: questions.map((question, index) => ({
          question: question.question,
          userAnswer: userAnswers[index],
          correctAnswer: question.correctAnswer,
          isCorrect: userAnswers[index] === question.correctAnswer
        }))
      });

      await fetchAttempts();
      setScore(correctAnswers);
      setShowResults(true);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      console.error("Failed to save quiz results:", error);
      setError("Failed to save quiz results. Please try again.");
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setUserAnswers({});
    setShowResults(false);  
    setScore(0);
    setProgress(0);
  };

  const QuizHistoryView = () => (
    <div className="space-y-8">
      {/* Enhanced Header with Stats */}
      <div className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/5 border border-primary/20">
        <div className="relative space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Quiz History
            </h2>
            <Button
              onClick={() => {
                setShowHistory(false);
              }}
              variant="outline"
              className="group hover:scale-105 transition-all duration-300"
            >
              <ScrollText className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              Return to Quiz
            </Button>
          </div>
          
          {quizHistory.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(
                    quizHistory.reduce((acc, curr) => 
                      acc + (curr.score / curr.totalQuestions) * 100, 0
                    ) / quizHistory.length
                  )}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">Best Score</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(
                    Math.max(...quizHistory.map(h => 
                      (h.score / h.totalQuestions) * 100
                    ))
                  )}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold text-primary">{quizHistory.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {quizHistory.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-xl bg-muted/5">
          <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-all duration-300">
            <ScrollText className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No Quiz History Yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Take your first quiz to start tracking your progress and see your improvement over time!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {quizHistory.map((attempt, index) => (
            <div
              key={index}
              className={cn(
                "p-6 rounded-xl transition-all duration-300",
                "hover:shadow-lg",
                "bg-gradient-to-br from-background to-muted/30",
                "border-2 hover:border-primary/50",
                index === 0 && "animate-pulse-slow"
              )}
            >
              {/* Quiz Score Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-16 w-16 rounded-2xl flex items-center justify-center",
                    "bg-gradient-to-br from-primary/10 to-background",
                    "border border-primary/20",
                    "shadow-lg shadow-primary/5"
                  )}>
                    <span className="text-xl font-bold text-primary">
                      {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleDateString()} at{' '}
                      {new Date(attempt.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="font-medium">
                      Score: {attempt.score}/{attempt.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attempt.answers.map((answer, answerIndex) => (
                  <div
                    key={answerIndex}
                    className={cn(
                      "p-4 rounded-xl",
                      "transition-all duration-300",
                      answer.isCorrect 
                        ? "bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20" 
                        : "bg-gradient-to-br from-red-500/10 to-red-500/5 hover:from-red-500/20",
                      "border border-primary/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                        answer.isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                      )}>
                        {answer.isCorrect ? "✓" : "✗"}
                      </span>
                      <div className="space-y-2 flex-1">
                        <p className="font-medium">{answer.question}</p>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            Your answer: <span className="font-medium">{answer.userAnswer}</span>
                          </p>
                          {!answer.isCorrect && (
                            <p className="text-green-500">
                              Correct: <span className="font-medium">{answer.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Add check for quiz access
  const canAccessQuiz = purchase && userProgress?.isCompleted;

  return (
    <div className={cn(
      "mt-6 relative group transition-all duration-300",
      "rounded-xl p-8",
      "bg-gradient-to-br from-background to-muted/50",
      isLoading ? "opacity-60" : "border-2 border-muted hover:border-primary/50 hover:shadow-2xl"
    )}>
      {!purchase ? (
        <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
          <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto rotate-3">
            <FaRobot className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold tracking-tight">Quiz Locked</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {!purchase 
              ? "Purchase this course to access the quiz and test your knowledge."
              : "Complete this chapter to unlock the quiz and test your understanding."}
          </p>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating your quiz...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          {showHistory ? (
            <QuizHistoryView />
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-8 text-center">
              <div className="space-y-3">
                <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 hover:rotate-0 transition-all duration-300">
                  <FaRobot className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">Practice Quiz</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Test your knowledge with an AI-generated quiz based on the chapter content. Get instant feedback on your understanding.
                </p>
              </div>
              <div className="space-y-3">
                {isLoadingAttempts ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading attempts...</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Attempts remaining: {MAX_ATTEMPTS - attemptCount}
                  </p>
                )}
                <div className="flex gap-4">
                  <Button 
                    className="flex items-center gap-2 hover:scale-105 transition-all duration-300 group-hover:shadow-md bg-gradient-to-r from-primary to-primary/80"
                    size="lg"
                    onClick={generateQuiz}
                    disabled={isLoadingAttempts || attemptCount >= MAX_ATTEMPTS}
                  >
                    <FaRobot className="w-4 h-4" />
                    Generate AI Quiz
                  </Button>
                  <Button
                    onClick={() => setShowHistory(true)}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                    disabled={isLoadingAttempts}
                  >
                    <ScrollText className="w-4 h-4" />
                    View History
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.length > 0 && (
                <div className="sticky top-0 bg-background/90 backdrop-blur-md pt-4 pb-2 z-10 px-6 -mx-6 rounded-xl border-b">
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary shadow-lg" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{Object.keys(userAnswers).length} of {questions.length} answered</span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                </div>
              )}

              {questions.map((question, index) => (
                <div 
                  key={index}
                  id={`question-${index}`}
                  className={cn(
                    "space-y-4 p-6 rounded-xl border-2",
                    "hover:shadow-2xl transition-all duration-300",
                    "bg-gradient-to-br from-background to-muted/30",
                    showResults && userAnswers[index] !== question.correctAnswer 
                      ? "hover:border-red-500/50"
                      : "hover:border-primary/50",
                  )}
                >
                  <h4 className="text-xl font-semibold flex items-center gap-2">
                    <span className="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm">
                      {index + 1}
                    </span>
                    {question.question}
                  </h4>
                  
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <Button
                        key={optionIndex}
                        variant="outline"
                        onClick={() => handleAnswerSelect(index, option)}
                        disabled={showResults}
                        className={cn(
                          "w-full justify-start p-4 h-auto font-normal",
                          "hover:bg-primary/5 transition-all duration-300",
                          userAnswers[index] === option && "border-primary bg-primary/5",
                          showResults && option === question.correctAnswer && "border-green-500 bg-green-500/5",
                          showResults && userAnswers[index] === option && option !== question.correctAnswer && "border-red-500 bg-red-500/5"
                        )}
                      >
                        {option}
                      </Button>
                    ))}
                    
                    {showResults && (
                      <div className={cn(
                        "mt-4 p-4 rounded-lg",
                        userAnswers[index] === question.correctAnswer 
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-red-500/10 border border-red-500/20"
                      )}>
                        <h5 className="font-semibold mb-2">Explanation:</h5>
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!showResults && Object.keys(userAnswers).length === questions.length && (
                <Button 
                  onClick={calculateResults}
                  className="w-full bg-primary hover:bg-primary/90 relative"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Answers"
                  )}
                </Button>
              )}
              
              {showResults && (
                <div className="space-y-6">
                  <div className={cn(
                    "text-center p-8 rounded-xl border-2 transition-all duration-300",
                    "relative overflow-hidden backdrop-blur-sm",
                    score === questions.length 
                      ? "bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30" 
                      : "bg-gradient-to-br from-muted to-muted/50 border-muted-foreground/30"
                  )}>
                    <h3 className="text-3xl font-bold mb-4">
                      Your Score: {score}/{questions.length}
                    </h3>
                    <p className="text-muted-foreground text-lg">
                      {score === questions.length 
                        ? "Perfect score! Excellent work! 🎉" 
                        : "Keep practicing to improve your understanding! 💪"}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={resetQuiz}
                      className="w-1/2 bg-gradient-to-r from-secondary to-secondary/80 hover:bg-secondary/90 hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      Try New Quiz
                    </Button>
                    <Button 
                      onClick={() => {
                        resetQuiz();
                        generateQuiz();
                      }}
                      className="w-1/2 bg-gradient-to-r from-primary to-primary/80 hover:bg-primary/90 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      size="lg"
                    >
                      <FaRobot className="w-4 h-4" />
                      Regenerate Quiz
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuizGenerator; 