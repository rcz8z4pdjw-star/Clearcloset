'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, Plus, TrendingUp, TrendingDown, PieChart,
  ShoppingCart, Home, Car, Utensils, Gamepad2, Heart,
  Smartphone, BookOpen, Plane, Gift, Edit, AlertCircle
} from 'lucide-react';

const budgetCategories = [
  {
    id: '1',
    name: 'Housing',
    icon: 'home',
    budgeted: 1200,
    spent: 1200,
    color: 'bg-blue-500',
    transactions: 2,
  },
  {
    id: '2',
    name: 'Food & Dining',
    icon: 'food',
    budgeted: 400,
    spent: 325,
    color: 'bg-orange-500',
    transactions: 18,
  },
  {
    id: '3',
    name: 'Transportation',
    icon: 'car',
    budgeted: 300,
    spent: 275,
    color: 'bg-green-500',
    transactions: 8,
  },
  {
    id: '4',
    name: 'Entertainment',
    icon: 'entertainment',
    budgeted: 150,
    spent: 180,
    color: 'bg-purple-500',
    transactions: 12,
    overBudget: true,
  },
  {
    id: '5',
    name: 'Shopping',
    icon: 'shopping',
    budgeted: 200,
    spent: 145,
    color: 'bg-pink-500',
    transactions: 6,
  },
  {
    id: '6',
    name: 'Health & Wellness',
    icon: 'health',
    budgeted: 100,
    spent: 50,
    color: 'bg-red-500',
    transactions: 2,
  },
  {
    id: '7',
    name: 'Subscriptions',
    icon: 'phone',
    budgeted: 80,
    spent: 78,
    color: 'bg-cyan-500',
    transactions: 5,
  },
  {
    id: '8',
    name: 'Education',
    icon: 'education',
    budgeted: 100,
    spent: 0,
    color: 'bg-indigo-500',
    transactions: 0,
  },
  {
    id: '9',
    name: 'Savings',
    icon: 'savings',
    budgeted: 500,
    spent: 500,
    color: 'bg-emerald-500',
    transactions: 1,
    isSavings: true,
  },
];

const recentTransactions = [
  { id: '1', description: 'Grocery Store', category: 'Food & Dining', amount: -85.42, date: '2024-02-15' },
  { id: '2', description: 'Netflix', category: 'Subscriptions', amount: -15.99, date: '2024-02-15' },
  { id: '3', description: 'Gas Station', category: 'Transportation', amount: -45.00, date: '2024-02-14' },
  { id: '4', description: 'Restaurant', category: 'Food & Dining', amount: -32.50, date: '2024-02-14' },
  { id: '5', description: 'Movie Tickets', category: 'Entertainment', amount: -28.00, date: '2024-02-13' },
];

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  food: <Utensils className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  entertainment: <Gamepad2 className="h-4 w-4" />,
  shopping: <ShoppingCart className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  phone: <Smartphone className="h-4 w-4" />,
  education: <BookOpen className="h-4 w-4" />,
  savings: <TrendingUp className="h-4 w-4" />,
  travel: <Plane className="h-4 w-4" />,
  gifts: <Gift className="h-4 w-4" />,
};

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('February 2024');

  const totalBudgeted = budgetCategories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const spentPercentage = Math.round((totalSpent / totalBudgeted) * 100);

  const overBudgetCategories = budgetCategories.filter(c => c.spent > c.budgeted);
  const underBudgetCategories = budgetCategories.filter(c => c.spent < c.budgeted * 0.5);

  const getSpentPercentage = (spent: number, budgeted: number) => {
    return Math.min(Math.round((spent / budgeted) * 100), 100);
  };

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Budget</h1>
          <p className="text-muted-foreground">Track your spending and stay on target</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option>February 2024</option>
            <option>January 2024</option>
            <option>December 2023</option>
          </select>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">${totalBudgeted.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(totalRemaining).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-2xl font-bold">{spentPercentage}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <Progress value={spentPercentage} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overBudgetCategories.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700">
                  {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category is' : 'categories are'} over budget
                </p>
                <p className="text-sm text-red-600">
                  {overBudgetCategories.map(c => c.name).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetCategories.slice(0, 6).map((category) => {
                    const percentage = getSpentPercentage(category.spent, category.budgeted);
                    return (
                      <div key={category.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${category.color} text-white`}>
                              {iconMap[category.icon]}
                            </div>
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm">
                            ${category.spent} / ${category.budgeted}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={percentage} className="h-2" />
                          {category.overBudget && (
                            <div className="absolute -right-1 -top-1">
                              <span className="text-red-500 text-xs">!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgetCategories.map((category) => {
              const percentage = getSpentPercentage(category.spent, category.budgeted);
              const remaining = category.budgeted - category.spent;

              return (
                <Card key={category.id} className={category.overBudget ? 'border-red-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.color} text-white`}>
                          {iconMap[category.icon]}
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">{category.transactions} transactions</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spent</span>
                        <span className="font-medium">${category.spent}</span>
                      </div>
                      <Progress
                        value={percentage}
                        className={`h-2 ${category.overBudget ? '[&>div]:bg-red-500' : ''}`}
                      />
                      <div className="flex justify-between text-sm">
                        <span>Budget</span>
                        <span>${category.budgeted}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {remaining >= 0 ? 'Remaining' : 'Over by'}
                        </span>
                        <Badge className={remaining >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          ${Math.abs(remaining)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{tx.category} • {tx.date}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
