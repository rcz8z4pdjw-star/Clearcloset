'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Gamepad2,
  TrendingUp,
  PiggyBank,
  ShoppingCart,
  Building,
  Coins,
  Star,
  Trophy,
  Play,
  Lock,
  Clock,
  Users,
  Zap,
  Target,
  ChevronRight,
  Crown,
} from 'lucide-react';

// Mock games data
const games = [
  {
    id: 'budget-hero',
    title: 'Budget Hero',
    description: 'Help Alex manage their monthly budget. Make smart choices to save money and reach goals!',
    category: 'Budgeting',
    difficulty: 'Easy',
    ageRange: '10-15',
    xpReward: 100,
    duration: '5-10 min',
    icon: ShoppingCart,
    color: 'from-green-400 to-emerald-500',
    isUnlocked: true,
    highScore: 850,
    played: 12,
    achievements: 3,
  },
  {
    id: 'stock-simulator',
    title: 'Stock Market Simulator',
    description: 'Buy and sell stocks in a safe, simulated market. Learn how the market works without any risk!',
    category: 'Investing',
    difficulty: 'Medium',
    ageRange: '13+',
    xpReward: 200,
    duration: '15-20 min',
    icon: TrendingUp,
    color: 'from-blue-400 to-indigo-500',
    isUnlocked: true,
    highScore: 12500,
    played: 8,
    achievements: 2,
  },
  {
    id: 'savings-quest',
    title: 'Savings Quest',
    description: 'Go on an adventure where every smart money decision brings you closer to treasure!',
    category: 'Saving',
    difficulty: 'Easy',
    ageRange: '10-12',
    xpReward: 75,
    duration: '10 min',
    icon: PiggyBank,
    color: 'from-pink-400 to-rose-500',
    isUnlocked: true,
    highScore: 1200,
    played: 15,
    achievements: 5,
  },
  {
    id: 'entrepreneur-tycoon',
    title: 'Entrepreneur Tycoon',
    description: 'Start and grow your own business! Make decisions about pricing, marketing, and more.',
    category: 'Business',
    difficulty: 'Hard',
    ageRange: '16+',
    xpReward: 300,
    duration: '20-30 min',
    icon: Building,
    color: 'from-purple-400 to-violet-500',
    isUnlocked: false,
    requiredLevel: 5,
    highScore: null,
    played: 0,
    achievements: 0,
  },
  {
    id: 'compound-crusher',
    title: 'Compound Crusher',
    description: 'Watch your money grow with compound interest! A fast-paced game about the power of saving early.',
    category: 'Investing',
    difficulty: 'Medium',
    ageRange: '13+',
    xpReward: 150,
    duration: '10 min',
    icon: Zap,
    color: 'from-yellow-400 to-orange-500',
    isUnlocked: true,
    highScore: 95,
    played: 6,
    achievements: 1,
  },
  {
    id: 'money-match',
    title: 'Money Match',
    description: 'A fun memory game! Match financial terms with their definitions to earn points.',
    category: 'Learning',
    difficulty: 'Easy',
    ageRange: '10+',
    xpReward: 50,
    duration: '5 min',
    icon: Target,
    color: 'from-cyan-400 to-blue-500',
    isUnlocked: true,
    highScore: 180,
    played: 20,
    achievements: 4,
  },
];

const dailyChallenges = [
  {
    id: 'dc1',
    title: 'Score 1000+ in Budget Hero',
    xpReward: 50,
    completed: false,
    game: 'Budget Hero',
  },
  {
    id: 'dc2',
    title: 'Play any game for 15 minutes',
    xpReward: 30,
    completed: true,
    game: null,
  },
  {
    id: 'dc3',
    title: 'Get 3 stars in Money Match',
    xpReward: 75,
    completed: false,
    game: 'Money Match',
  },
];

const leaderboard = [
  { rank: 1, name: 'Alex C.', score: 15420, game: 'All Games' },
  { rank: 2, name: 'Jordan S.', score: 14850, game: 'All Games' },
  { rank: 3, name: 'Taylor K.', score: 13200, game: 'All Games' },
  { rank: 4, name: 'You', score: 12500, game: 'All Games', isYou: true },
  { rank: 5, name: 'Casey W.', score: 11800, game: 'All Games' },
];

const difficultyColors = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard: 'bg-red-100 text-red-700',
};

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Gamepad2 className="h-10 w-10 text-purple-500" />
          Learning Games
        </h1>
        <p className="text-muted-foreground">
          Learn financial skills while having fun! Play games to earn XP and unlock rewards.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Gamepad2 className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-700">61</p>
            <p className="text-xs text-purple-600">Games Played</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-700">15</p>
            <p className="text-xs text-yellow-600">Achievements</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Coins className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-700">2,450</p>
            <p className="text-xs text-green-600">XP from Games</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-700">#4</p>
            <p className="text-xs text-blue-600">Leaderboard Rank</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Daily Game Challenges
          </CardTitle>
          <CardDescription>Complete these for bonus XP!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dailyChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  challenge.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={challenge.completed ? 'default' : 'outline'} className={
                    challenge.completed ? 'bg-green-500' : ''
                  }>
                    {challenge.completed ? 'Completed!' : 'In Progress'}
                  </Badge>
                  <span className="text-sm font-bold text-orange-600">+{challenge.xpReward} XP</span>
                </div>
                <p className="text-sm font-medium">{challenge.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <Card
                key={game.id}
                className={`group overflow-hidden transition-all hover:shadow-xl ${
                  !game.isUnlocked ? 'opacity-75' : ''
                }`}
              >
                {/* Game Banner */}
                <div className={`h-32 bg-gradient-to-br ${game.color} p-6 flex items-center justify-center relative`}>
                  <Icon className="h-16 w-16 text-white/90" />
                  {!game.isUnlocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-sm">Unlocks at Level {game.requiredLevel}</p>
                      </div>
                    </div>
                  )}
                  {game.highScore && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/20 text-white backdrop-blur-sm">
                        <Trophy className="h-3 w-3 mr-1" />
                        {game.highScore.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">{game.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {game.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{game.category}</Badge>
                    <Badge className={difficultyColors[game.difficulty as keyof typeof difficultyColors]}>
                      {game.difficulty}
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {game.duration}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Ages {game.ageRange}</span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      +{game.xpReward} XP
                    </span>
                  </div>

                  {game.isUnlocked && game.played > 0 && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        Played {game.played}x
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {game.achievements} achievements
                      </span>
                    </div>
                  )}

                  <Button
                    className={`w-full ${
                      game.isUnlocked
                        ? `bg-gradient-to-r ${game.color} hover:opacity-90`
                        : ''
                    }`}
                    disabled={!game.isUnlocked}
                  >
                    {game.isUnlocked ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play Now
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Game Masters Leaderboard
              </CardTitle>
              <CardDescription>Top players this week</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((player) => (
              <div
                key={player.rank}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  player.isYou
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  player.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  player.rank === 2 ? 'bg-gray-100 text-gray-700' :
                  player.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {player.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {player.name}
                    {player.isYou && <Badge variant="secondary" className="ml-2 text-xs">You</Badge>}
                  </p>
                </div>
                <p className="font-bold text-indigo-600">{player.score.toLocaleString()} pts</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <Gamepad2 className="h-12 w-12 mx-auto text-purple-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">More Games Coming Soon!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We&apos;re working on new financial games including &quot;Credit Score Quest&quot;,
            &quot;Tax Time Adventure&quot;, and multiplayer challenges!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
