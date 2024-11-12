"use client";

import { useState } from "react";
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

  const generateQuiz = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.post("/api/quiz", {
        content: chapterContent
      });
      
      setQuestions(data.questions);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
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
    <div className="mt-6 relative">
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-8 text-center">
          {isLoading ? (
            <div className="space-y-3">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">Generating Quiz...</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Our AI is creating personalized questions based on the chapter content.
              </p>
            </div>
          ) : (
            <>
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
                disabled={isLoading}
              >
                <FaRobot className="w-4 h-4" />
                Generate AI Quiz
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg border border-muted shadow-sm">
            <div className="w-full bg-muted rounded-full h-3 mb-2">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ 
                  width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` 
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {Object.keys(userAnswers).length} of {questions.length} questions answered
            </p>
          </div>

          <div className="grid gap-6">
            {questions.map((question, index) => (
              <div 
                key={index}
                id={`question-${index}`}
                className={cn(
                  "p-8 rounded-xl transition-all duration-300",
                  "border border-muted hover:border-primary/50",
                  "hover:shadow-lg bg-card",
                  "transform hover:-translate-y-1",
                  showResults && (
                    userAnswers[index] === question.correctAnswer 
                      ? "ring-2 ring-green-500/20"
                      : "ring-2 ring-red-500/20"
                  )
                )}
              >
                <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span>{question.question}</span>
                </h4>
                
                <div className="space-y-4">
                  {question.options.map((option, optionIndex) => (
                    <Button
                      key={optionIndex}
                      variant="outline"
                      onClick={() => handleAnswerSelect(index, option)}
                      className={cn(
                        "w-full justify-start p-4 h-auto font-normal",
                        "hover:bg-primary/5",
                        userAnswers[index] === option && "border-primary bg-primary/5",
                        showResults && userAnswers[index] === option && (
                          option === question.correctAnswer
                            ? "border-green-500 bg-green-500/5"
                            : "border-red-500 bg-red-500/5"
                        )
                      )}
                    >
                      {option}
                    </Button>
                  ))}
                </div>

                {showResults && (
                  <div className={cn(
                    "mt-6 p-4 rounded-xl transition-all duration-300",
                    userAnswers[index] === question.correctAnswer 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-red-500/10 text-red-500"
                  )}>
                    <p className="font-medium flex items-center gap-2">
                      {userAnswers[index] === question.correctAnswer 
                        ? <>✓ Correct!</> 
                        : <>✗ Incorrect. The correct answer is: <span className="font-bold">{question.correctAnswer}</span></>}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!showResults && Object.keys(userAnswers).length === questions.length && (
            <Button 
              onClick={calculateResults}
              className="w-full text-lg py-6 font-semibold"
              size="lg"
            >
              Submit Quiz
            </Button>
          )}
          
          {showResults && (
            <div className="text-center p-8 bg-card rounded-lg border border-muted">
              <h3 className="text-2xl font-bold mb-2">
                Your Score: {score}/{questions.length}
              </h3>
              <p className="text-muted-foreground mb-4">
                {score === questions.length 
                  ? "🎉 Perfect score! Excellent work!" 
                  : "Keep practicing to improve your understanding!"}
              </p>
              <Button
                onClick={() => {
                  setQuestions([]);
                  setUserAnswers({});
                  setShowResults(false);
                  setScore(0);
                }}
                variant="outline"
              >
                Try Another Quiz
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator; 