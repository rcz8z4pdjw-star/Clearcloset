'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, Search, Plus, TrendingUp, TrendingDown, Filter,
  Download, Calendar, ShoppingCart, Home, Car, Utensils,
  Smartphone, Heart, Plane, Gift, Briefcase, ChevronLeft, ChevronRight
} from 'lucide-react';

const transactions = [
  { id: '1', description: 'Grocery Store', category: 'Food', amount: -85.42, date: '2024-02-15', type: 'expense' },
  { id: '2', description: 'Salary Deposit', category: 'Income', amount: 3500.00, date: '2024-02-15', type: 'income' },
  { id: '3', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, date: '2024-02-14', type: 'expense' },
  { id: '4', description: 'Gas Station', category: 'Transportation', amount: -45.00, date: '2024-02-14', type: 'expense' },
  { id: '5', description: 'Restaurant Dinner', category: 'Food', amount: -62.50, date: '2024-02-13', type: 'expense' },
  { id: '6', description: 'Freelance Payment', category: 'Income', amount: 500.00, date: '2024-02-12', type: 'income' },
  { id: '7', description: 'Electric Bill', category: 'Utilities', amount: -120.00, date: '2024-02-10', type: 'expense' },
  { id: '8', description: 'Amazon Purchase', category: 'Shopping', amount: -89.99, date: '2024-02-09', type: 'expense' },
  { id: '9', description: 'Gym Membership', category: 'Health', amount: -50.00, date: '2024-02-08', type: 'expense' },
  { id: '10', description: 'Savings Transfer', category: 'Savings', amount: -500.00, date: '2024-02-08', type: 'transfer' },
  { id: '11', description: 'Coffee Shop', category: 'Food', amount: -5.75, date: '2024-02-07', type: 'expense' },
  { id: '12', description: 'Interest Payment', category: 'Income', amount: 12.50, date: '2024-02-05', type: 'income' },
];

const categories = ['All', 'Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Income'];

const categoryIcons: Record<string, React.ReactNode> = {
  Food: <Utensils className="h-4 w-4" />,
  Transportation: <Car className="h-4 w-4" />,
  Entertainment: <Smartphone className="h-4 w-4" />,
  Shopping: <ShoppingCart className="h-4 w-4" />,
  Utilities: <Home className="h-4 w-4" />,
  Health: <Heart className="h-4 w-4" />,
  Income: <Briefcase className="h-4 w-4" />,
  Travel: <Plane className="h-4 w-4" />,
  Gifts: <Gift className="h-4 w-4" />,
  Savings: <TrendingUp className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-700',
  Transportation: 'bg-blue-100 text-blue-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Shopping: 'bg-pink-100 text-pink-700',
  Utilities: 'bg-gray-100 text-gray-700',
  Health: 'bg-red-100 text-red-700',
  Income: 'bg-green-100 text-green-700',
  Travel: 'bg-cyan-100 text-cyan-700',
  Gifts: 'bg-yellow-100 text-yellow-700',
  Savings: 'bg-emerald-100 text-emerald-700',
};

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'income' && tx.type === 'income') ||
      (activeTab === 'expenses' && tx.type === 'expense');
    return matchesSearch && matchesCategory && matchesTab;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
  const netBalance = totalIncome - totalExpenses;

  // Group transactions by date
  const groupedTransactions: Record<string, typeof transactions> = {};
  paginatedTransactions.forEach((tx) => {
    const dateKey = tx.date;
    if (!groupedTransactions[dateKey]) {
      groupedTransactions[dateKey] = [];
    }
    groupedTransactions[dateKey].push(tx);
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Track and manage your financial transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(netBalance).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {Object.entries(groupedTransactions).map(([date, txs]) => (
                <div key={date}>
                  <div className="px-6 py-3 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {txs.length} transaction{txs.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {txs.map((tx) => (
                      <div key={tx.id} className="px-6 py-4 flex items-center hover:bg-gray-50">
                        <div className={`p-2 rounded-lg mr-4 ${categoryColors[tx.category] || 'bg-gray-100'}`}>
                          {categoryIcons[tx.category] || <DollarSign className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">{tx.category}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">{tx.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredTransactions.length === 0 && (
        <Card className="p-12 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </Card>
      )}
    </div>
  );
}
