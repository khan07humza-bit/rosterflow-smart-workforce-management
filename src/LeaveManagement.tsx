
import { useEffect, useState } from 'react'
import type { Employee } from './data'

type Leave = {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export default function LeaveManagement() {
  const [employees] = useState<Employee[]>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('roster-employees') || '[]'
      )
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })

  const [leaves, setLeaves] = useState<Leave[]>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('roster-leaves') || '[]'
      )
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })

  const [employeeId, setEmployeeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    localStorage.setItem('roster-leaves', JSON.stringify(leaves))
  }, [leaves])

  const hasOverlappingLeave = (
    selectedEmployeeId: string,
    selectedStart: string,
    selectedEnd: string,
    excludedId?: string
  ) => {
    return leaves.some(leave => {
      if (
        leave.employeeId !== selectedEmployeeId ||
        leave.id === excludedId ||
        !['Pending', 'Approved'].includes(leave.status)
      ) {
        return false
      }

      return (
        selectedStart <= leave.endDate &&
        selectedEnd >= leave.startDate
      )
    })
  }

  const addLeave = () => {
    setError('')
    setActionMessage('')

    const employee = employees.find(emp => emp.id === employeeId)

    if (!employee || !startDate || !endDate || !reason.trim()) {
      setError('Please fill all fields.')
      return
    }

    if (employee.status === 'Inactive') {
      setError('Leave request cannot be created for an inactive employee.')
      return
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.')
      return
    }

    if (
      hasOverlappingLeave(employee.id, startDate, endDate)
    ) {
      setError(
        'This employee already has a pending or approved leave during these dates.'
      )
      return
    }

    const newLeave: Leave = {
      id: `LEAVE-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      startDate,
      endDate,
      reason: reason.trim(),
      status: 'Pending',
    }

    setLeaves(previous => [...previous, newLeave])
    setEmployeeId('')
    setStartDate('')
    setEndDate('')
    setReason('')
    setError('')
    setActionMessage('Leave request added successfully.')
  }

  const updateStatus = (
    id: string,
    status: Leave['status']
  ) => {
    setError('')
    setActionMessage('')

    const selectedLeave = leaves.find(leave => leave.id === id)

    if (!selectedLeave) return

    if (status === 'Approved') {
      const overlap = hasOverlappingLeave(
        selectedLeave.employeeId,
        selectedLeave.startDate,
        selectedLeave.endDate,
        selectedLeave.id
      )

      if (overlap) {
        setActionMessage(
          'Cannot approve: another pending or approved leave overlaps these dates.'
        )
        return
      }
    }

    setLeaves(previous =>
      previous.map(leave =>
        leave.id === id ? { ...leave, status } : leave
      )
    )

    setActionMessage(`Leave request ${status.toLowerCase()} successfully.`)
  }

  const deleteLeave = (id: string) => {
    setLeaves(previous =>
      previous.filter(leave => leave.id !== id)
    )
    setActionMessage('Leave request deleted.')
    setError('')
  }

  const pending = leaves.filter(
    leave => leave.status === 'Pending'
  ).length

  const approved = leaves.filter(
    leave => leave.status === 'Approved'
  ).length

  const rejected = leaves.filter(
    leave => leave.status === 'Rejected'
  ).length

  return (
    <div className="module-page">
      <div className="page-heading">
        <div>
          <h2>Leave Management</h2>
          <p>Manage employee leave requests and approvals.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Requests</span>
          <h2>{leaves.length}</h2>
        </div>

        <div className="stat-card">
          <span>Pending</span>
          <h2>{pending}</h2>
        </div>

        <div className="stat-card">
          <span>Approved</span>
          <h2>{approved}</h2>
        </div>

        <div className="stat-card">
          <span>Rejected</span>
          <h2>{rejected}</h2>
        </div>
      </div>

      <div className="content-card">
        <h3>Add Leave Request</h3>

        <div className="leave-form">
          <select
            value={employeeId}
            onChange={event => setEmployeeId(event.target.value)}
          >
            <option value="">Select Employee</option>

            {employees.map(employee => (
              <option
                key={employee.id}
                value={employee.id}
                disabled={employee.status === 'Inactive'}
              >
                {employee.name} ({employee.id})
                {employee.status === 'Inactive' ? ' - Inactive' : ''}
              </option>
            ))}
          </select>

          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
          />

          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={event => setEndDate(event.target.value)}
          />

          <input
            type="text"
            placeholder="Reason for leave"
            value={reason}
            onChange={event => setReason(event.target.value)}
          />

          {error && (
            <p className="form-error">{error}</p>
          )}

          <button
            className="primary-btn"
            onClick={addLeave}
          >
            Add Leave Request
          </button>
        </div>
      </div>

      <div className="content-card">
        <h3>Leave Requests</h3>

        {actionMessage && (
          <p className="module-message">{actionMessage}</p>
        )}

        {leaves.length === 0 ? (
          <p>No leave requests added yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id}>
                    <td>{leave.employeeName}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.reason}</td>

                    <td>
                      <span
                        className={`status-badge ${leave.status.toLowerCase()}`}
                      >
                        {leave.status}
                      </span>
                    </td>

                    <td>
                      {leave.status === 'Pending' && (
                        <>
                          <button
                            className="action-btn"
                            onClick={() =>
                              updateStatus(leave.id, 'Approved')
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="action-btn reject-btn"
                            onClick={() =>
                              updateStatus(leave.id, 'Rejected')
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        className="action-btn reject-btn"
                        onClick={() => deleteLeave(leave.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
