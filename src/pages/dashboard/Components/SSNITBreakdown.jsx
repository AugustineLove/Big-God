import React from 'react';

export const SSNITBreakdown = ({ basicSalary }) => {
  const employeeRate = 0.055;
  const employerRate = 0.13;
  const tier2Rate = 0.05;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">SSNIT Contribution Breakdown</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Employee Contribution (5.5%)</span>
          <span className="font-medium">GHS {(basicSalary * employeeRate).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Employer Contribution (13%)</span>
          <span className="font-medium">GHS {(basicSalary * employerRate).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm pl-4">
          <span className="text-gray-500">→ Tier 2 Pension (5%)</span>
          <span className="font-medium">GHS {(basicSalary * tier2Rate).toLocaleString()}</span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>Total SSNIT (Employer)</span>
            <span>GHS {(basicSalary * employerRate).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};