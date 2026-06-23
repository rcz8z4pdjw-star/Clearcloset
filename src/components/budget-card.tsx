'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Edit, Plus, ChevronRight, PieChart
} from 'lucide-react';

interface BudgetCategoryCardProps {
  name: string;
  icon?: React.ReactNode;
  color?: string;
  budgeted: number;
  spent: number;
  transactionCount?: number;
  onEdit?: () => void;
  onViewDetails?: () => void;
}

export function BudgetCategoryCard({
  name,
  icon,
  color = 'bg-gray-500',
  budgeted,
  spent,
  transactionCount = 0,
  onEdit,
  onViewDetails,
}: BudgetCategoryCardProps) {
  const remaining = budgeted - spent;
  const percentage = budgeted > 0 ? Math.min(Math.round((spent / budgeted) * 100), 100) : 0;
  const isOverBudget = spent > budgeted;

  return (
    <Card className={isOverBudget ? 'border-red-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color} text-white`}>
              {icon || <DollarSign className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-xs text-muted-foreground">{transactionCount} transactions</p>
            </div>
          </div>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Spent</span>
            <span className="font-medium">${spent.toLocaleString()}</span>
          </div>
          <Progress
            value={percentage}
            className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget</span>
            <span>${budgeted.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-sm text-muted-foreground">
            {isOverBudget ? 'Over by' : 'Remaining'}
          </span>
          <Badge className={remaining >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            ${Math.abs(remaining).toLocaleString()}
          </Badge>
        </div>

        {onViewDetails && (
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={onViewDetails}>
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Summary card for budget overview
interface BudgetSummaryCardProps {
  totalBudgeted: number;
  totalSpent: number;
  income?: number;
  savingsTarget?: number;
}

export function BudgetSummaryCard({
  totalBudgeted,
  totalSpent,
  income,
  savingsTarget,
}: BudgetSummaryCardProps) {
  const remaining = totalBudgeted - totalSpent;
  const percentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const savingsRate = income ? Math.round(((income - totalSpent) / income) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold">${totalBudgeted.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Budget Used</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${remaining >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {remaining >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{remaining >= 0 ? 'Remaining' : 'Over'}</p>
              <p className="font-semibold">${Math.abs(remaining).toLocaleString()}</p>
            </div>
          </div>
          {income && (
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className="font-semibold">{savingsRate}%</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Alert card for budget warnings
interface BudgetAlertProps {
  overBudgetCategories: Array<{ name: string; overBy: number }>;
}

export function BudgetAlertCard({ overBudgetCategories }: BudgetAlertProps) {
  if (overBudgetCategories.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="font-medium text-red-700">
              {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category is' : 'categories are'} over budget
            </p>
            <ul className="mt-2 space-y-1">
              {overBudgetCategories.map((cat) => (
                <li key={cat.name} className="text-sm text-red-600">
                  {cat.name}: ${cat.overBy.toLocaleString()} over
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mini budget progress for dashboard widgets
interface MiniBudgetProgressProps {
  categories: Array<{
    name: string;
    spent: number;
    budgeted: number;
    color: string;
  }>;
  maxCategories?: number;
}

export function MiniBudgetProgress({ categories, maxCategories = 5 }: MiniBudgetProgressProps) {
  const displayCategories = categories.slice(0, maxCategories);

  return (
    <div className="space-y-3">
      {displayCategories.map((cat) => {
        const percentage = cat.budgeted > 0 ? Math.min((cat.spent / cat.budgeted) * 100, 100) : 0;
        const isOver = cat.spent > cat.budgeted;

        return (
          <div key={cat.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{cat.name}</span>
              <span className={isOver ? 'text-red-600' : 'text-muted-foreground'}>
                ${cat.spent} / ${cat.budgeted}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : cat.color}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Quick add transaction button
export function QuickAddTransaction({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Transaction
    </Button>
  );
}
