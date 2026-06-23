'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Clock, Trophy, Star, HelpCircle,
  ChevronRight, RotateCcw, Zap, Award
} from 'lucide-react';

// Quiz card for listing quizzes
interface QuizCardProps {
  id: string;
  title: string;
  description?: string;
  questionsCount: number;
  timeLimit?: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xpReward: number;
  completed?: boolean;
  bestScore?: number;
  attempts?: number;
  onStart?: () => void;
  onReview?: () => void;
}

export function QuizCard({
  id,
  title,
  description,
  questionsCount,
  timeLimit,
  difficulty,
  category,
  xpReward,
  completed,
  bestScore,
  attempts = 0,
  onStart,
  onReview,
}: QuizCardProps) {
  const getDifficultyColor = (d: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
    };
    return colors[d] || colors.medium;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{title}</h3>
              {completed && bestScore === 100 && (
                <Trophy className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            {questionsCount} questions
          </span>
          {timeLimit && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {timeLimit} min
            </span>
          )}
          <Badge variant="outline">{category}</Badge>
        </div>

        {completed && bestScore !== undefined && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Best Score</span>
              <span className={`font-bold ${bestScore >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                {bestScore}%
              </span>
            </div>
            {attempts > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {attempts} attempt{attempts > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge className="bg-indigo-100 text-indigo-700">
            <Zap className="h-3 w-3 mr-1" />
            {xpReward} XP
          </Badge>
          <div className="flex gap-2">
            {completed && onReview && (
              <Button variant="outline" size="sm" onClick={onReview}>
                Review
              </Button>
            )}
            <Button size="sm" onClick={onStart}>
              {completed ? 'Retake' : 'Start Quiz'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Question card for active quiz
interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: Array<{ id: string; text: string }>;
  selectedOption?: string;
  correctOption?: string;
  showResult?: boolean;
  explanation?: string;
  onSelectOption: (optionId: string) => void;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  options,
  selectedOption,
  correctOption,
  showResult = false,
  explanation,
  onSelectOption,
}: QuestionCardProps) {
  const getOptionStyle = (optionId: string) => {
    if (!showResult) {
      return selectedOption === optionId
        ? 'border-indigo-500 bg-indigo-50'
        : 'border-gray-200 hover:border-gray-300';
    }

    if (optionId === correctOption) {
      return 'border-green-500 bg-green-50';
    }

    if (optionId === selectedOption && selectedOption !== correctOption) {
      return 'border-red-500 bg-red-50';
    }

    return 'border-gray-200 opacity-50';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          <Progress
            value={(questionNumber / totalQuestions) * 100}
            className="w-32 h-2"
          />
        </div>
      </CardHeader>
      <CardContent>
        <h2 className="text-lg font-semibold mb-6">{question}</h2>

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => !showResult && onSelectOption(option.id)}
              disabled={showResult}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${getOptionStyle(option.id)}`}
            >
              <div className="flex items-center gap-3">
                {showResult && option.id === correctOption && (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                )}
                {showResult && option.id === selectedOption && selectedOption !== correctOption && (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <span>{option.text}</span>
              </div>
            </button>
          ))}
        </div>

        {showResult && explanation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Explanation</p>
            <p className="text-sm text-blue-800">{explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quiz result card
interface QuizResultCardProps {
  title: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  xpEarned: number;
  isPerfect: boolean;
  isNewBest: boolean;
  onRetry: () => void;
  onReview: () => void;
  onContinue: () => void;
}

export function QuizResultCard({
  title,
  score,
  correctAnswers,
  totalQuestions,
  timeSpent,
  xpEarned,
  isPerfect,
  isNewBest,
  onRetry,
  onReview,
  onContinue,
}: QuizResultCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreMessage = () => {
    if (score === 100) return "Perfect score! Outstanding work!";
    if (score >= 80) return "Excellent! You've mastered this topic!";
    if (score >= 60) return "Good job! Keep practicing!";
    return "Keep learning and try again!";
  };

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card className="overflow-hidden">
      {isPerfect && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 text-center text-white">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6" />
            <span className="font-bold text-lg">Perfect Score!</span>
            <Trophy className="h-6 w-6" />
          </div>
        </div>
      )}

      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-center mb-2">{title}</h2>
        <p className="text-center text-muted-foreground mb-6">{getScoreMessage()}</p>

        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getScoreColor()}`}>{score}%</div>
          <p className="text-muted-foreground">
            {correctAnswers} of {totalQuestions} correct
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="font-semibold">{formatTime(timeSpent)}</p>
            <p className="text-xs text-muted-foreground">Time Spent</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <Zap className="h-5 w-5 mx-auto text-indigo-600 mb-1" />
            <p className="font-semibold text-indigo-600">+{xpEarned}</p>
            <p className="text-xs text-muted-foreground">XP Earned</p>
          </div>
        </div>

        {isNewBest && (
          <div className="mb-6 p-3 bg-green-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Award className="h-4 w-4" />
              <span className="font-medium">New Personal Best!</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onReview}>
            Review Answers
          </Button>
          {score < 100 && (
            <Button variant="outline" className="flex-1" onClick={onRetry}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          <Button className="flex-1" onClick={onContinue}>
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quiz timer component
interface QuizTimerProps {
  timeRemaining: number; // in seconds
  isWarning?: boolean;
}

export function QuizTimer({ timeRemaining, isWarning }: QuizTimerProps) {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isWarning ? 'bg-red-100 text-red-700' : 'bg-gray-100'
    }`}>
      <Clock className={`h-4 w-4 ${isWarning ? 'animate-pulse' : ''}`} />
      <span className="font-mono font-semibold">
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

// Quiz progress indicator
interface QuizProgressProps {
  questions: Array<{ answered: boolean; correct?: boolean }>;
  currentIndex: number;
  onJumpTo?: (index: number) => void;
}

export function QuizProgress({ questions, currentIndex, onJumpTo }: QuizProgressProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onJumpTo?.(i)}
          disabled={!onJumpTo}
          className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
            i === currentIndex
              ? 'bg-indigo-500 text-white'
              : q.answered
              ? q.correct === undefined
                ? 'bg-indigo-100 text-indigo-700'
                : q.correct
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-500'
          } ${onJumpTo ? 'hover:opacity-80 cursor-pointer' : ''}`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
