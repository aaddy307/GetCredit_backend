const calculateLoanDetails = (principal, annualRate, years) => {
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  let emi;
  if (monthlyRate === 0) {
    emi = principal / months;
  } else {
    emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);
  }

  const totalAmount = Math.round(emi * months);
  const totalInterest = totalAmount - principal;

  return {
    monthlyEMI: Math.round(emi),
    totalAmount: totalAmount,
    totalInterest: totalInterest
  };
};

export const calculateHomeLoan = (req, res) => {
  try {
    const { loanAmount, downPayment = 0, interestRate, tenure } = req.body;

    if (!loanAmount || !interestRate || !tenure) {
      return res.status(400).json({ success: false, message: 'Please provide loanAmount, interestRate, and tenure' });
    }

    if (loanAmount <= 0 || tenure <= 0) {
      return res.status(400).json({ success: false, message: 'Loan amount and tenure must be positive' });
    }

    if (interestRate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate cannot be negative' });
    }

    const principal = loanAmount - downPayment;
    const result = calculateLoanDetails(principal, interestRate, tenure);

    res.json({ success: true, ...result, principal: principal, tenure: parseInt(tenure) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const calculateLAP = (req, res) => {
  try {
    const { loanAmount, interestRate, tenure } = req.body;

    if (!loanAmount || !interestRate || !tenure) {
      return res.status(400).json({ success: false, message: 'Please provide loanAmount, interestRate, and tenure' });
    }

    if (loanAmount <= 0 || tenure <= 0) {
      return res.status(400).json({ success: false, message: 'Loan amount and tenure must be positive' });
    }

    if (interestRate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate cannot be negative' });
    }

    const result = calculateLoanDetails(loanAmount, interestRate, tenure);

    res.json({ success: true, ...result, principal: loanAmount, tenure: parseInt(tenure) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const calculateEducationLoan = (req, res) => {
  try {
    const { loanAmount, interestRate, tenure } = req.body;

    if (!loanAmount || !interestRate || !tenure) {
      return res.status(400).json({ success: false, message: 'Please provide loanAmount, interestRate, and tenure' });
    }

    if (loanAmount <= 0 || tenure <= 0) {
      return res.status(400).json({ success: false, message: 'Loan amount and tenure must be positive' });
    }

    if (interestRate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate cannot be negative' });
    }

    const result = calculateLoanDetails(loanAmount, interestRate, tenure);

    res.json({ success: true, ...result, principal: loanAmount, tenure: parseInt(tenure) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const calculatePersonalLoan = (req, res) => {
  try {
    const { loanAmount, interestRate, tenure } = req.body;

    if (!loanAmount || !interestRate || !tenure) {
      return res.status(400).json({ success: false, message: 'Please provide loanAmount, interestRate, and tenure' });
    }

    if (loanAmount <= 0 || tenure <= 0) {
      return res.status(400).json({ success: false, message: 'Loan amount and tenure must be positive' });
    }

    if (interestRate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate cannot be negative' });
    }

    const result = calculateLoanDetails(loanAmount, interestRate, tenure);

    res.json({ success: true, ...result, principal: loanAmount, tenure: parseInt(tenure) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const calculateBusinessLoan = (req, res) => {
  try {
    const { loanAmount, interestRate, tenure } = req.body;

    if (!loanAmount || !interestRate || !tenure) {
      return res.status(400).json({ success: false, message: 'Please provide loanAmount, interestRate, and tenure' });
    }

    if (loanAmount <= 0 || tenure <= 0) {
      return res.status(400).json({ success: false, message: 'Loan amount and tenure must be positive' });
    }

    if (interestRate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate cannot be negative' });
    }

    const result = calculateLoanDetails(loanAmount, interestRate, tenure);

    res.json({ success: true, ...result, principal: loanAmount, tenure: parseInt(tenure) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const calculateVehicleLoan = (req, res) => {
  try {
    const { loanAmount, downPayment = 0, interestRate, tenure } = req.body;

    if (!loanAmount || !interestRate || !tenure) {
      return res.status(400).json({ success: false, message: 'Please provide loanAmount, interestRate, and tenure' });
    }

    if (loanAmount <= 0 || tenure <= 0) {
      return res.status(400).json({ success: false, message: 'Loan amount and tenure must be positive' });
    }

    if (interestRate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate cannot be negative' });
    }

    const principal = loanAmount - downPayment;
    const result = calculateLoanDetails(principal, interestRate, tenure);

    res.json({ success: true, ...result, principal: principal, tenure: parseInt(tenure) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};