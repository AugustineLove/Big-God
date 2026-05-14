import React, { useState } from 'react';

export const PayeeCalculator = ({ onCalculate }) => {
  const [income, setIncome] = useState(0);
  const [result, setResult] = useState(null);

  const taxBands = [
    { upTo: 4380, rate: 0 },
    { upTo: 5100, rate: 0.05 },
    { upTo: 6900, rate: 0.10 },
    { upTo: 10380, rate: 0.175 },
    { upTo: 41580, rate: 0.25 },
    { upTo: 240000, rate: 0.30 },
    { upTo: Infinity, rate: 0.35 }
  ];

  const calculatePAYE = () => {
    let annual = income * 12;
    let tax = 0;
    let prev = 0;
    
    for (const band of taxBands) {
      const taxable = Math.min(Math.max(0, annual - prev), band.upTo - prev);
      tax += taxable * band.rate;
      prev = band.upTo;
      if (annual <= band.upTo) break;
    }
    
    setResult({ monthly: tax / 12, annual: tax });
    onCalculate?.({ monthly: tax / 12, annual: tax });
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="font-medium text-gray-900 mb-3">PAYE Calculator (Ghana 2024)</h4>
      <div className="space-y-3">
        <input
          type="number"
          placeholder="Monthly Taxable Income"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          onChange={(e) => setIncome(parseFloat(e.target.value))}
        />
        <button onClick={calculatePAYE} className="w-full py-2 bg-[#0B3B3C] text-white rounded-lg">
          Calculate PAYE
        </button>
        {result && (
          <div className="bg-gray-50 rounded-lg p-3 mt-3">
            <div className="flex justify-between text-sm">
              <span>Monthly PAYE:</span>
              <span className="font-bold">GHS {result.monthly.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Annual PAYE:</span>
              <span>GHS {result.annual.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};