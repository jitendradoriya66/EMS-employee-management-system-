import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock3, AlertCircle, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { formatDate } from '@/utils/helpers'
import { useAuth } from '@/contexts/AuthContext'
import { submitLeaveRequest } from '@/utils/api'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { CircleCheck, CircleX } from 'lucide-react'

export const LeavePage: React.FC = () => {
  const { user } = useAuth()
  const { leaveRequests, approveLeave, rejectLeave } = useLeaveRequests()
  const isEmployee = (user?.role ?? 'employee') === 'employee'
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  })
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle')

  const myLeaveRequests = useMemo(() => {
    if (!isEmployee || !user?.name) return leaveRequests;
    return leaveRequests.filter(r => r.employeeName.toLowerCase() === user.name.toLowerCase());
  }, [isEmployee, user?.name, leaveRequests]);

  const leaveBalance = useMemo(() => {
    const totalAllowance = 20;
    const approvedDays = myLeaveRequests
      .filter(r => r.status === 'approved')
      .reduce((total, r) => {
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);
        const diffTime = end.getTime() - start.getTime();
        if (diffTime < 0) throw new Error("End date cannot be before start date");
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
      }, 0);
    return Math.max(0, totalAllowance - approvedDays);
  }, [myLeaveRequests]);

  const handleLeaveSubmit = async () => {
    try {
      setSubmissionState('submitting')
      await submitLeaveRequest({
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        reason: leaveForm.reason
      })
      setSubmissionState('submitted')
    } catch (error) {
}