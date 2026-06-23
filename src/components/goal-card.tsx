'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Target, Calendar, TrendingUp, Edit, Trash2, ChevronRight,
  CheckCircle, Clock, PiggyBank, Briefcase, GraduationCap,
  Home, Car, Plane, Heart, DollarSign
} from 'lucide-react';

interface GoalCardProps {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | Date;
  status: 'in_progress' | 'completed' | 'paused';
  priority: 'high' | 'medium' | 'low';
  icon?: string;
  milestones?: Array<{ amount: number; reached: boolean }>;
  onEdit?: () => void;
  onDelete?: () => void;
  onLogProgress?: () => void;
  onViewDetails?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  piggybank: <PiggyBank className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  trending: <TrendingUp className="h-5 w-5" />,
  graduation: <GraduationCap className="h-5 w-5" />,
  home: <Home className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  plane: <Plane className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  dollar: <DollarSign className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
};

export function GoalCard({
  id,
  title,
  description,
  category,
  targetAmount,
  currentAmount,
  deadline,
  status,
  priority,
  icon = 'target',
  milestones,
  onEdit,
  onDelete,
  onLogProgress,
  onViewDetails,
}: GoalCardProps) {
  const progress = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);
  const remaining = targetAmount - currentAmount;

  const deadlineDate = new Date(deadline);
  const today = new Date();
  const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const getPriorityBadge = (p: string) => {
    const variants: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return <Badge className={variants[p] || variants.medium}>{p}</Badge>;
  };

  const getStatusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (s === 'paused') return <Clock className="h-5 w-5 text-yellow-500" />;
    return null;
  };

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${status === 'completed' ? 'border-green-200' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${status === 'completed' ? 'bg-green-100' : 'bg-gradient-to-br from-indigo-100 to-purple-100'}`}>
              {iconMap[icon] || <Target className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {getStatusIcon(status)}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="text-red-500" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">${currentAmount.toLocaleString()}</span>
            <span className="text-muted-foreground">of ${targetAmount.toLocaleString()}</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{progress}% complete</span>
            <span>${remaining.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getPriorityBadge(priority)}
            <Badge variant="outline">{category}</Badge>
          </div>
          {status !== 'completed' && (
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={daysRemaining < 30 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
              </span>
            </div>
          )}
        </div>

        {/* Milestones */}
        {milestones && milestones.length > 0 && status !== 'completed' && (
          <div className="mb-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Milestones</p>
            <div className="flex items-center gap-2">
              {milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full ${milestone.reached ? 'bg-green-500' : 'bg-gray-200'}`}
                  title={`$${milestone.amount.toLocaleString()}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        {status === 'in_progress' && onLogProgress && (
          <Button variant="outline" className="w-full" onClick={onLogProgress}>
            Log Progress
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {onViewDetails && (
          <Button variant="ghost" className="w-full mt-2" onClick={onViewDetails}>
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Compact goal card for lists and sidebars
export function GoalCardCompact({
  title,
  currentAmount,
  targetAmount,
  deadline,
  status,
  onClick,
}: {
  title: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string | Date;
  status: string;
  onClick?: () => void;
}) {
  const progress = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);
  const deadlineDate = new Date(deadline);
  const daysRemaining = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <Target className="h-5 w-5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium truncate">{title}</p>
          {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      </div>
      {status !== 'completed' && (
        <span className={`text-xs ${daysRemaining < 30 ? 'text-orange-500' : 'text-muted-foreground'}`}>
          {daysRemaining}d
        </span>
      )}
    </div>
  );
}

// Goal summary widget
interface GoalSummaryProps {
  totalGoals: number;
  completedGoals: number;
  totalSaved: number;
  totalTarget: number;
}

export function GoalSummary({ totalGoals, completedGoals, totalSaved, totalTarget }: GoalSummaryProps) {
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Goals Overview</h3>
          <Badge variant="outline">{completedGoals}/{totalGoals} complete</Badge>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Saved</span>
            <span className="font-semibold text-green-600">${totalSaved.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target</span>
            <span>${totalTarget.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create goal button
export function CreateGoalButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
    >
      <Target className="h-4 w-4 mr-2" />
      Create New Goal
    </Button>
  );
}
