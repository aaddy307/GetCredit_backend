export const calculateEMI = (principal, annualRate, months) => {
  if (months <= 0) {
    return 0;
  }

  if (principal <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return Math.round(principal / months);
  }

  const compoundFactor = Math.pow(1 + monthlyRate, months);

  if (compoundFactor <= 1) {
    return Math.round(principal / months);
  }

  const emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);

  return Math.round(emi);
};

export const calculateLoanDetails = (principal, annualRate, years) => {
  const months = years * 12;
  const emi = calculateEMI(principal, annualRate, months);
  const totalAmount = Math.round(emi * months);
  const totalInterest = totalAmount - principal;

  return {
    monthlyEMI: emi,
    totalAmount,
    totalInterest,
    principal,
    months,
    annualRate,
    years,
  };
};

export const calculateEMIFromRequest = (body) => {
  const { loanAmount, downPayment = 0, interestRate, tenure, tenureUnit = 'Years' } = body;

  if (!loanAmount || !interestRate || !tenure) {
    return {
      error: 'Please provide loanAmount, interestRate, and tenure'
    };
  }

  const principal = Math.max(0, Number(loanAmount) - Number(downPayment || 0));

  if (principal <= 0) {
    return { error: 'Loan amount must be greater than down payment' };
  }

  const tenureNum = Number(tenure);
  if (tenureNum <= 0) {
    return { error: 'Tenure must be positive' };
  }

  if (interestRate < 0) {
    return { error: 'Interest rate cannot be negative' };
  }

  const actualTenure = tenureUnit === 'Months' ? tenureNum : tenureNum;
  const actualYears = tenureUnit === 'Months' ? tenureNum / 12 : tenureNum;

  const result = calculateLoanDetails(principal, Number(interestRate), actualYears);

  return {
    principal: result.principal,
    interestRate: Number(interestRate),
    tenure: Math.round(actualYears * 12),
    tenureUnit: 'Months',
    monthlyEMI: result.monthlyEMI,
    totalAmount: result.totalAmount,
    totalInterest: result.totalInterest,
  };
};

export const validateLoanAmount = (amount, loanType) => {
  const limits = {
    'Home Loan': { min: 10000, max: 150000000 },
    'Loan Against Property': { min: 10000, max: 300000000 },
    'Education Loan': { min: 10000, max: 50000000 },
    'Personal Loan': { min: 10000, max: 100000000 },
    'Business Loan': { min: 10000, max: 500000000 },
    'Vehicle Loan': { min: 10000, max: 50000000 },
  };

  const limit = limits[loanType] || { min: 10000, max: 100000000 };

  if (amount < limit.min) {
    return { valid: false, message: `Loan amount must be at least ₹${limit.min.toLocaleString('en-IN')}` };
  }

  if (amount > limit.max) {
    return { valid: false, message: `Loan amount cannot exceed ₹${limit.max.toLocaleString('en-IN')}` };
  }

  return { valid: true };
};
