import { calculateEMIFromRequest, validateLoanAmount } from '../utils/emiCalculator.js';

const handleCalculation = (loanType, hasDownPayment = false) => (req, res) => {
  try {
    const { loanAmount, downPayment = 0, interestRate, tenure, tenureUnit = 'Years' } = req.body;

    if (!loanAmount || !interestRate || !tenure) {
      return res.status(400).json({
        success: false,
        message: 'Please provide loanAmount, interestRate, and tenure'
      });
    }

    if (loanAmount <= 0 || tenure <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Loan amount and tenure must be positive'
      });
    }

    if (interestRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Interest rate cannot be negative'
      });
    }

    const validation = validateLoanAmount(Number(loanAmount), loanType);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const requestData = {
      loanAmount,
      downPayment: hasDownPayment ? downPayment : 0,
      interestRate,
      tenure,
      tenureUnit,
    };

    const result = calculateEMIFromRequest(requestData);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      ...result,
      tenure: parseInt(tenure),
      loanType,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const calculateHomeLoan = handleCalculation('Home Loan', true);
export const calculateLAP = handleCalculation('Loan Against Property', false);
export const calculateEducationLoan = handleCalculation('Education Loan', false);
export const calculatePersonalLoan = handleCalculation('Personal Loan', false);
export const calculateBusinessLoan = handleCalculation('Business Loan', false);
export const calculateVehicleLoan = handleCalculation('Vehicle Loan', true);
