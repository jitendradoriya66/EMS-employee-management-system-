import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, Users, BriefcaseBusiness, TrendingUp, X, Network, Edit2, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useDepartments } from '@/hooks/useDepartments'
import { getDepartmentColor } from '@/utils/helpers'
import { Input } from '@/components/common/Input'
import { Alert } from '@/components/common/Alert'
import { AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { UnifiedLoader } from '@/components/common/UnifiedLoader'

export const DepartmentsPage: React.FC = () => {
  const { departments, loading, addDepartment, updateDepartment, deleteDepartment } = useDepartments()
  const [isAdding, setIsAdding] = React.useState(false)
  const [showOrgChart, setShowOrgChart] = React.useState(false)
  const [newDept, setNewDept] = React.useState({ name: '', description: '' })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [toast] = React.useState<string | null>(null)

  const [viewingDept, setViewingDept] = React.useState<any | null>(null)
  const [editingDept, setEditingDept] = React.useState<any | null>(null)
  const [deletingDept, setDeletingDept] = React.useState<any | null>(null)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = React.useState(false)

  const departmentStats = useMemo(() => {
    return departments.map(dept => ({
      id: dept.id,
      department: dept.name,
      description: dept.description || '',
      count: dept.headcount || 0,
      manager: dept.managerName || 'Department Lead',
      openRoles: Math.max(0, 5 - (dept.headcount || 0)),
    })).sort((left, right) => right.count - left.count)
  }, [departments])

  const totalEmployees = departmentStats.reduce((sum, item) => sum + item.count, 0)

  if (loading) {
    return <UnifiedLoader message="Loading departments..." />
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Admin workspace</p>
          <h1 className="section-title mt-xs">Departments</h1>
          <p className="section-subtitle mt-xs">A simple, enterprise-style department overview for people operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button variant="secondary" className="gap-sm" onClick={() => setShowOrgChart(true)}>
            <Network className="h-4 w-4" />
            View org chart
          </Button>
          <Button variant="primary" className="gap-sm" onClick={() => setIsAdding(true)}>
            <Building2 className="h-4 w-4" />
            Add department
          </Button>
        </div>
      </div>

      {toast && (
        <Alert variant="success" title="Notice" className="mb-md">
          {toast}
        </Alert>
      )}

      {isAdding && (
        <div className="card p-lg border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10 mb-lg">
          <h2 className="text-lg font-bold text-text-primary mb-md">Create New Department</h2>
          {error && <Alert variant="error" title="Error" className="mb-md">{error}</Alert>}
          <div className="flex flex-col sm:flex-row gap-md items-start">
            <div className="flex-1 w-full">
              <Input
                label="Department Name"
                placeholder="e.g. Engineering"
                value={newDept.name}
                onChange={e => setNewDept(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex-1 w-full">
              <Input
                label="Description"
                placeholder="Brief description"
                value={newDept.description}
                onChange={e => setNewDept(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-sm mt-auto pb-[2px]">
              <Button variant="secondary" onClick={() => { setIsAdding(false); setError(null); }}>Cancel</Button>
              <Button
                variant="primary"
                isLoading={submitting}
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    setError(null);
                    await addDepartment(newDept);
                    setIsAdding(false);
                    setNewDept({ name: '', description: '' });
                  } catch (err: any) {
                    setError(err.response?.data?.detail || 'Failed to create department');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-md md:grid-cols-4">
        {[
          { label: 'Departments', value: String(departmentStats.length), icon: Building2 },
          { label: 'Employees', value: String(totalEmployees), icon: Users },
          { label: 'Open roles', value: String(departmentStats.reduce((sum, item) => sum + item.openRoles, 0)), icon: BriefcaseBusiness },
          { label: 'Coverage', value: '98%', icon: TrendingUp },
        ].map(metric => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="card p-lg flex items-center justify-between gap-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{metric.label}</p>
                <p className="mt-sm text-2xl font-extrabold text-text-primary">{metric.value}</p>
              </div>
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )
        })}
      </div>

      <div className="grid gap-md lg:grid-cols-2 xl:grid-cols-3">
        {departmentStats.map((item, index) => (
          <motion.div
            key={item.department}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card p-lg"
          >
            <div className="flex items-start justify-between gap-md">
              <div>
                <span className={`inline-flex items-center gap-xs rounded-full px-sm py-xs text-xs font-semibold ${getDepartmentColor(item.department)}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item.department}
                </span>
                <h2 className="mt-md text-xl font-bold text-text-primary">{item.department} Team</h2>
                <p className="mt-xs text-sm text-text-secondary">Managed by {item.manager}</p>
              </div>
              <div className="flex flex-col items-end gap-sm">
                <div className="flex gap-xs">
                  <button
                    onClick={() => setViewingDept(item)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary hover:text-primary transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingDept({ id: item.id, name: item.department, description: item.description })}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary hover:text-primary transition-colors"
                    title="Edit Department"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingDept({ id: item.id, name: item.department })}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-text-secondary hover:text-rose-600 transition-colors"
                    title="Delete Department"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-lg grid grid-cols-2 gap-sm text-sm">
              <div className="rounded-2xl border border-border bg-background p-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Headcount</p>
                <p className="mt-xs text-2xl font-extrabold text-text-primary">{item.count}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Open roles</p>
                <p className="mt-xs text-2xl font-extrabold text-text-primary">{item.openRoles}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showOrgChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
            onClick={() => setShowOrgChart(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-shrink-0 flex items-center justify-between gap-md border-b border-border bg-card px-xl py-lg">
                <div className="flex items-center gap-md">
                  <div className="rounded-xl bg-primary-50 p-sm text-primary-700 dark:bg-primary-500/15 dark:text-cyan-200">
                    <Network className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">Organizational Chart</h3>
                    <p className="text-sm text-text-secondary">Company structure and department hierarchy</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrgChart(false)}
                  className="rounded-full border border-border bg-background p-sm text-text-secondary transition-colors hover:bg-card hover:text-text-primary"
                  aria-label="Close org chart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-hidden w-full h-[600px] bg-slate-50/50 dark:bg-slate-900/20 relative cursor-move">
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={2}
                  centerOnInit
                >
                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                    <div className="w-max min-w-full flex flex-col items-center p-xl">
                  
                  {/* CEO Node */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="z-10 rounded-2xl border-2 border-primary-500 bg-card p-md shadow-lg w-64 text-center relative"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-xl font-bold text-white shadow-inner mb-sm">
                        CEO
                      </div>
                      <h4 className="font-bold text-text-primary text-lg">Executive Board</h4>
                      <p className="text-xs font-semibold text-primary">Chief Executive Officer</p>
                    </motion.div>
                    
                    {/* Vertical Line from CEO */}
                    <div className="w-px h-10 bg-slate-300 dark:bg-slate-700"></div>
                  </div>

                  {/* Departments Container */}
                  <div className="relative pt-0">
                    {/* Horizontal Line connecting departments */}
                    <div className="absolute top-0 h-px bg-slate-300 dark:bg-slate-700" 
                         style={{ 
                           left: `calc(50% / ${Math.max(1, departmentStats.length)})`, 
                           right: `calc(50% / ${Math.max(1, departmentStats.length)})` 
                         }}></div>

                    <div className="flex justify-center gap-xl relative px-lg">
                      {departmentStats.map((dept, idx) => (
                        <motion.div
                          key={dept.department}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex flex-col items-center w-56 relative"
                        >
                          {/* Vertical line connecting horizontal bar to node */}
                          <div className="w-px h-8 bg-slate-300 dark:bg-slate-700 absolute top-0"></div>

                          <div className="z-10 w-full mt-8 rounded-xl border border-border bg-card p-md shadow-md text-center hover:shadow-lg transition-shadow relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-full h-1 ${getDepartmentColor(dept.department)}`}></div>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary mb-sm">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <h5 className="font-bold text-text-primary">{dept.department}</h5>
                            <p className="text-xs text-text-secondary mt-xs truncate px-sm">{dept.manager}</p>
                            <div className="mt-md inline-flex items-center gap-xs rounded-full bg-slate-100 dark:bg-slate-800 px-sm py-xs text-[10px] font-semibold text-text-secondary">
                              <Users className="h-3 w-3" />
                              {dept.count} Members
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  </div>
                </TransformComponent>
                </TransformWrapper>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* View Department Details Modal */}
        {viewingDept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
            onClick={() => setViewingDept(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card p-lg shadow-2xl flex flex-col text-left"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-md mb-md">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-sm">
                  <Building2 className="h-5 w-5 text-primary" />
                  {viewingDept.department} Details
                </h3>
                <button onClick={() => setViewingDept(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-text-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-md">
                <div className="rounded-2xl border border-border bg-background p-md">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Description</p>
                  <p className="mt-xs text-sm text-text-primary leading-relaxed">
                    {viewingDept.description || 'No description provided.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-md">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Department Manager</p>
                  <p className="mt-xs text-sm font-semibold text-text-primary">{viewingDept.manager}</p>
                </div>
                <div className="grid grid-cols-2 gap-sm">
                  <div className="rounded-2xl border border-border bg-background p-md text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Headcount</p>
                    <p className="mt-sm text-3xl font-black text-text-primary">{viewingDept.count}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-md text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Open Roles</p>
                    <p className="mt-sm text-3xl font-black text-text-primary">{viewingDept.openRoles}</p>
                  </div>
                </div>
              </div>

              <div className="mt-lg flex justify-end">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setViewingDept(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Department Modal */}
        {editingDept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
            onClick={() => { setEditingDept(null); setEditError(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card p-lg shadow-2xl flex flex-col text-left"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-md mb-md">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-sm">
                  <Edit2 className="h-5 w-5 text-primary" />
                  Edit Department
                </h3>
                <button onClick={() => { setEditingDept(null); setEditError(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-text-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editError && <Alert variant="error" title="Error" className="mb-md">{editError}</Alert>}

              <div className="space-y-md">
                <Input
                  label="Department Name"
                  placeholder="e.g. Engineering"
                  value={editingDept.name}
                  onChange={e => setEditingDept((prev: any) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  label="Description"
                  placeholder="Brief description"
                  value={editingDept.description}
                  onChange={e => setEditingDept((prev: any) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="mt-lg flex gap-sm justify-end">
                <Button variant="secondary" onClick={() => { setEditingDept(null); setEditError(null); }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isLoading={editSubmitting}
                  onClick={async () => {
                    try {
                      setEditSubmitting(true);
                      setEditError(null);
                      await updateDepartment(editingDept.id, {
                        name: editingDept.name,
                        description: editingDept.description
                      });
                      setEditingDept(null);
                    } catch (err: any) {
                      setEditError(err.response?.data?.detail || 'Failed to update department');
                    } finally {
                      setEditSubmitting(false);
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Department Modal */}
        {deletingDept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
            onClick={() => setDeletingDept(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card p-lg shadow-2xl flex flex-col text-left space-y-md"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-sm">
                  <Trash2 className="h-5 w-5 text-rose-600" />
                  Delete Department
                </h3>
                <p className="mt-sm text-sm text-text-secondary">
                  Are you sure you want to delete the department <strong>{deletingDept.name}</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-sm justify-end">
                <Button variant="secondary" onClick={() => setDeletingDept(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    try {
                      await deleteDepartment(deletingDept.id);
                      setDeletingDept(null);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
