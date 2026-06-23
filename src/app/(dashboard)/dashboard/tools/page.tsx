'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Calculator,
  PiggyBank,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Target,
  CreditCard,
  Home,
  Car,
  GraduationCap,
  ArrowRight,
  Info,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

// Compound Interest Calculator
function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);
  const [monthlyContribution, setMonthlyContribution] = useState(100);

  const calculateCompoundInterest = () => {
    const r = rate / 100;
    const n = 12; // Compounding monthly
    const t = years;
    const P = principal;
    const PMT = monthlyContribution;

    // Future value of initial principal
    const fvPrincipal = P * Math.pow(1 + r / n, n * t);

    // Future value of monthly contributions
    const fvContributions = PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));

    const totalValue = fvPrincipal + fvContributions;
    const totalContributions = P + PMT * 12 * t;
    const totalInterest = totalValue - totalContributions;

    return {
      totalValue: Math.round(totalValue),
      totalContributions: Math.round(totalContributions),
      totalInterest: Math.round(totalInterest),
    };
  };

  const result = calculateCompoundInterest();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Starting Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monthly Contribution</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Annual Interest Rate</Label>
              <span className="text-sm text-muted-foreground">{rate}%</span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={(value) => setRate(value[0])}
              min={1}
              max={15}
              step={0.5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Time Period</Label>
              <span className="text-sm text-muted-foreground">{years} years</span>
            </div>
            <Slider
              value={[years]}
              onValueChange={(value) => setYears(value[0])}
              min={1}
              max={40}
              step={1}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-green-600 mb-2">Future Value</p>
              <p className="text-4xl font-bold text-green-700">
                ${result.totalValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Contributions</p>
                <p className="text-xl font-bold text-blue-600">
                  ${result.totalContributions.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Interest Earned</p>
                <p className="text-xl font-bold text-purple-600">
                  ${result.totalInterest.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-700">The Power of Compound Interest</p>
                <p className="text-xs text-indigo-600 mt-1">
                  Your money grew {((result.totalValue / result.totalContributions - 1) * 100).toFixed(0)}%
                  through compound interest alone!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Budget Calculator
function BudgetCalculator() {
  const [income, setIncome] = useState(3000);
  const [budgetMethod, setBudgetMethod] = useState('50-30-20');

  const calculateBudget = () => {
    switch (budgetMethod) {
      case '50-30-20':
        return {
          needs: income * 0.5,
          wants: income * 0.3,
          savings: income * 0.2,
        };
      case '70-20-10':
        return {
          needs: income * 0.7,
          wants: income * 0.2,
          savings: income * 0.1,
        };
      case '60-20-20':
        return {
          needs: income * 0.6,
          wants: income * 0.2,
          savings: income * 0.2,
        };
      default:
        return { needs: 0, wants: 0, savings: 0 };
    }
  };

  const budget = calculateBudget();

  const budgetCategories = [
    { name: 'Needs', amount: budget.needs, color: 'bg-blue-500', description: 'Housing, food, utilities, insurance' },
    { name: 'Wants', amount: budget.wants, color: 'bg-purple-500', description: 'Entertainment, dining out, hobbies' },
    { name: 'Savings', amount: budget.savings, color: 'bg-green-500', description: 'Emergency fund, investments, goals' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Monthly Income (After Tax)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Budget Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {['50-30-20', '70-20-10', '60-20-20'].map((method) => (
                <Button
                  key={method}
                  variant={budgetMethod === method ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBudgetMethod(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">About {budgetMethod} Rule</p>
            <p className="text-xs text-muted-foreground">
              {budgetMethod === '50-30-20'
                ? '50% for needs, 30% for wants, 20% for savings. Great for balanced lifestyle.'
                : budgetMethod === '70-20-10'
                ? '70% for living expenses, 20% for savings, 10% for debt or fun. Good for beginners.'
                : '60% for needs, 20% for wants, 20% for savings. Good for high-cost areas.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {budgetCategories.map((cat) => (
            <Card key={cat.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-xl font-bold">${cat.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${cat.color} rounded-full`}
                    style={{ width: `${(cat.amount / income) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Savings Goal Calculator
function SavingsGoalCalculator() {
  const [goalAmount, setGoalAmount] = useState(5000);
  const [currentSavings, setCurrentSavings] = useState(500);
  const [monthlyContribution, setMonthlyContribution] = useState(200);
  const [interestRate, setInterestRate] = useState(4);

  const calculateTimeToGoal = () => {
    const P = currentSavings;
    const G = goalAmount;
    const PMT = monthlyContribution;
    const r = interestRate / 100 / 12;

    if (PMT === 0) {
      if (r === 0) return Infinity;
      return Math.log(G / P) / Math.log(1 + r);
    }

    if (r === 0) {
      return (G - P) / PMT;
    }

    // Using the formula for time to reach goal with compound interest and regular contributions
    const months = Math.log((G * r + PMT) / (P * r + PMT)) / Math.log(1 + r);
    return months;
  };

  const monthsToGoal = calculateTimeToGoal();
  const years = Math.floor(monthsToGoal / 12);
  const months = Math.round(monthsToGoal % 12);
  const progressPercent = Math.min((currentSavings / goalAmount) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Goal Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Current Savings</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monthly Contribution</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Savings Interest Rate</Label>
              <span className="text-sm text-muted-foreground">{interestRate}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={(value) => setInterestRate(value[0])}
              min={0}
              max={10}
              step={0.5}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-indigo-600 mb-2">Time to Reach Goal</p>
              {isFinite(monthsToGoal) ? (
                <p className="text-3xl font-bold text-indigo-700">
                  {years > 0 ? `${years} year${years > 1 ? 's' : ''} ` : ''}
                  {months} month{months !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-xl font-bold text-red-600">
                  Cannot reach goal with current settings
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${currentSavings.toLocaleString()} saved</span>
              <span>${goalAmount.toLocaleString()} goal</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Quick Adjustments</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>To reach your goal in 6 months: Save ${Math.round((goalAmount - currentSavings) / 6)}/month</p>
                <p>To reach your goal in 1 year: Save ${Math.round((goalAmount - currentSavings) / 12)}/month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Loan Payment Calculator
function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState(25000);
  const [interestRate, setInterestRate] = useState(6);
  const [loanTerm, setLoanTerm] = useState(60);
  const [loanType, setLoanType] = useState<'car' | 'student' | 'personal'>('car');

  const calculateLoan = () => {
    const P = loanAmount;
    const r = interestRate / 100 / 12;
    const n = loanTerm;

    if (r === 0) {
      return {
        monthlyPayment: P / n,
        totalPayment: P,
        totalInterest: 0,
      };
    }

    const monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - P;

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
    };
  };

  const loan = calculateLoan();

  const loanIcons = {
    car: Car,
    student: GraduationCap,
    personal: CreditCard,
  };

  const LoanIcon = loanIcons[loanType];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Loan Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['car', 'student', 'personal'] as const).map((type) => {
                const Icon = loanIcons[type];
                return (
                  <Button
                    key={type}
                    variant={loanType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoanType(type)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Loan Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Interest Rate (APR)</Label>
              <span className="text-sm text-muted-foreground">{interestRate}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={(value) => setInterestRate(value[0])}
              min={1}
              max={25}
              step={0.25}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Loan Term</Label>
              <span className="text-sm text-muted-foreground">{loanTerm} months ({(loanTerm / 12).toFixed(1)} years)</span>
            </div>
            <Slider
              value={[loanTerm]}
              onValueChange={(value) => setLoanTerm(value[0])}
              min={12}
              max={120}
              step={6}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <LoanIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-blue-600 mb-2">Monthly Payment</p>
              <p className="text-4xl font-bold text-blue-700">
                ${loan.monthlyPayment.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Payment</p>
                <p className="text-xl font-bold">${loan.totalPayment.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                <p className="text-xl font-bold text-red-600">${loan.totalInterest.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-700">Interest adds up!</p>
                <p className="text-xs text-yellow-600 mt-1">
                  You&apos;ll pay {((loan.totalInterest / loanAmount) * 100).toFixed(0)}% extra
                  in interest over the life of the loan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const tools = [
  {
    id: 'compound',
    name: 'Compound Interest',
    description: 'See how your money can grow over time',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    component: CompoundInterestCalculator,
  },
  {
    id: 'budget',
    name: 'Budget Planner',
    description: 'Plan your monthly budget allocation',
    icon: PiggyBank,
    color: 'from-blue-500 to-indigo-500',
    component: BudgetCalculator,
  },
  {
    id: 'savings',
    name: 'Savings Goal',
    description: 'Calculate how long to reach your goal',
    icon: Target,
    color: 'from-purple-500 to-pink-500',
    component: SavingsGoalCalculator,
  },
  {
    id: 'loan',
    name: 'Loan Calculator',
    description: 'Understand your loan payments',
    icon: CreditCard,
    color: 'from-orange-500 to-red-500',
    component: LoanCalculator,
  },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState('compound');

  const selectedTool = tools.find(t => t.id === activeTool);
  const ToolComponent = selectedTool?.component;

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Calculator className="h-10 w-10 text-blue-500" />
          Financial Tools
        </h1>
        <p className="text-muted-foreground">
          Interactive calculators to help you make smart financial decisions
        </p>
      </div>

      {/* Tool Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                activeTool === tool.id ? 'ring-2 ring-indigo-500' : ''
              }`}
              onClick={() => setActiveTool(tool.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{tool.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Tool */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedTool && (
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedTool.color} flex items-center justify-center`}>
                  <selectedTool.icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <CardTitle>{selectedTool?.name} Calculator</CardTitle>
                <CardDescription>{selectedTool?.description}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ToolComponent && <ToolComponent />}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Sparkles className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Pro Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>The earlier you start saving, the more compound interest works for you</li>
                <li>Try to keep your needs under 50% of your income</li>
                <li>Even small monthly contributions add up significantly over time</li>
                <li>Always compare loan terms before borrowing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
