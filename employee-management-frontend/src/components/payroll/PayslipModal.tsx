import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Building2, Calendar, DollarSign, PieChart, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/utils/helpers'

interface PayslipDetails {
  working_days?: number;
  days_present?: number;
  leave_days?: number;
  absent_days?: number;
  monthly_base?: string;
  absence_deduction?: string;
  tax_deduction?: string;
}

interface Payslip {
  id: string;
  employeeName: string;
  department: string;
  period_start: string;
  period_end: string;
  gross_pay: string;
  net_pay: string;
  status: string;
  details?: PayslipDetails;
}

interface PayslipModalProps {
  payslip: Payslip;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ payslip, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const d = payslip.details || {};

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-sm sm:p-md print:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-card shadow-2xl print:shadow-none print:rounded-none print:w-full print:max-w-full max-h-[90vh] flex flex-col"
        >
          {/* Header section */}
          <div className="flex items-center justify-between border-b border-border bg-slate-50/50 p-lg dark:bg-slate-800/30 print:bg-white print:border-b-2 print:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg print:bg-slate-800">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-text-primary print:text-black">Workforce Hub</h2>
                <p className="text-sm font-medium text-text-secondary print:text-slate-600">Official Earnings Statement</p>
              </div>
            </div>
            
            <div className="flex items-center gap-sm print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-xs rounded-full bg-slate-100 px-md py-sm text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Download / Print
              </button>
              <button
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-xl print:p-lg space-y-xl print:bg-white print:text-black overflow-y-auto">
            
            {/* Employee Info Grid */}
            <div className="grid grid-cols-2 gap-md rounded-2xl border border-border bg-background p-lg sm:grid-cols-4 print:border-slate-300">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary print:text-slate-500">Employee Name</p>
                <p className="mt-xs font-bold text-text-primary print:text-black">{payslip.employeeName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary print:text-slate-500">Department</p>
                <p className="mt-xs font-bold text-text-primary print:text-black">{payslip.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary print:text-slate-500">Pay Period</p>
                <p className="mt-xs font-bold text-text-primary print:text-black">{payslip.period_start} to {payslip.period_end}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary print:text-slate-500">Status</p>
                <div className="mt-xs flex items-center gap-xs">
                  {payslip.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 print:text-black">
                      <ShieldCheck className="h-4 w-4" /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 print:text-black">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Breakdown */}
            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
              
              {/* Earnings */}
              <div className="space-y-sm">
                <div className="flex items-center gap-sm border-b border-border pb-sm">
                  <div className="rounded-lg bg-green-100 p-1.5 text-green-700 dark:bg-green-900/30 dark:text-green-400 print:bg-transparent print:text-black">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-text-primary print:text-black">Earnings</h3>
                </div>
                
                <div className="space-y-sm pt-sm">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary print:text-slate-700">Monthly Base Salary</span>
                    <span className="font-medium text-text-primary print:text-black">{formatCurrency(parseFloat(d.monthly_base || payslip.gross_pay || '0'))}</span>
                  </div>
                  {/* Additional Earnings can go here in future */}
                </div>
                
                <div className="mt-md flex justify-between items-center border-t border-border pt-md">
                  <span className="font-bold text-text-primary print:text-black">Total Earnings</span>
                  <span className="font-bold text-text-primary print:text-black">{formatCurrency(parseFloat(d.monthly_base || payslip.gross_pay || '0'))}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-sm">
                <div className="flex items-center gap-sm border-b border-border pb-sm">
                  <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 print:bg-transparent print:text-black">
                    <PieChart className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-text-primary print:text-black">Deductions</h3>
                </div>
                
                <div className="space-y-sm pt-sm">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary print:text-slate-700 flex items-center gap-1">
                      Unpaid Absence ({d.absent_days || 0} days)
                    </span>
                    <span className="font-medium text-rose-600 print:text-black">- {formatCurrency(parseFloat(d.absence_deduction || '0'))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary print:text-slate-700">Taxes & Levies</span>
                    <span className="font-medium text-rose-600 print:text-black">- {formatCurrency(parseFloat(d.tax_deduction || '0'))}</span>
                  </div>
                </div>
                
                <div className="mt-md flex justify-between items-center border-t border-border pt-md">
                  <span className="font-bold text-text-primary print:text-black">Total Deductions</span>
                  <span className="font-bold text-rose-600 print:text-black">
                    - {formatCurrency(parseFloat(d.absence_deduction || '0') + parseFloat(d.tax_deduction || '0'))}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Summary (if available) */}
            {d.working_days !== undefined && (
              <div className="rounded-2xl border border-border bg-slate-50 p-md dark:bg-slate-800/30 print:border-slate-300">
                <h4 className="mb-md text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2 print:text-slate-500">
                  <Calendar className="h-4 w-4" /> Attendance Summary
                </h4>
                <div className="grid grid-cols-2 gap-sm sm:grid-cols-4 text-sm">
                  <div>
                    <span className="block text-text-secondary print:text-slate-600">Total Days</span>
                    <span className="font-bold text-text-primary print:text-black">{d.working_days}</span>
                  </div>
                  <div>
                    <span className="block text-text-secondary print:text-slate-600">Days Present</span>
                    <span className="font-bold text-text-primary print:text-black">{d.days_present}</span>
                  </div>
                  <div>
                    <span className="block text-text-secondary print:text-slate-600">Paid Leave</span>
                    <span className="font-bold text-text-primary print:text-black">{d.leave_days}</span>
                  </div>
                  <div>
                    <span className="block text-text-secondary print:text-slate-600">Unpaid Absent</span>
                    <span className="font-bold text-text-primary print:text-black">{d.absent_days}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Final Net Pay */}
            <div className="rounded-2xl bg-primary-600 p-xl text-white shadow-lg print:bg-slate-100 print:text-black print:border print:border-slate-400 print:shadow-none">
              <div className="flex flex-col md:flex-row items-center justify-between gap-md">
                <div>
                  <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider print:text-slate-600">Net Pay</p>
                  <p className="mt-1 text-4xl font-black">{formatCurrency(parseFloat(payslip.net_pay || '0'))}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-primary-100 text-sm print:text-slate-600">Transferred to registered bank account</p>
                  <p className="text-primary-200 text-xs mt-1 print:text-slate-500">Subject to standard processing times</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-md text-xs text-text-secondary print:text-slate-500">
              <p>This is a system generated payslip and does not require a signature.</p>
              <p className="mt-1">Generated on: {new Date().toLocaleDateString()}</p>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
