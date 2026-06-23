'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  RotateCcw,
  Award,
} from 'lucide-react';

interface Choice {
  id: string;
  text: string;
  sortOrder: number;
}

interface Question {
  id: string;
  text: string;
  explanation: string | null;
  points: number;
  sortOrder: number;
  choices: Choice[];
}

interface QuizResult {
  attempt: {
    id: string;
    score: number;
    passed: boolean;
    completedAt: string;
  };
  passingScore: number;
  results?: Record<string, { correct: boolean; correctAnswerId: string }>;
  questions?: Array<{
    id: string;
    text: string;
    explanation: string | null;
    choices: Array<{ id: string; text: string; isCorrect: boolean }>;
  }>;
}

interface QuizInterfaceProps {
  quizId: string;
  questions: Question[];
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  passingScore: number;
  trackSlug: string;
  moduleSlug: string;
}

export function QuizInterface({
  quizId,
  questions: initialQuestions,
  shuffleQuestions,
  showCorrectAnswers,
  passingScore,
  trackSlug,
  moduleSlug,
}: QuizInterfaceProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  useEffect(() => {
    // Shuffle questions on mount if enabled
    let processedQuestions = [...initialQuestions];
    if (shuffleQuestions) {
      processedQuestions = processedQuestions.sort(() => Math.random() - 0.5);
    }
    setQuestions(processedQuestions);
  }, [initialQuestions, shuffleQuestions]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleStart = () => {
    setIsStarted(true);
    setStartedAt(new Date());
  };

  const handleSelectAnswer = (choiceId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choiceId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setShowSubmitDialog(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          startedAt: startedAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
    setIsStarted(false);
    router.refresh();
  };

  // Quiz not started - show start screen
  if (!isStarted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Ready to Begin?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            This quiz has {questions.length} questions. You need {passingScore}% to pass.
          </p>
          <ul className="text-sm text-left max-w-md mx-auto space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Answer all questions to the best of your ability</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>You can navigate between questions before submitting</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Review your answers before final submission</span>
            </li>
          </ul>
          <Button size="lg" onClick={handleStart} className="px-8">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Quiz completed - show results
  if (result) {
    return (
      <div className="space-y-6">
        <Card className={result.attempt.passed ? 'border-green-200' : 'border-red-200'}>
          <CardContent className="pt-6 text-center space-y-4">
            {result.attempt.passed ? (
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {result.attempt.passed ? 'Congratulations!' : 'Keep Learning!'}
              </h2>
              <p className="text-muted-foreground">
                {result.attempt.passed
                  ? "You've passed the quiz!"
                  : `You need ${passingScore}% to pass. You can try again.`}
              </p>
            </div>
            <div className="text-5xl font-bold text-ascent-navy">
              {Math.round(result.attempt.score)}%
            </div>
            <Badge variant={result.attempt.passed ? 'success' : 'secondary'} className="text-lg">
              {result.attempt.passed ? 'Passed' : 'Not Passed'}
            </Badge>
          </CardContent>
        </Card>

        {/* Show correct answers if enabled */}
        {showCorrectAnswers && result.results && result.questions && (
          <Card>
            <CardHeader>
              <CardTitle>Review Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.questions.map((question, index) => {
                const questionResult = result.results![question.id];
                const userAnswer = answers[question.id];

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border ${
                      questionResult.correct
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {questionResult.correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {index + 1}. {question.text}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 ml-8">
                      {question.choices.map((choice) => {
                        const isUserAnswer = choice.id === userAnswer;
                        const isCorrectAnswer = choice.isCorrect;

                        return (
                          <div
                            key={choice.id}
                            className={`p-2 rounded text-sm ${
                              isCorrectAnswer
                                ? 'bg-green-200 text-green-800'
                                : isUserAnswer
                                ? 'bg-red-200 text-red-800'
                                : 'bg-white'
                            }`}
                          >
                            {choice.text}
                            {isCorrectAnswer && (
                              <span className="ml-2 text-green-700">(Correct)</span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="ml-2 text-red-700">(Your answer)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {question.explanation && (
                      <p className="text-sm text-muted-foreground mt-3 ml-8">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          {!result.attempt.passed && (
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button onClick={() => router.push(`/dashboard/learning/${trackSlug}`)}>
            Back to Track
          </Button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Navigation Dots */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(index)}
            className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
              index === currentIndex
                ? 'bg-ascent-navy text-white'
                : answers[q.id]
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {currentIndex + 1}. {currentQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleSelectAnswer}
              className="space-y-3"
            >
              {currentQuestion.choices.map((choice) => (
                <div
                  key={choice.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === choice.id
                      ? 'border-ascent-navy bg-ascent-navy/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectAnswer(choice.id)}
                >
                  <RadioGroupItem value={choice.id} id={choice.id} />
                  <Label htmlFor={choice.id} className="flex-1 cursor-pointer">
                    {choice.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={() => setShowSubmitDialog(true)}
              disabled={!allAnswered || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Unanswered warning */}
      {!allAnswered && currentIndex === questions.length - 1 && (
        <Alert>
          <AlertTitle>Some questions are unanswered</AlertTitle>
          <AlertDescription>
            Please answer all {questions.length - answeredCount} remaining questions before
            submitting.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {questions.length} questions. Once submitted,
              you cannot change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit Quiz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
