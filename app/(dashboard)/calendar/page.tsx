"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, RefreshCw, Receipt, CreditCard, PiggyBank } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { getTransactionsByDateRange } from "@/lib/api/transactions";

interface Transaction {
  id: string;
  type: "income" | "expense" | "bills" | "debt_payment" | "savings";
  category: string;
  amount: number;
  description: string;
  date: Date;
  is_recurring: boolean;
  recurring_frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  recurring_end_date: Date | null;
}

export default function CalendarPage() {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, currentDate]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      const data = await getTransactionsByDateRange(user!.id, start, end);
      setTransactions(data.map(t => ({
        ...t,
        date: new Date(t.date),
        recurring_end_date: t.recurring_end_date ? new Date(t.recurring_end_date) : null,
      })));
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Pad the start with empty days
  const startDay = startOfMonth(currentDate).getDay();
  const paddingDays = Array(startDay).fill(null);

  const getTransactionsForDate = (date: Date) => {
    return transactions.filter(t => isSameDay(t.date, date));
  };

  const getTypeColor = (type: string, isRecurring: boolean) => {
    if (isRecurring) {
      return "bg-purple-500"; // All recurring transactions are purple
    }
    switch (type) {
      case "income": return "bg-green-500";
      case "expense": return "bg-red-500";
      case "bills": return "bg-orange-500";
      case "debt_payment": return "bg-purple-500";
      case "savings": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income": return TrendingUp;
      case "expense": return TrendingDown;
      case "bills": return Receipt;
      case "debt_payment": return CreditCard;
      case "savings": return PiggyBank;
      default: return TrendingDown;
    }
  };

  const getTypeBgColor = (type: string, isRecurring: boolean) => {
    if (isRecurring) {
      return "bg-purple-500/20";
    }
    switch (type) {
      case "income": return "bg-green-500/20";
      case "expense": return "bg-red-500/20";
      case "bills": return "bg-orange-500/20";
      case "debt_payment": return "bg-purple-500/20";
      case "savings": return "bg-blue-500/20";
      default: return "bg-gray-500/20";
    }
  };

  const getTypeTextColor = (type: string, isRecurring: boolean) => {
    if (isRecurring) {
      return "text-purple-400";
    }
    switch (type) {
      case "income": return "text-green-400";
      case "expense": return "text-red-400";
      case "bills": return "text-orange-400";
      case "debt_payment": return "text-purple-400";
      case "savings": return "text-blue-400";
      default: return "text-gray-400";
    }
  };

  const selectedDateTransactions = selectedDate ? getTransactionsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Calendar
          </h1>
          <p className="text-gray-400 mt-2">View your transactions by date</p>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-gray-300 text-sm">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-gray-300 text-sm">Expense</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-gray-300 text-sm">Bills</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded" />
            <span className="text-gray-300 text-sm">Debt Payment / Recurring</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-gray-300 text-sm">Savings</span>
          </div>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </button>
          <h2 className="text-2xl font-bold text-white">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="aspect-square" />
          ))}
          {daysInMonth.map((day) => {
            const dayTransactions = getTransactionsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square p-2 rounded-lg border transition-all
                  ${isSelected
                    ? "bg-yellow-500/20 border-yellow-500"
                    : isCurrentDay
                    ? "bg-blue-500/20 border-blue-500"
                    : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  }
                `}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`text-sm font-medium mb-1 ${
                      isSelected || isCurrentDay ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex-1 flex flex-wrap gap-1 content-start">
                    {dayTransactions.slice(0, 3).map((transaction, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${getTypeColor(transaction.type, transaction.is_recurring)}`}
                      />
                    ))}
                    {dayTransactions.length > 3 && (
                      <span className="text-[10px] text-gray-400">
                        +{dayTransactions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Date Transactions */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Transactions for {format(selectedDate, "MMMM dd, yyyy")}
          </h3>
          {selectedDateTransactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No transactions on this date</p>
          ) : (
            <div className="space-y-3">
              {selectedDateTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTypeBgColor(transaction.type, transaction.is_recurring)}`}>
                      {(() => {
                        const Icon = getTypeIcon(transaction.type);
                        return <Icon className={`w-5 h-5 ${getTypeTextColor(transaction.type, transaction.is_recurring)}`} />;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{transaction.category}</p>
                        {transaction.is_recurring && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                            <RefreshCw className="w-3 h-3" />
                            {transaction.recurring_frequency}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{transaction.description}</p>
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${getTypeTextColor(transaction.type, transaction.is_recurring)}`}>
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
