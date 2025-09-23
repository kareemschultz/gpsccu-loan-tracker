import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

// Enhanced components
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const Alert = ({ children, type = 'info' }) => {
  const typeClasses = {
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${typeClasses[type]}`}>
      {children}
    </div>
  );
};

const ProgressBar = ({ value, className = '', children }) => (
  <div className={`relative bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-full transition-all duration-1000 ease-out"
      style={{ width: `${Math.max(1, value)}%` }}
    />
    {children && (
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-lg">
        {children}
      </div>
    )}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    secondary: 'bg-gray-500 text-white',
    purple: 'bg-purple-500 text-white'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Payment countdown component
const PaymentCountdown = ({ nextPaymentDate, targetAmount, currentSavings }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(nextPaymentDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft('Payment Due!');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextPaymentDate]);

  const savingsProgress = (currentSavings / targetAmount) * 100;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-bold mb-4">Next Extra Payment</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft}</div>
          <div className="text-sm opacity-90">Until Next Payment</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">${Math.round(currentSavings).toLocaleString()}</div>
          <div className="text-sm opacity-90">Saved / ${targetAmount.toLocaleString()} Target</div>
        </div>
      </div>
      <div className="mt-4">
        <ProgressBar value={savingsProgress} className="h-3">
          {Math.round(savingsProgress)}%
        </ProgressBar>
      </div>
    </div>
  );
};

// Custom hooks
const useLoanCalculations = () => {
  const calculateLoan = (principal, monthlyPayment, monthlyRate, extraPayment, extraFrequency = 3) => {
    let balance = principal;
    let month = 1;
    let totalInterest = 0;
    let schedule = [];

    while (balance > 0 && month <= 600) {
      const interestPayment = balance * monthlyRate;
      const regularPrincipal = Math.min(monthlyPayment - interestPayment, balance);
      
      let extraPrincipal = 0;
      if (month >= 3 && month % extraFrequency === 0 && extraPayment > 0 && balance - regularPrincipal > 0) {
        extraPrincipal = Math.min(extraPayment, balance - regularPrincipal);
      }
      
      const totalPrincipal = regularPrincipal + extraPrincipal;
      balance -= totalPrincipal;
      totalInterest += interestPayment;
      
      schedule.push({
        month,
        payment: monthlyPayment + extraPrincipal,
        interest: interestPayment,
        principal: totalPrincipal,
        balance: Math.max(0, balance)
      });
      
      if (balance <= 0) break;
      month++;
    }
    
    return { months: month, totalInterest, schedule, totalPaid: principal + totalInterest };
  };

  const calculateDetailedLoan = (principal, monthlyPayment, monthlyRate, extraPayment, oneTimePayment, extraStartMonth, extraFrequency = 3) => {
    let balance = principal;
    let month = 1;
    let totalInterest = 0;
    let schedule = [];
    let oneTimeUsed = false;

    while (balance > 0 && month <= 600) {
      const interestPayment = balance * monthlyRate;
      const regularPrincipal = Math.min(monthlyPayment - interestPayment, balance);
      
      let extraPrincipal = 0;
      
      if (month === extraStartMonth && oneTimePayment > 0 && !oneTimeUsed) {
        extraPrincipal += Math.min(oneTimePayment, balance - regularPrincipal);
        oneTimeUsed = true;
      }
      
      if (month >= extraStartMonth && month % extraFrequency === 0 && extraPayment > 0) {
        const remaining = balance - regularPrincipal - extraPrincipal;
        if (remaining > 0) {
          extraPrincipal += Math.min(extraPayment, remaining);
        }
      }
      
      const totalPrincipal = regularPrincipal + extraPrincipal;
      balance -= totalPrincipal;
      totalInterest += interestPayment;
      
      schedule.push({
        month,
        payment: monthlyPayment + extraPrincipal,
        interest: interestPayment,
        principal: totalPrincipal,
        balance: Math.max(0, balance)
      });
      
      if (balance <= 0) break;
      month++;
    }

    return { months: month, totalInterest, schedule, totalPaid: principal + totalInterest };
  };

  return { calculateLoan, calculateDetailedLoan };
};

const useFormatters = (timeFormat) => {
  const formatCurrency = (amount) => {
    return `$${Math.round(amount).toLocaleString()} GYD`;
  };

  const formatLargeNumber = (num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${Math.round(num).toLocaleString()}`;
  };

  const formatTime = (months) => {
    if (timeFormat === 'years') {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (years === 0) return `${months}mo`;
      if (remainingMonths === 0) return `${years}y`;
      return `${years}y ${remainingMonths}mo`;
    }
    return `${months} months`;
  };

  const formatTimeShort = (months) => {
    if (timeFormat === 'years') {
      return `${(months / 12).toFixed(1)}y`;
    }
    return `${months}mo`;
  };

  return { formatCurrency, formatLargeNumber, formatTime, formatTimeShort };
};

// Enhanced header component
const LoanHeader = ({ darkMode, setDarkMode, timeFormat, setTimeFormat, originalAmount, formatLargeNumber }) => (
  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
    <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
    <div className="relative z-10 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 tracking-tight">
            GPSCCU Loan Tracker Pro
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-3 sm:mb-4 text-blue-100">
            Advanced Financial Planning & Analytics
          </p>
          <div className="inline-flex items-center space-x-2 sm:space-x-4 bg-white/20 rounded-full px-4 sm:px-6 py-2 sm:py-3 backdrop-blur-sm">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {formatLargeNumber(originalAmount)}
            </span>
            <span className="text-xs sm:text-sm text-blue-200">Original Loan</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setTimeFormat(timeFormat === 'months' ? 'years' : 'months')}
            className="rounded-full px-4 sm:px-6 py-2 bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 text-sm"
          >
            {timeFormat === 'months' ? 'Show Years' : 'Show Months'}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full px-4 sm:px-6 py-2 bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 text-sm"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>
    </div>
    
    <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32 animate-pulse"></div>
    <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-24 -translate-x-12 sm:-translate-x-24 animate-pulse delay-300"></div>
  </div>
);

// Enhanced tab navigation
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'planning', label: 'Planning', icon: '📅' },
    { id: 'scenarios', label: 'Scenarios', icon: '💼' },
    { id: 'tracker', label: 'Tracker', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '📋' },
    { id: 'reports', label: 'Reports', icon: '📄' }
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg sm:rounded-xl py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main component
const LoanTracker = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [timeFormat, setTimeFormat] = useState('years');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });

  // Enhanced loan data with financial planning
  const [loanData, setLoanData] = useState({
    originalAmount: 5000000,
    currentBalance: 5000000,
    monthlyPayment: 111222,
    monthlyRate: 0.01,
    startDate: new Date('2025-10-28'),
    payments: [],
    totalInterestPaid: 0,
    totalPrincipalPaid: 0
  });

  // Financial planning data
  const [financialData, setFinancialData] = useState({
    monthlyIncome: 800000,
    emergencyFund: 2000000,
    investmentPortfolio: 1500000,
    targetExtraPayment: 600000,
    currentSavings: 150000,
    expectedGratuity: 1200000,
    nextGratuityDate: '2025-12-15'
  });

  const [calculatorInputs, setCalculatorInputs] = useState({
    loanBalance: 5000000,
    monthlyPayment: 111222,
    monthlyRate: 1,
    extraPayment: 600000,
    extraFrequency: 6,
    oneTimePayment: 0,
    extraStartMonth: 3
  });

  const [newPayment, setNewPayment] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 111222,
    type: 'regular',
    source: 'salary',
    notes: ''
  });

  // Custom hooks
  const { calculateLoan, calculateDetailedLoan } = useLoanCalculations();
  const { formatCurrency, formatLargeNumber, formatTime, formatTimeShort } = useFormatters(timeFormat);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Enhanced scenarios with 6-month focus
  const scenarios = useMemo(() => {
    const baseline = calculateLoan(5000000, 111222, 0.01, 0);

    return [
      { 
        name: 'No Extra Payments', 
        extraPayment: 0, 
        frequency: 0,
        ...calculateLoan(5000000, 111222, 0.01, 0),
        savings: 0,
        roi: 0
      },
      { 
        name: '$400K Every 6 Months', 
        extraPayment: 400000,
        frequency: 6,
        ...calculateLoan(5000000, 111222, 0.01, 400000, 6),
        get savings() { return baseline.totalInterest - this.totalInterest; },
        get roi() { return this.savings / (this.extraPayment * Math.floor(this.months / 6)) * 100; }
      },
      { 
        name: '$600K Every 6 Months (Target)', 
        extraPayment: 600000,
        frequency: 6,
        ...calculateLoan(5000000, 111222, 0.01, 600000, 6),
        get savings() { return baseline.totalInterest - this.totalInterest; },
        get roi() { return this.savings / (this.extraPayment * Math.floor(this.months / 6)) * 100; }
      },
      { 
        name: '$800K Every 6 Months', 
        extraPayment: 800000,
        frequency: 6,
        ...calculateLoan(5000000, 111222, 0.01, 800000, 6),
        get savings() { return baseline.totalInterest - this.totalInterest; },
        get roi() { return this.savings / (this.extraPayment * Math.floor(this.months / 6)) * 100; }
      },
      { 
        name: '$1M Every 6 Months', 
        extraPayment: 1000000,
        frequency: 6,
        ...calculateLoan(5000000, 111222, 0.01, 1000000, 6),
        get savings() { return baseline.totalInterest - this.totalInterest; },
        get roi() { return this.savings / (this.extraPayment * Math.floor(this.months / 6)) * 100; }
      }
    ];
  }, [calculateLoan]);

  // Calculate progress
  const progress = useMemo(() => {
    const paidAmount = loanData.originalAmount - loanData.currentBalance;
    const progressPercent = (paidAmount / loanData.originalAmount) * 100;

    return {
      percent: Math.max(0, progressPercent),
      paidAmount,
      remainingAmount: loanData.currentBalance
    };
  }, [loanData.currentBalance, loanData.originalAmount]);

  // Calculator results
  const calculationResult = useMemo(() => {
    const { loanBalance, monthlyPayment, monthlyRate, extraPayment, extraFrequency, oneTimePayment, extraStartMonth } = calculatorInputs;
    const rate = monthlyRate / 100;

    const baseline = calculateDetailedLoan(loanBalance, monthlyPayment, rate, 0, 0, 1);
    const withExtra = calculateDetailedLoan(loanBalance, monthlyPayment, rate, extraPayment, oneTimePayment, extraStartMonth, extraFrequency);

    return {
      baseline,
      withExtra,
      savings: baseline.totalInterest - withExtra.totalInterest,
      timeSaved: baseline.months - withExtra.months
    };
  }, [calculatorInputs, calculateDetailedLoan]);

  // Cash flow analysis
  const cashFlowAnalysis = useMemo(() => {
    const monthlyLoanPayment = loanData.monthlyPayment;
    const monthlyExtraPayment = financialData.targetExtraPayment / 6; // Spread over 6 months
    const totalMonthlyLoanCost = monthlyLoanPayment + monthlyExtraPayment;
    const disposableIncome = financialData.monthlyIncome - totalMonthlyLoanCost;
    const loanToIncomeRatio = (totalMonthlyLoanCost / financialData.monthlyIncome) * 100;

    return {
      monthlyLoanPayment,
      monthlyExtraPayment,
      totalMonthlyLoanCost,
      disposableIncome,
      loanToIncomeRatio,
      emergencyFundMonths: financialData.emergencyFund / (financialData.monthlyIncome - monthlyLoanPayment)
    };
  }, [loanData.monthlyPayment, financialData]);

  // Investment opportunity analysis
  const investmentAnalysis = useMemo(() => {
    const loanROI = (calculationResult.savings / (calculatorInputs.extraPayment * Math.floor(calculationResult.withExtra.months / calculatorInputs.extraFrequency))) * 100;
    const stockMarketROI = 12; // Assumed annual return
    const bankDepositROI = 6; // Assumed annual return
    
    return {
      loanPaymentROI: loanROI,
      stockMarketROI,
      bankDepositROI,
      recommendation: loanROI > stockMarketROI ? 'loan' : 'invest'
    };
  }, [calculationResult, calculatorInputs]);

  // Chart data
  const chartData = useMemo(() => {
    const baselineScenario = scenarios[0];
    const targetScenario = scenarios[2]; // $600K scenario

    const months = Array.from({length: Math.min(baselineScenario.months, 60)}, (_, i) => i + 1);

    return months.map(month => ({
      month: `Month ${month}`,
      monthNumber: month,
      baseline: baselineScenario.schedule[month - 1]?.balance || 0,
      target: targetScenario.schedule[month - 1]?.balance || 0
    }));
  }, [scenarios]);

  const scenarioComparisonData = scenarios.map(scenario => ({
    name: scenario.name.replace(' Every 6 Months', '').replace(' (Target)', ''),
    months: scenario.months,
    savings: scenario.savings / 1000000,
    roi: scenario.roi,
    frequency: scenario.frequency || 0
  }));

  // Helper functions
  const showInfoModal = (title, content) => {
    setModalContent({ title, content });
    setShowModal(true);
  };

  const addPayment = () => {
    const amount = parseFloat(newPayment.amount);
    
    if (!amount || amount <= 0) {
      showInfoModal('Invalid Payment', 'Please enter a valid payment amount greater than 0.');
      return;
    }

    try {
      const payment = {
        ...newPayment,
        amount,
        id: Date.now()
      };

      const updatedPayments = [...loanData.payments, payment].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      let balance = loanData.originalAmount;
      let totalInterest = 0;
      let totalPrincipal = 0;

      for (const p of updatedPayments) {
        const interestPayment = balance * loanData.monthlyRate;
        let principalPayment;
        
        if (p.type === 'regular') {
          principalPayment = Math.min(p.amount - interestPayment, balance);
          totalInterest += interestPayment;
        } else {
          principalPayment = Math.min(p.amount, balance);
        }
        
        totalPrincipal += principalPayment;
        balance = Math.max(0, balance - principalPayment);
      }

      setLoanData(prev => ({
        ...prev,
        payments: updatedPayments,
        currentBalance: balance,
        totalInterestPaid: totalInterest,
        totalPrincipalPaid: totalPrincipal
      }));

      setNewPayment(prev => ({
        ...prev,
        amount: payment.type === 'regular' ? 111222 : '',
        notes: ''
      }));

      showInfoModal('Payment Recorded Successfully!', 
        `Payment of ${formatCurrency(payment.amount)} has been recorded. Your new balance is ${formatCurrency(balance)}.`
      );
    } catch (error) {
      showInfoModal('Error', 'An error occurred while adding the payment. Please try again.');
    }
  };

  const deletePayment = (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    const updatedPayments = loanData.payments.filter(p => p.id !== paymentId);
    let balance = loanData.originalAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;

    for (const p of updatedPayments) {
      const interestPayment = balance * loanData.monthlyRate;
      let principalPayment;
      
      if (p.type === 'regular') {
        principalPayment = Math.min(p.amount - interestPayment, balance);
        totalInterest += interestPayment;
      } else {
        principalPayment = Math.min(p.amount, balance);
      }
      
      totalPrincipal += principalPayment;
      balance = Math.max(0, balance - principalPayment);
    }

    setLoanData(prev => ({
      ...prev,
      payments: updatedPayments,
      currentBalance: balance,
      totalInterestPaid: totalInterest,
      totalPrincipalPaid: totalPrincipal
    }));

    showInfoModal('Payment Deleted', 'Payment has been successfully deleted.');
  };

  // Calculate next payment date (6 months from last extra payment or loan start)
  const getNextPaymentDate = () => {
    const lastExtraPayment = loanData.payments
      .filter(p => p.type !== 'regular')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (lastExtraPayment) {
      const nextDate = new Date(lastExtraPayment.date);
      nextDate.setMonth(nextDate.getMonth() + 6);
      return nextDate.toISOString().split('T')[0];
    } else {
      // First extra payment opportunity is 3 months after loan start
      const firstDate = new Date(loanData.startDate);
      firstDate.setMonth(firstDate.getMonth() + 3);
      return firstDate.toISOString().split('T')[0];
    }
  };

  const generateAnnualReport = () => {
    const report = {
      year: new Date().getFullYear(),
      paymentsToDate: loanData.payments.length,
      totalPaid: loanData.originalAmount - loanData.currentBalance,
      interestPaid: loanData.totalInterestPaid,
      extraPayments: loanData.payments.filter(p => p.type !== 'regular'),
      projectedCompletion: new Date(Date.now() + (calculationResult.withExtra.months * 30 * 24 * 60 * 60 * 1000)),
      interestSavings: calculationResult.savings
    };

    const csvContent = [
      ['GPSCCU Loan Annual Report', ''],
      ['Report Year', report.year],
      ['Original Loan Amount', formatCurrency(loanData.originalAmount)],
      ['Current Balance', formatCurrency(loanData.currentBalance)],
      ['Total Payments Made', report.paymentsToDate],
      ['Total Amount Paid', formatCurrency(report.totalPaid)],
      ['Interest Paid to Date', formatCurrency(report.interestPaid)],
      ['Extra Payments Made', report.extraPayments.length],
      ['Projected Interest Savings', formatCurrency(report.interestSavings)],
      ['Projected Completion Date', report.projectedCompletion.toLocaleDateString()],
      ['', ''],
      ['Payment History', ''],
      ['Date', 'Amount', 'Type', 'Source', 'Notes'],
      ...loanData.payments.map(p => [p.date, p.amount, p.type, p.source || 'N/A', p.notes])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GPSCCU_Loan_Report_${report.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      darkMode 
        ? 'dark bg-gray-950 text-gray-100' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
        
        <LoanHeader 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          timeFormat={timeFormat}
          setTimeFormat={setTimeFormat}
          originalAmount={loanData.originalAmount}
          formatLargeNumber={formatLargeNumber}
        />

        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          title={modalContent.title}
          size={modalContent.title.includes('Report') ? 'full' : 'lg'}
        >
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {modalContent.content}
          </div>
        </Modal>

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Enhanced Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { 
                  label: 'Monthly Payment', 
                  value: formatLargeNumber(loanData.monthlyPayment), 
                  color: 'blue',
                  onClick: () => showInfoModal('Monthly Payment Details', `Regular Payment: ${formatCurrency(loanData.monthlyPayment)}
Target Extra (6-monthly): ${formatCurrency(financialData.targetExtraPayment)}
Total Monthly Impact: ${formatCurrency(cashFlowAnalysis.totalMonthlyLoanCost)}
Loan-to-Income Ratio: ${cashFlowAnalysis.loanToIncomeRatio.toFixed(1)}%`)
                },
                { 
                  label: 'Progress', 
                  value: `${Math.round(progress.percent)}%`, 
                  color: 'green',
                  onClick: () => showInfoModal('Progress Analysis', `Completion: ${Math.round(progress.percent)}%
Amount Paid: ${formatCurrency(progress.paidAmount)}
Remaining: ${formatCurrency(progress.remainingAmount)}
Projected Finish: ${formatTime(calculationResult.withExtra.months)} from start
Time Saved vs Baseline: ${formatTime(calculationResult.timeSaved)}`)
                },
                { 
                  label: 'Cash Flow Impact', 
                  value: `${cashFlowAnalysis.loanToIncomeRatio.toFixed(1)}%`, 
                  color: 'purple',
                  onClick: () => showInfoModal('Cash Flow Analysis', `Monthly Income: ${formatCurrency(financialData.monthlyIncome)}
Loan Payments: ${formatCurrency(cashFlowAnalysis.totalMonthlyLoanCost)}
Disposable Income: ${formatCurrency(cashFlowAnalysis.disposableIncome)}
Emergency Fund Coverage: ${cashFlowAnalysis.emergencyFundMonths.toFixed(1)} months`)
                },
                { 
                  label: 'ROI vs Investments', 
                  value: `${investmentAnalysis.loanPaymentROI.toFixed(1)}%`, 
                  color: 'orange',
                  onClick: () => showInfoModal('Investment Opportunity Analysis', `Extra Payment ROI: ${investmentAnalysis.loanPaymentROI.toFixed(1)}%
Stock Market (Est.): ${investmentAnalysis.stockMarketROI}%
Bank Deposits (Est.): ${investmentAnalysis.bankDepositROI}%
Recommendation: ${investmentAnalysis.recommendation === 'loan' ? 'Focus on loan payments' : 'Consider investing instead'}`)
                }
              ].map((metric, index) => (
                <div
                  key={index}
                  className={`group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-${metric.color}-50 to-${metric.color}-100 dark:from-${metric.color}-900/50 dark:to-${metric.color}-800/50 border-${metric.color}-200 dark:border-${metric.color}-700 hover:scale-105 rounded-xl p-4 sm:p-6 text-center border cursor-pointer`}
                  onClick={metric.onClick}
                >
                  <div className={`text-2xl sm:text-3xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400 mb-2 group-hover:scale-110 transition-transform`}>
                    {metric.value}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium text-${metric.color}-800 dark:text-${metric.color}-300`}>
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Countdown */}
            <PaymentCountdown 
              nextPaymentDate={getNextPaymentDate()}
              targetAmount={financialData.targetExtraPayment}
              currentSavings={financialData.currentSavings}
            />

            {/* Enhanced Progress Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Loan Progress & Smart Insights</h2>
                    <p className="text-blue-100">Your journey to financial freedom with 6-month strategy</p>
                  </div>
                  <button
                    onClick={() => showInfoModal('Complete Loan Analysis', `LOAN DETAILS:
Original Amount: ${formatCurrency(loanData.originalAmount)}
Current Balance: ${formatCurrency(loanData.currentBalance)}
Monthly Payment: ${formatCurrency(loanData.monthlyPayment)}
Start Date: October 28, 2025

FINANCIAL POSITION:
Monthly Income: ${formatCurrency(financialData.monthlyIncome)}
Emergency Fund: ${formatCurrency(financialData.emergencyFund)}
Investment Portfolio: ${formatCurrency(financialData.investmentPortfolio)}

6-MONTH STRATEGY:
Target Extra Payment: ${formatCurrency(financialData.targetExtraPayment)}
Current Savings Progress: ${formatCurrency(financialData.currentSavings)}
Next Payment Due: ${getNextPaymentDate()}
Expected Gratuity: ${formatCurrency(financialData.expectedGratuity)}

PROJECTIONS:
Interest Savings: ${formatCurrency(calculationResult.savings)}
Time Saved: ${formatTime(calculationResult.timeSaved)}
Completion Date: ${formatTime(calculationResult.withExtra.months)} from start`)}
                    className="mt-3 sm:mt-0 bg-white/20 border border-white/30 text-white hover:bg-white/30 rounded-full px-4 py-2 text-sm transition-all duration-300"
                  >
                    Full Analysis
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>Loan Progress: {Math.round(progress.percent)}% Complete</span>
                      <span>Savings Progress: {Math.round((financialData.currentSavings / financialData.targetExtraPayment) * 100)}% to next extra payment</span>
                    </div>
                    <ProgressBar value={progress.percent} className="h-6 sm:h-8">
                      {Math.round(progress.percent)}% Complete
                    </ProgressBar>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <Alert type="success">
                <h4 className="font-bold mb-2">Smart Recommendation</h4>
                <div className="text-sm">
                  {investmentAnalysis.recommendation === 'loan' ? (
                    `Your loan payment ROI (${investmentAnalysis.loanPaymentROI.toFixed(1)}%) exceeds typical investment returns. 
                    Continue prioritizing extra loan payments for guaranteed savings.`
                  ) : (
                    `Consider balancing between loan payments and investments. 
                    Market returns may exceed your loan payment benefits.`
                  )}
                </div>
              </Alert>

              <Alert type="info">
                <h4 className="font-bold mb-2">Financial Health Check</h4>
                <div className="text-sm">
                  Emergency Fund: {cashFlowAnalysis.emergencyFundMonths.toFixed(1)} months coverage
                  {cashFlowAnalysis.emergencyFundMonths >= 6 ? 
                    " ✓ Excellent financial cushion" : 
                    " ⚠️ Consider building emergency fund before aggressive payments"
                  }
                </div>
              </Alert>
            </div>

            {/* Enhanced Balance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Balance Reduction: Your 6-Month Strategy</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="monthNumber" stroke="#6B7280" />
                  <YAxis 
                    stroke="#6B7280"
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="baseline" 
                    stackId="1" 
                    stroke="#EF4444" 
                    fill="#FEE2E2" 
                    name="No Extra Payments"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="target" 
                    stackId="2" 
                    stroke="#22C55E" 
                    fill="#DCFCE7" 
                    name="Your 6-Month Strategy ($600K)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Payment Planning Tab */}
        {activeTab === 'planning' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Payment Schedule Overview */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
                  <h2 className="text-lg sm:text-xl font-bold">6-Month Payment Calendar</h2>
                  <p className="text-green-100">Plan your extra payments strategically</p>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { date: '2026-01-28', amount: 600000, type: 'First Extra Payment', status: 'upcoming' },
                      { date: '2026-07-28', amount: 600000, type: 'Mid-Year Payment', status: 'planned' },
                      { date: '2027-01-28', amount: 600000, type: 'Annual Payment', status: 'planned' },
                      { date: '2027-07-28', amount: 600000, type: 'Final Payment (Projected)', status: 'projected' }
                    ].map((payment, index) => (
                      <div key={index} className={`p-4 rounded-xl border-2 ${
                        payment.status === 'upcoming' ? 'border-green-500 bg-green-50 dark:bg-green-900/30' :
                        payment.status === 'planned' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' :
                        'border-gray-300 bg-gray-50 dark:bg-gray-700'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                              {new Date(payment.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{payment.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatCurrency(payment.amount)}</div>
                            <Badge variant={
                              payment.status === 'upcoming' ? 'success' :
                              payment.status === 'planned' ? 'default' : 'secondary'
                            }>
                              {payment.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Savings Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                  <h2 className="text-lg sm:text-xl font-bold">Extra Payment Fund</h2>
                  <p className="text-purple-100">Track your savings progress</p>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {formatCurrency(financialData.currentSavings)}
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-300 mb-4">
                      Saved / {formatCurrency(financialData.targetExtraPayment)} Target
                    </div>
                    <ProgressBar 
                      value={(financialData.currentSavings / financialData.targetExtraPayment) * 100} 
                      className="h-4"
                    >
                      {Math.round((financialData.currentSavings / financialData.targetExtraPayment) * 100)}%
                    </ProgressBar>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium">Monthly Auto-Save</span>
                      <span className="font-bold">{formatCurrency(financialData.targetExtraPayment / 6)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium">Expected Gratuity</span>
                      <span className="font-bold text-green-600">{formatCurrency(financialData.expectedGratuity)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium">Surplus After Target</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(Math.max(0, financialData.expectedGratuity - financialData.targetExtraPayment))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Health Dashboard */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                <h2 className="text-lg sm:text-xl font-bold">Financial Health Monitor</h2>
                <p className="text-indigo-100">Ensure balanced financial planning</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Emergency Fund Status</h4>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {cashFlowAnalysis.emergencyFundMonths.toFixed(1)}
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-300">Months Coverage</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Recommended: 6+ months of expenses
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Cash Flow Health</h4>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {cashFlowAnalysis.loanToIncomeRatio.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-300">Debt-to-Income</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Recommended: Below 36% total debt
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Investment Portfolio</h4>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatLargeNumber(financialData.investmentPortfolio)}
                      </div>
                      <div className="text-sm text-purple-800 dark:text-purple-300">Total Value</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Diversification recommended
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">6-Month Payment Strategy Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scenarioComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="months" fill="#3B82F6" name="Months to Payoff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                <h2 className="text-xl sm:text-2xl font-bold">6-Month Payment Strategies</h2>
                <p className="text-purple-100">Optimized for your gratuity schedule</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid gap-4 sm:gap-6">
                  {scenarios.map((scenario, index) => (
                    <div 
                      key={scenario.name} 
                      className={`transition-all duration-500 hover:shadow-xl hover:-translate-y-1 rounded-xl border p-4 sm:p-6 ${
                        scenario.extraPayment === 600000
                          ? 'ring-2 ring-green-500 dark:ring-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' 
                          : 'hover:shadow-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex flex-col space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0 flex items-center flex-wrap gap-2">
                            {scenario.name}
                            {scenario.extraPayment === 600000 && (
                              <Badge variant="success">YOUR TARGET</Badge>
                            )}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="font-semibold text-gray-600 dark:text-gray-400 text-xs">Payoff Time</div>
                            <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                              {formatTimeShort(scenario.months)}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="font-semibold text-gray-600 dark:text-gray-400 text-xs">Interest Savings</div>
                            <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                              {formatLargeNumber(scenario.savings)}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="font-semibold text-gray-600 dark:text-gray-400 text-xs">ROI</div>
                            <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                              {scenario.roi > 0 ? `${Math.round(scenario.roi)}%` : '-'}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="font-semibold text-gray-600 dark:text-gray-400 text-xs">Total Extra</div>
                            <div className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                              {scenario.extraPayment > 0 ? formatLargeNumber(scenario.extraPayment * Math.floor(scenario.months / 6)) : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Tracker Tab */}
        {activeTab === 'tracker' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                  <h2 className="text-lg sm:text-xl font-bold">Record Payment</h2>
                  <p className="text-green-100">Track all payments with detailed categorization</p>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Payment Date</label>
                      <input
                        type="date"
                        value={newPayment.date}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full rounded-xl border-2 h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Amount (GYD)</label>
                      <input
                        type="number"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full rounded-xl border-2 h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                        placeholder="111,222"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Payment Type</label>
                      <select 
                        value={newPayment.type} 
                        onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full rounded-xl border-2 h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                      >
                        <option value="regular">Regular Monthly Payment ($111,222)</option>
                        <option value="extra">Extra Payment (6-Month Strategy)</option>
                        <option value="semi-annual-gratuity">Semi-Annual Gratuity Payment</option>
                        <option value="annual-gratuity">Annual Gratuity Payment</option>
                        <option value="bonus">Bonus Payment</option>
                        <option value="other">Other Extra Payment</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Payment Source</label>
                      <select 
                        value={newPayment.source} 
                        onChange={(e) => setNewPayment(prev => ({ ...prev, source: e.target.value }))}
                        className="w-full rounded-xl border-2 h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                      >
                        <option value="salary">Regular Salary</option>
                        <option value="semi-annual-gratuity">Semi-Annual Gratuity</option>
                        <option value="annual-gratuity">Annual Gratuity</option>
                        <option value="bonus">Performance Bonus</option>
                        <option value="savings">Personal Savings</option>
                        <option value="investment">Investment Returns</option>
                        <option value="other">Other Source</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                    <input
                      type="text"
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-xl border-2 h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                      placeholder="e.g., December gratuity payment - 6-month strategy"
                    />
                  </div>
                  
                  <button 
                    onClick={addPayment} 
                    className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 h-12 font-bold text-white shadow-lg hover:shadow-xl"
                  >
                    Record Payment
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
                  <h2 className="text-lg sm:text-xl font-bold">Payment Analytics</h2>
                  <p className="text-blue-100">Real-time insights and recommendations</p>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="font-bold text-blue-600 dark:text-blue-400 text-lg sm:text-xl">
                        {loanData.payments.filter(p => p.type !== 'regular').length}
                      </div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Extra Payments Made</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700">
                      <div className="font-bold text-green-600 dark:text-green-400 text-lg sm:text-xl">
                        {formatLargeNumber(loanData.payments.filter(p => p.type !== 'regular').reduce((sum, p) => sum + p.amount, 0))}
                      </div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-300">Total Extra Paid</div>
                    </div>
                  </div>

                  {progress.percent < 10 && (
                    <Alert type="info">
                      <strong>Next Milestone:</strong> Your first 6-month extra payment opportunity is approaching in January 2026. 
                      Consider using gratuity funds for maximum impact!
                    </Alert>
                  )}
                  
                  {progress.percent >= 25 && progress.percent < 50 && (
                    <Alert type="success">
                      <strong>Great Progress!</strong> You're on track with your 6-month strategy. 
                      Maintain momentum for optimal results.
                    </Alert>
                  )}

                  {progress.percent >= 50 && (
                    <Alert type="success">
                      <strong>Milestone Achieved!</strong> Halfway complete! Your 6-month strategy is paying off beautifully.
                    </Alert>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Payment History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-slate-600 text-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">Complete Payment History</h2>
                    <p className="text-gray-100">Detailed tracking with source categorization</p>
                  </div>
                  {loanData.payments.length > 0 && (
                    <div className="flex gap-2 mt-3 sm:mt-0">
                      <button 
                        className="bg-white/20 border border-white/30 text-white hover:bg-white/30 rounded-full px-4 py-2 text-sm transition-all duration-300"
                        onClick={() => {
                          const csvContent = [
                            ['Date', 'Amount', 'Type', 'Source', 'Notes'],
                            ...loanData.payments.map(p => [p.date, p.amount, p.type, p.source || 'N/A', p.notes])
                          ].map(row => row.join(',')).join('\n');
                          
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'payment_history.csv';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Export CSV
                      </button>
                      <button 
                        className="bg-white/20 border border-white/30 text-white hover:bg-white/30 rounded-full px-4 py-2 text-sm transition-all duration-300"
                        onClick={generateAnnualReport}
                      >
                        Annual Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {loanData.payments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-4 opacity-50">💳</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                      No payments recorded yet. Start tracking to see detailed analytics!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {[...loanData.payments].reverse().map((payment) => (
                      <div 
                        key={payment.id}
                        className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                          payment.type !== 'regular' 
                            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700' 
                            : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex-1 flex items-center space-x-3 sm:space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            payment.type !== 'regular' ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'
                          } animate-pulse`}></div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100">
                                  {formatCurrency(payment.amount)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(payment.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="flex gap-2 mt-1">
                                  {payment.type !== 'regular' && (
                                    <Badge variant="success">EXTRA</Badge>
                                  )}
                                  {payment.source && (
                                    <Badge variant="purple">{payment.source.toUpperCase()}</Badge>
                                  )}
                                </div>
                                {payment.notes && (
                                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                                    {payment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deletePayment(payment.id)}
                          className="rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6">
                <h2 className="text-xl sm:text-2xl font-bold">Advanced Loan Analytics</h2>
                <p className="text-cyan-100">Comprehensive insights for optimal financial planning</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid lg:grid-cols-4 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Financial Score</h4>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border border-green-200 dark:border-green-700">
                      <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-3">
                        {progress.percent > 50 ? 'A+' : 
                         progress.percent > 25 ? 'A' : 
                         progress.percent > 10 ? 'B+' : 'B'}
                      </div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-300">
                        Excellent Strategy
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Payment Efficiency</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm font-medium">6-Month Payments</span>
                        <span className="font-bold text-green-600">
                          {loanData.payments.filter(p => p.type !== 'regular').length}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm font-medium">Avg Extra Payment</span>
                        <span className="font-bold text-purple-600">
                          {loanData.payments.filter(p => p.type !== 'regular').length > 0
                            ? formatLargeNumber(
                                loanData.payments
                                  .filter(p => p.type !== 'regular')
                                  .reduce((sum, p) => sum + p.amount, 0) /
                                loanData.payments.filter(p => p.type !== 'regular').length
                              )
                            : '$0'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">ROI Analysis</h4>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                        {investmentAnalysis.loanPaymentROI.toFixed(1)}%
                      </div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Extra Payment ROI</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      vs {investmentAnalysis.stockMarketROI}% market average
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Projected Savings</h4>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                        {formatLargeNumber(calculationResult.savings)}
                      </div>
                      <div className="text-sm font-medium text-purple-800 dark:text-purple-300">Interest Savings</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total loan cost reduction
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest Savings Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Interest Savings by Strategy</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scenarioComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    formatter={(value) => [`$${(value * 1000000).toLocaleString()}`, 'Interest Savings']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="savings" fill="#22C55E" name="Interest Savings (Millions)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Investment vs Loan Payment Analysis */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Investment Opportunity Cost</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                    <span className="font-medium">Extra Loan Payments</span>
                    <span className="font-bold text-green-600">{investmentAnalysis.loanPaymentROI.toFixed(1)}% ROI</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <span className="font-medium">Stock Market (Est.)</span>
                    <span className="font-bold text-blue-600">{investmentAnalysis.stockMarketROI}% ROI</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                    <span className="font-medium">Bank Deposits (Est.)</span>
                    <span className="font-bold text-orange-600">{investmentAnalysis.bankDepositROI}% ROI</span>
                  </div>
                  <Alert type={investmentAnalysis.recommendation === 'loan' ? 'success' : 'warning'}>
                    <strong>Recommendation:</strong> {
                      investmentAnalysis.recommendation === 'loan' 
                        ? 'Focus on loan payments for guaranteed returns' 
                        : 'Consider balancing between loan payments and investments'
                    }
                  </Alert>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Cash Flow Impact</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                      <div className="font-bold text-blue-600 text-lg">{formatCurrency(financialData.monthlyIncome)}</div>
                      <div className="text-sm text-blue-800 dark:text-blue-300">Monthly Income</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                      <div className="font-bold text-purple-600 text-lg">{formatCurrency(cashFlowAnalysis.disposableIncome)}</div>
                      <div className="text-sm text-purple-800 dark:text-purple-300">After Loan Payments</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                        {cashFlowAnalysis.loanToIncomeRatio.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Debt-to-Income Ratio</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Healthy debt ratio: Below 36% total debt burden
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                <h2 className="text-xl sm:text-2xl font-bold">Comprehensive Reports & Documentation</h2>
                <p className="text-indigo-100">Export detailed analyses for tax and financial planning</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Available Reports</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={generateAnnualReport}
                        className="w-full p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-300 text-left"
                      >
                        <div className="font-bold text-blue-900 dark:text-blue-100">Annual Tax Report</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Complete payment history with interest calculations</div>
                      </button>
                      
                      <button 
                        onClick={() => showInfoModal('Strategy Performance Report', `6-MONTH PAYMENT STRATEGY PERFORMANCE

Current Status:
- Loan Progress: ${Math.round(progress.percent)}% complete
- Extra Payments Made: ${loanData.payments.filter(p => p.type !== 'regular').length}
- Total Extra Amount: ${formatCurrency(loanData.payments.filter(p => p.type !== 'regular').reduce((sum, p) => sum + p.amount, 0))}

Projected Results:
- Interest Savings: ${formatCurrency(calculationResult.savings)}
- Time Reduction: ${formatTime(calculationResult.timeSaved)}
- ROI on Extra Payments: ${investmentAnalysis.loanPaymentROI.toFixed(1)}%

Financial Health:
- Emergency Fund: ${cashFlowAnalysis.emergencyFundMonths.toFixed(1)} months coverage
- Debt-to-Income: ${cashFlowAnalysis.loanToIncomeRatio.toFixed(1)}%
- Disposable Income: ${formatCurrency(cashFlowAnalysis.disposableIncome)}

Recommendations:
${investmentAnalysis.recommendation === 'loan' ? '✓ Continue aggressive loan payments' : '⚠️ Consider investment balance'}
${cashFlowAnalysis.emergencyFundMonths >= 6 ? '✓ Emergency fund adequate' : '⚠️ Build emergency fund'}
${cashFlowAnalysis.loanToIncomeRatio <= 36 ? '✓ Healthy debt ratio' : '⚠️ High debt burden'}`)}
                        className="w-full p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-300 text-left"
                      >
                        <div className="font-bold text-green-900 dark:text-green-100">Strategy Performance Report</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Detailed analysis of your 6-month payment strategy</div>
                      </button>

                      <button 
                        onClick={() => showInfoModal('Cash Flow Projection', `CASH FLOW ANALYSIS & PROJECTIONS

Monthly Income: ${formatCurrency(financialData.monthlyIncome)}
Monthly Loan Payment: ${formatCurrency(loanData.monthlyPayment)}
Target Extra Payment (6-monthly): ${formatCurrency(financialData.targetExtraPayment)}
Monthly Loan Impact: ${formatCurrency(cashFlowAnalysis.totalMonthlyLoanCost)}

Disposable Income: ${formatCurrency(cashFlowAnalysis.disposableIncome)}
Emergency Fund: ${formatCurrency(financialData.emergencyFund)} (${cashFlowAnalysis.emergencyFundMonths.toFixed(1)} months)
Investment Portfolio: ${formatCurrency(financialData.investmentPortfolio)}

FUTURE PROJECTIONS:
After Loan Completion:
- Additional Monthly Cash Flow: ${formatCurrency(loanData.monthlyPayment)}
- Annual Cash Flow Improvement: ${formatCurrency(loanData.monthlyPayment * 12)}
- Time to Completion: ${formatTime(calculationResult.withExtra.months)}

Investment Opportunity:
- Freed Cash Flow for Investments: ${formatCurrency(loanData.monthlyPayment)}
- 20-Year Investment Potential (8% return): ${formatCurrency(loanData.monthlyPayment * 12 * 20 * 1.08 ** 20)}

RECOMMENDATION:
Focus on loan completion first for guaranteed savings, then redirect monthly payments to investments.`)}
                        className="w-full p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-300 text-left"
                      >
                        <div className="font-bold text-purple-900 dark:text-purple-100">Cash Flow Projection</div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">Future financial planning and investment opportunities</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Quick Stats Summary</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-bold text-gray-600 dark:text-gray-400">Total Payments</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{loanData.payments.length}</div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-600 dark:text-gray-400">Extra Payments</div>
                            <div className="text-lg font-bold text-green-600">{loanData.payments.filter(p => p.type !== 'regular').length}</div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-600 dark:text-gray-400">Interest Paid</div>
                            <div className="text-lg font-bold text-red-600">{formatLargeNumber(loanData.totalInterestPaid)}</div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-600 dark:text-gray-400">Projected Savings</div>
                            <div className="text-lg font-bold text-purple-600">{formatLargeNumber(calculationResult.savings)}</div>
                          </div>
                        </div>
                      </div>

                      <Alert type="info">
                        <strong>Tax Documentation:</strong> All reports include detailed payment breakdowns 
                        for tax deduction purposes and financial record keeping.
                      </Alert>

                      <Alert type="success">
                        <strong>GPSCCU Integration Ready:</strong> Reports are formatted for easy 
                        submission to your credit union for account verification.
                      </Alert>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculator Tab remains the same but updated */}
        {activeTab === 'calculator' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold">Advanced Calculator</h2>
                      <p className="text-orange-100">Fine-tune your 6-month strategy</p>
                    </div>
                    <button
                      onClick={() => showInfoModal('Calculator Guide', `Loan Balance: Enter your current remaining balance
Monthly Payment: Your regular payment amount ($111,222)
Monthly Rate: Interest rate per month (1% for GPSCCU)
Extra Payment Frequency: Choose between every 3 months or 6 months
Extra Payment Amount: Amount you plan to pay at your chosen frequency
One-time Payment: Any large one-off payment
Start Month: When to begin extra payments (month 3 = January 2026)`)}
                      className="bg-white/20 border border-white/30 text-white hover:bg-white/30 rounded-full px-4 py-2 text-sm transition-all duration-300"
                    >
                      Help
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Current Loan Balance (GYD)</label>
                      <input
                        type="number"
                        value={calculatorInputs.loanBalance}
                        onChange={(e) => setCalculatorInputs(prev => ({ ...prev, loanBalance: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-xl h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Monthly Payment (GYD)</label>
                      <input
                        type="number"
                        value={calculatorInputs.monthlyPayment}
                        onChange={(e) => setCalculatorInputs(prev => ({ ...prev, monthlyPayment: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-xl h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Monthly Interest Rate (%)</label>
                      <input
                        type="number"
                        value={calculatorInputs.monthlyRate}
                        onChange={(e) => setCalculatorInputs(prev => ({ ...prev, monthlyRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-xl h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Extra Payment Frequency</label>
                      <select
                        value={calculatorInputs.extraFrequency}
                        onChange={(e) => setCalculatorInputs(prev => ({ ...prev, extraFrequency: parseInt(e.target.value) }))}
                        className="w-full rounded-xl h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                      >
                        <option value={3}>Every 3 Months</option>
                        <option value={6}>Every 6 Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Extra Payment Amount (Every {calculatorInputs.extraFrequency} months)
                    </label>
                    <input
                      type="number"
                      value={calculatorInputs.extraPayment}
                      onChange={(e) => setCalculatorInputs(prev => ({ ...prev, extraPayment: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                      placeholder="600000"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">One-time Payment (Optional)</label>
                      <input
                        type="number"
                        value={calculatorInputs.oneTimePayment}
                        onChange={(e) => setCalculatorInputs(prev => ({ ...prev, oneTimePayment: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-xl h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Start Extra Payments (Month)</label>
                      <input
                        type="number"
                        value={calculatorInputs.extraStartMonth}
                        onChange={(e) => setCalculatorInputs(prev => ({ ...prev, extraStartMonth: parseInt(e.target.value) || 3 }))}
                        className="w-full rounded-xl h-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quick Presets (6-Month Strategy)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[400000, 600000, 800000, 1000000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setCalculatorInputs(prev => ({ ...prev, extraPayment: amount, extraFrequency: 6 }))}
                          className="rounded-lg text-xs sm:text-sm hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all duration-300 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          {formatLargeNumber(amount)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white rounded-2xl shadow-xl border border-gray-700">
                <div className="p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Live Results</h2>
                  <p className="text-gray-300 mb-6">Your optimized 6-month strategy projections</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold mb-1 text-cyan-400">
                        {formatTime(calculationResult.withExtra.months)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Payoff Time</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold mb-1 text-green-400">
                        {formatLargeNumber(calculationResult.savings)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Interest Savings</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold mb-1 text-red-400">
                        {formatLargeNumber(calculationResult.withExtra.totalInterest)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Total Interest</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold mb-1 text-purple-400">
                        {formatTime(calculationResult.timeSaved)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Time Saved</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                    <h4 className="font-bold text-green-400 mb-2 text-sm sm:text-base">6-Month Strategy Impact</h4>
                    <p className="text-sm text-green-300">
                      Your {calculatorInputs.extraFrequency === 6 ? '6-month' : '3-month'} payment strategy will save {formatLargeNumber(calculationResult.savings)} in interest 
                      and complete your loan {formatTime(calculationResult.timeSaved)} earlier than minimum payments!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanTracker;
