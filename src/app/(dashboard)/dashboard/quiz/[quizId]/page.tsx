'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Star,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Home,
  Share2,
  Sparkles,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock quiz data
const quizData = {
  id: 'quiz-1',
  title: 'Budgeting Basics Quiz',
  description: 'Test your knowledge of budgeting fundamentals',
  lessonTitle: 'Building Your First Budget',
  totalQuestions: 5,
  passingScore: 80,
  xpReward: 100,
  bonusXp: 50, // for perfect score
  timeLimit: 300, // 5 minutes in seconds
  questions: [
    {
      id: 'q1',
      question: 'What does the "50" in the 50/30/20 budget rule represent?',
      options: [
        { id: 'a', text: 'Savings' },
        { id: 'b', text: 'Needs' },
        { id: 'c', text: 'Wants' },
        { id: 'd', text: 'Investments' },
      ],
      correctAnswer: 'b',
      explanation: 'The 50/30/20 rule allocates 50% of income to needs (housing, food, utilities), 30% to wants, and 20% to savings.',
    },
    {
      id: 'q2',
      question: 'Which of the following is considered a "need" in budgeting?',
      options: [
        { id: 'a', text: 'Streaming subscriptions' },
        { id: 'b', text: 'Dining out' },
        { id: 'c', text: 'Rent or mortgage' },
        { id: 'd', text: 'Concert tickets' },
      ],
      correctAnswer: 'c',
      explanation: 'Needs are essential expenses required for living, such as housing, utilities, groceries, and healthcare.',
    },
    {
      id: 'q3',
      question: 'What is the first step in creating a budget?',
      options: [
        { id: 'a', text: 'Set savings goals' },
        { id: 'b', text: 'Track your expenses' },
        { id: 'c', text: 'Calculate your income' },
        { id: 'd', text: 'Cut unnecessary spending' },
      ],
      correctAnswer: 'c',
      explanation: 'The first step is knowing how much money you have coming in, so you can then allocate it properly.',
    },
    {
      id: 'q4',
      question: 'How much should you aim to save in an emergency fund?',
      options: [
        { id: 'a', text: '1 month of expenses' },
        { id: 'b', text: '3-6 months of expenses' },
        { id: 'c', text: '1 year of expenses' },
        { id: 'd', text: '$500' },
      ],
      correctAnswer: 'b',
      explanation: 'Financial experts recommend saving 3-6 months of living expenses for emergencies to cover unexpected costs like job loss or medical bills.',
    },
    {
      id: 'q5',
      question: 'What is "discretionary spending"?',
      options: [
        { id: 'a', text: 'Money spent on bills' },
        { id: 'b', text: 'Money spent on non-essential items' },
        { id: 'c', text: 'Money put into savings' },
        { id: 'd', text: 'Money used to pay off debt' },
      ],
      correctAnswer: 'b',
      explanation: 'Discretionary spending refers to non-essential purchases like entertainment, hobbies, and luxury items.',
    },
  ],
};

type QuizState = 'intro' | 'in-progress' | 'review' | 'results';

export default function QuizPage() {
  const params = useParams();
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(quizData.timeLimit);
  const [showExplanation, setShowExplanation] = useState(false);

  // Timer
  useEffect(() => {
    if (quizState !== 'in-progress') return;
    if (timeRemaining <= 0) {
      setQuizState('results');
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId: string, answerId: string) => {
    setAnswers({ ...answers, [questionId]: answerId });
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const handleSubmit = () => {
    setQuizState('results');
  };

  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

  const score = calculateScore();
  const passed = score.percentage >= quizData.passingScore;
  const perfectScore = score.percentage === 100;
  const xpEarned = passed ? (perfectScore ? quizData.xpReward + quizData.bonusXp : quizData.xpReward) : 0;

  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  // Intro Screen
  if (quizState === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-indigo-50 to-white">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">{quizData.title}</CardTitle>
            <p className="text-muted-foreground">{quizData.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{quizData.totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{formatTime(quizData.timeLimit)}</p>
                <p className="text-sm text-muted-foreground">Time Limit</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Passing Score</span>
                <Badge>{quizData.passingScore}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">XP Reward</span>
                <Badge className="bg-yellow-100 text-yellow-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {quizData.xpReward} XP
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Perfect Score Bonus</span>
                <Badge className="bg-purple-100 text-purple-700">
                  +{quizData.bonusXp} XP
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Before you start</p>
                  <p className="text-xs text-yellow-700">
                    Once you start, the timer begins. You can&apos;t pause or restart.
                    Answer all questions before time runs out!
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
              size="lg"
              onClick={() => setQuizState('in-progress')}
            >
              Start Quiz
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen
  if (quizState === 'results') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-indigo-50 to-white">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
              passed
                ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                : 'bg-gradient-to-br from-red-400 to-red-500'
            }`}>
              {passed ? (
                <Trophy className="h-12 w-12 text-white" />
              ) : (
                <XCircle className="h-12 w-12 text-white" />
              )}
            </div>

            <h2 className="text-3xl font-bold mb-2">
              {passed ? (perfectScore ? 'Perfect Score!' : 'Quiz Passed!') : 'Keep Learning!'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {passed
                ? 'Great job! You demonstrated solid knowledge.'
                : `You need ${quizData.passingScore}% to pass. Review the material and try again!`}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{score.percentage}%</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-green-600">{score.correct}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-red-600">{score.total - score.correct}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
            </div>

            {passed && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                  <span className="font-bold text-yellow-700">+{xpEarned} XP Earned!</span>
                  {perfectScore && (
                    <Badge className="bg-purple-100 text-purple-700">
                      +{quizData.bonusXp} Bonus!
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setQuizState('review')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Review Answers
              </Button>
              {!passed && (
                <Button
                  onClick={() => {
                    setQuizState('intro');
                    setAnswers({});
                    setCurrentQuestion(0);
                    setTimeRemaining(quizData.timeLimit);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link href="/dashboard/learn">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Lessons
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Review Screen
  if (quizState === 'review') {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Review Your Answers</h2>
            <Button variant="outline" onClick={() => setQuizState('results')}>
              Back to Results
            </Button>
          </div>

          <div className="space-y-4">
            {quizData.questions.map((q, index) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer === q.correctAnswer;

              return (
                <Card key={q.id} className={isCorrect ? 'border-green-200' : 'border-red-200'}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-3">
                          {index + 1}. {q.question}
                        </p>
                        <div className="space-y-2 mb-4">
                          {q.options.map((opt) => {
                            const isSelected = userAnswer === opt.id;
                            const isCorrectOption = opt.id === q.correctAnswer;
                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-lg text-sm ${
                                  isCorrectOption
                                    ? 'bg-green-100 border border-green-300'
                                    : isSelected && !isCorrectOption
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{opt.text}</span>
                                  {isCorrectOption && (
                                    <Badge className="bg-green-500 text-white">Correct</Badge>
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <Badge className="bg-red-500 text-white">Your Answer</Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // In-Progress Screen
  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{quizData.title}</h2>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-muted'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Question {currentQuestion + 1} of {quizData.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <p className="text-xl font-medium mb-6">{question.question}</p>

            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => handleSelectAnswer(question.id, value)}
            >
              <div className="space-y-3">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      answers[question.id] === option.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => handleSelectAnswer(question.id, option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {quizData.questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full cursor-pointer ${
                  answers[quizData.questions[index].id]
                    ? 'bg-indigo-500'
                    : index === currentQuestion
                    ? 'bg-indigo-300'
                    : 'bg-muted'
                }`}
                onClick={() => setCurrentQuestion(index)}
              />
            ))}
          </div>

          {currentQuestion === quizData.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < quizData.questions.length}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              Submit Quiz
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Question indicators */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            {Object.keys(answers).length} of {quizData.questions.length} questions answered
          </p>
        </div>
      </div>
    </div>
  );
}
