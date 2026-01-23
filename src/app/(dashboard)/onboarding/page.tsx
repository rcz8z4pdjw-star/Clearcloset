'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  Star,
  Target,
  BookOpen,
  Trophy,
  Users,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Heart,
  Coins,
  TrendingUp,
  Check,
  Gamepad2,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

const steps = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'about-you', title: 'About You' },
  { id: 'interests', title: 'Interests' },
  { id: 'goals', title: 'Goals' },
  { id: 'tour', title: 'Quick Tour' },
  { id: 'ready', title: 'Ready!' },
];

const interestTopics = [
  { id: 'saving', label: 'Saving Money', icon: Coins, color: 'bg-green-100 text-green-700' },
  { id: 'investing', label: 'Investing', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
  { id: 'budgeting', label: 'Budgeting', icon: Target, color: 'bg-purple-100 text-purple-700' },
  { id: 'business', label: 'Starting a Business', icon: Briefcase, color: 'bg-orange-100 text-orange-700' },
  { id: 'giving', label: 'Giving Back', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  { id: 'career', label: 'Career Planning', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-700' },
];

const goals = [
  { id: 'learn-basics', label: 'Learn the basics of money', description: 'Great for beginners!' },
  { id: 'start-investing', label: 'Start investing', description: 'Build wealth over time' },
  { id: 'manage-money', label: 'Better manage my money', description: 'Track and grow your savings' },
  { id: 'start-business', label: 'Start a business one day', description: 'Be your own boss!' },
  { id: 'help-family', label: 'Help my family', description: 'Contribute to family wealth' },
  { id: 'give-back', label: 'Learn to give back', description: 'Make a positive impact' },
];

const tourSlides = [
  {
    title: 'Learn at Your Pace',
    description: 'Complete fun lessons and earn XP points. Each lesson is designed just for your age group!',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Earn Badges & Rewards',
    description: 'Unlock cool badges, level up your profile, and customize your avatar with XP!',
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    title: 'Challenge Yourself',
    description: 'Take quizzes, complete daily challenges, and compete on the leaderboard!',
    icon: Gamepad2,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Learn Together',
    description: 'Connect with mentors and family members. Learning is better together!',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [tourSlide, setTourSlide] = useState(0);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    // Save onboarding data and redirect to dashboard
    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-8 py-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                <Rocket className="h-16 w-16 text-white" />
              </div>
              <Sparkles className="absolute top-0 right-1/4 h-8 w-8 text-yellow-400 animate-pulse" />
              <Star className="absolute bottom-4 left-1/4 h-6 w-6 text-yellow-400 animate-pulse" />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Ascent!
              </h1>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                Your journey to financial mastery starts here. Let&apos;s get you set up!
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="text-lg py-2 px-4">
                <BookOpen className="h-4 w-4 mr-2" />
                Learn
              </Badge>
              <Badge variant="outline" className="text-lg py-2 px-4">
                <Trophy className="h-4 w-4 mr-2" />
                Earn
              </Badge>
              <Badge variant="outline" className="text-lg py-2 px-4">
                <TrendingUp className="h-4 w-4 mr-2" />
                Grow
              </Badge>
            </div>
          </div>
        );

      case 'about-you':
        return (
          <div className="space-y-8 py-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Let&apos;s Get to Know You!</h2>
              <p className="text-muted-foreground">
                What should we call you?
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Your Nickname</Label>
                <Input
                  id="nickname"
                  placeholder="Enter a fun nickname..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-lg py-6 text-center"
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                This is how we&apos;ll greet you in the app!
              </p>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center">
              <div className="text-center space-y-3">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-4xl shadow-lg">
                  {nickname ? nickname[0].toUpperCase() : '?'}
                </div>
                <p className="font-medium">
                  {nickname || 'Your Avatar'}
                </p>
                <p className="text-xs text-muted-foreground">
                  You can customize your avatar later!
                </p>
              </div>
            </div>
          </div>
        );

      case 'interests':
        return (
          <div className="space-y-8 py-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">What Interests You?</h2>
              <p className="text-muted-foreground">
                Pick topics you&apos;d like to learn about (select at least 2)
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {interestTopics.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedInterests.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleInterest(topic.id)}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-border hover:border-indigo-200 hover:bg-muted/50'}
                    `}
                  >
                    <div className={`w-12 h-12 rounded-lg ${topic.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="font-medium">{topic.label}</p>
                    {isSelected && (
                      <Check className="absolute top-2 right-2 h-5 w-5 text-indigo-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Selected: {selectedInterests.length}/6
            </p>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-8 py-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">What Are Your Goals?</h2>
              <p className="text-muted-foreground">
                We&apos;ll personalize your learning path (select 1-3)
              </p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              {goals.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4
                      ${isSelected
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-border hover:border-green-200 hover:bg-muted/50'}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'bg-green-500 text-white' : 'bg-muted'}
                    `}>
                      {isSelected ? <Check className="h-5 w-5" /> : <Target className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{goal.label}</p>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'tour':
        return (
          <div className="space-y-8 py-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quick Tour</h2>
              <p className="text-muted-foreground">
                Here&apos;s what you can do on Ascent
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Card className="overflow-hidden">
                <div className={`h-48 bg-gradient-to-br ${tourSlides[tourSlide].color} flex items-center justify-center`}>
                  {(() => {
                    const Icon = tourSlides[tourSlide].icon;
                    return <Icon className="h-20 w-20 text-white" />;
                  })()}
                </div>
                <CardContent className="p-6 text-center space-y-4">
                  <h3 className="text-xl font-bold">{tourSlides[tourSlide].title}</h3>
                  <p className="text-muted-foreground">
                    {tourSlides[tourSlide].description}
                  </p>
                </CardContent>
              </Card>

              {/* Slide indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {tourSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTourSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      idx === tourSlide
                        ? 'bg-indigo-500 w-8'
                        : 'bg-muted hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTourSlide(prev => Math.max(0, prev - 1))}
                  disabled={tourSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTourSlide(prev => Math.min(tourSlides.length - 1, prev + 1))}
                  disabled={tourSlide === tourSlides.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center space-y-8 py-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                <Check className="h-16 w-16 text-white" />
              </div>
              <Sparkles className="absolute top-0 right-1/4 h-8 w-8 text-yellow-400 animate-pulse" />
              <Star className="absolute bottom-4 left-1/4 h-6 w-6 text-yellow-400 animate-pulse" />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                You&apos;re All Set, {nickname || 'Explorer'}!
              </h1>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                Your personalized learning journey awaits. Let&apos;s start earning those XP points!
              </p>
            </div>

            {/* Summary */}
            <div className="max-w-sm mx-auto space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Interests</span>
                <span className="text-sm text-muted-foreground">{selectedInterests.length} selected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Goals</span>
                <span className="text-sm text-muted-foreground">{selectedGoals.length} selected</span>
              </div>
            </div>

            {/* Bonus XP */}
            <Card className="max-w-sm mx-auto bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Coins className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-yellow-700">+100 XP Bonus!</p>
                  <p className="text-sm text-yellow-600">For completing onboarding</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {steps[currentStep].title}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-32 px-4">
        <Card className="w-full max-w-3xl shadow-xl border-0">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              Start Learning!
              <Rocket className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={
                (steps[currentStep].id === 'about-you' && !nickname) ||
                (steps[currentStep].id === 'interests' && selectedInterests.length < 2) ||
                (steps[currentStep].id === 'goals' && selectedGoals.length === 0)
              }
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
