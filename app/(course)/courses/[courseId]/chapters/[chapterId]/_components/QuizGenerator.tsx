"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaRobot } from "react-icons/fa6";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
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
const QuizGenerator = ({ chapterContent }: { chapterContent: Chapter }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (questions.length > 0) {
      const answeredQuestions = Object.keys(userAnswers).length;
      const progressPercentage = (answeredQuestions / questions.length) * 100;
      setProgress(progressPercentage);
    }
  }, [userAnswers, questions]);

  const generateQuiz = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const { data } = await axios.post("/api/quiz", {
        content: chapterContent
      });
      
      if (!data?.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid quiz data received from server");
      }
      
      const validQuestions = data.questions.every((q: any) => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length > 0 && 
        q.correctAnswer
      );
      
      if (!validQuestions) {
        throw new Error("Received malformed question data");
      }

      setQuestions(data.questions);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Failed to generate quiz. Please try again.";
      setError(errorMessage);
      console.error("Quiz generation error:", error);
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

  const calculateResults = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setShowResults(true);
  };

  return (
    <div className={cn(
      "mt-6 relative group transition-all duration-300",
      "rounded-lg p-8",
      isLoading ? "opacity-60" : "border border-muted hover:border-primary/50 hover:shadow-xl"
    )}>
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

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-8 text-center">
          <div className="space-y-3">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
              <FaRobot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">Practice Quiz</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Test your knowledge with an AI-generated quiz based on the chapter content. Get instant feedback on your understanding.
            </p>
          </div>
          <Button 
            className="flex items-center gap-2 hover:scale-105 transition-all duration-300 group-hover:shadow-md"
            variant="default"
            size="lg"
            onClick={generateQuiz}
          >
            <FaRobot className="w-4 h-4" />
            Generate AI Quiz
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="sticky top-0 bg-background pt-4 pb-2 z-10">
            <div className="h-2 w-full bg-muted rounded-full">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{Object.keys(userAnswers).length} of {questions.length} answered</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>

          {questions.map((question, index) => (
            <div 
              key={index}
              id={`question-${index}`}
              className={cn(
                "space-y-4 p-6 rounded-xl border",
                "hover:shadow-xl transition-all duration-300",
                "hover:border-primary/50",
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
              </div>
            </div>
          ))}

          {!showResults && Object.keys(userAnswers).length === questions.length && (
            <Button 
              onClick={calculateResults}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Submit Answers
            </Button>
          )}
          
          {showResults && (
            <div className={cn(
              "text-center p-6 rounded-xl",
              score === questions.length ? "bg-green-500/10" : "bg-muted"
            )}>
              <h3 className="text-2xl font-semibold mb-2">
                Your Score: {score}/{questions.length}
              </h3>
              <p className="text-muted-foreground">
                {score === questions.length 
                  ? "Perfect score! Excellent work! 🎉" 
                  : "Keep practicing to improve your understanding! 💪"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator; 