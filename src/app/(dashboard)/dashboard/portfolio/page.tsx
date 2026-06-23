'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Star,
  Sparkles,
  History,
  RefreshCw,
  Info,
  Briefcase,
  Zap,
} from 'lucide-react';

// Mock stock data
const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.52, change: 2.34, changePercent: 1.33 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -1.20, changePercent: -0.84 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 4.56, changePercent: 1.22 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 3.21, changePercent: 1.83 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.34, change: -5.67, changePercent: -3.13 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 721.28, change: 15.43, changePercent: 2.19 },
];

// User's portfolio holdings
const portfolioHoldings = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 10,
    avgCost: 165.00,
    currentPrice: 178.52,
    value: 1785.20,
    gain: 135.20,
    gainPercent: 8.19,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    shares: 5,
    avgCost: 350.00,
    currentPrice: 378.91,
    value: 1894.55,
    gain: 144.55,
    gainPercent: 8.26,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    shares: 8,
    avgCost: 135.00,
    currentPrice: 141.80,
    value: 1134.40,
    gain: 54.40,
    gainPercent: 5.04,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    shares: 3,
    avgCost: 500.00,
    currentPrice: 721.28,
    value: 2163.84,
    gain: 663.84,
    gainPercent: 44.26,
  },
];

// Transaction history
const transactions = [
  { id: 't1', type: 'buy', symbol: 'NVDA', shares: 3, price: 500.00, date: '2024-02-10', total: 1500.00 },
  { id: 't2', type: 'buy', symbol: 'AAPL', shares: 5, price: 170.00, date: '2024-02-08', total: 850.00 },
  { id: 't3', type: 'sell', symbol: 'TSLA', shares: 2, price: 190.00, date: '2024-02-05', total: 380.00 },
  { id: 't4', type: 'buy', symbol: 'MSFT', shares: 5, price: 350.00, date: '2024-01-28', total: 1750.00 },
  { id: 't5', type: 'buy', symbol: 'GOOGL', shares: 8, price: 135.00, date: '2024-01-20', total: 1080.00 },
  { id: 't6', type: 'buy', symbol: 'AAPL', shares: 5, price: 160.00, date: '2024-01-15', total: 800.00 },
];

// Watchlist
const watchlist = [
  { symbol: 'META', name: 'Meta Platforms', price: 485.12, change: 8.34, changePercent: 1.75 },
  { symbol: 'DIS', name: 'Walt Disney Co.', price: 110.45, change: -2.15, changePercent: -1.91 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 478.23, change: 5.67, changePercent: 1.20 },
];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('holdings');
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate portfolio totals
  const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = portfolioHoldings.reduce((sum, h) => sum + h.avgCost * h.shares, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = (totalGain / totalCost) * 100;
  const cashBalance = 2500.00;
  const totalPortfolioValue = totalValue + cashBalance;

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-indigo-500" />
            Practice Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Learn investing with virtual money - no risk involved!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                <Plus className="h-4 w-4 mr-1" />
                Trade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Place a Trade</DialogTitle>
                <DialogDescription>
                  Practice buying and selling stocks with virtual money
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button
                    variant={tradeType === 'buy' ? 'default' : 'outline'}
                    className={tradeType === 'buy' ? 'bg-green-500 hover:bg-green-600' : ''}
                    onClick={() => setTradeType('buy')}
                  >
                    Buy
                  </Button>
                  <Button
                    variant={tradeType === 'sell' ? 'default' : 'outline'}
                    className={tradeType === 'sell' ? 'bg-red-500 hover:bg-red-600' : ''}
                    onClick={() => setTradeType('sell')}
                  >
                    Sell
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Stock Symbol</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularStocks.map((stock) => (
                        <SelectItem key={stock.symbol} value={stock.symbol}>
                          {stock.symbol} - {stock.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Shares</Label>
                  <Input type="number" placeholder="0" min="1" />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Estimated Cost</span>
                    <span className="font-bold">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Available Cash</span>
                    <span className="text-green-600">${cashBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTradeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className={tradeType === 'buy' ? 'bg-green-500' : 'bg-red-500'}>
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} Shares
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <p className="text-white/80 text-sm mb-1">Total Portfolio Value</p>
            <p className="text-4xl font-bold mb-4">${totalPortfolioValue.toLocaleString()}</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-white/60 text-xs">Investments</p>
                <p className="font-semibold">${totalValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Cash</p>
                <p className="font-semibold">${cashBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalGain >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              {totalGain >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm text-muted-foreground">Total Gain/Loss</span>
            </div>
            <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString()}
            </p>
            <p className={`text-sm ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-5 w-5 text-indigo-500" />
              <span className="text-sm text-muted-foreground">Holdings</span>
            </div>
            <p className="text-2xl font-bold">{portfolioHoldings.length}</p>
            <p className="text-sm text-muted-foreground">Different stocks</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Banner */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <Sparkles className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800">Practice Makes Perfect!</h3>
            <p className="text-sm text-yellow-700">
              This is a simulated portfolio using virtual money. Make trades, learn from mistakes,
              and build your investing skills risk-free!
            </p>
          </div>
          <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
            <Zap className="h-4 w-4 mr-1" />
            Learn More
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>Stocks you currently own in your practice portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stock</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Shares</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Cost</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Current</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Value</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gain/Loss</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioHoldings.map((holding) => (
                      <tr key={holding.symbol} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold">{holding.symbol}</p>
                            <p className="text-sm text-muted-foreground">{holding.name}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">{holding.shares}</td>
                        <td className="text-right py-3 px-4">${holding.avgCost.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">${holding.currentPrice.toFixed(2)}</td>
                        <td className="text-right py-3 px-4 font-medium">${holding.value.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">
                          <div className={holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                            <div className="flex items-center justify-end gap-1">
                              {holding.gain >= 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              ${Math.abs(holding.gain).toFixed(2)}
                            </div>
                            <p className="text-xs">
                              {holding.gain >= 0 ? '+' : ''}{holding.gainPercent.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <Button variant="outline" size="sm">Trade</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Watchlist</CardTitle>
                  <CardDescription>Stocks you&apos;re keeping an eye on</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stock
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {watchlist.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <div>
                        <p className="font-semibold">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${stock.price.toFixed(2)}</p>
                      <p className={`text-sm flex items-center justify-end gap-1 ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                    <Button size="sm">Buy</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Your recent trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'buy' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.shares} {tx.symbol}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @ ${tx.price.toFixed(2)} per share
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        tx.type === 'buy' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {tx.type === 'buy' ? '-' : '+'}${tx.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Market Overview</CardTitle>
                  <CardDescription>Popular stocks and market movers</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stocks..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularStocks.map((stock) => (
                  <Card key={stock.symbol} className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">{stock.symbol}</p>
                          <p className="text-sm text-muted-foreground">{stock.name}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold">${stock.price.toFixed(2)}</p>
                        <div className={`flex items-center gap-1 ${
                          stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.change >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <Button className="w-full mt-4" size="sm">
                        Trade
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
