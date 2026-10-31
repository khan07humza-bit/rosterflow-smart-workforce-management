
import { useState } from 'react'
import type { Employee } from './data'

type RosterEntry = {
  date: string
  process: string
  required: number
  assigned: Employee[]
  shortage: number
  onLeave: number
}

type Leave = {
  employeeId: string
  startDate: string
  endDate: string
  status: string
}

type Conflict = {
  id: string
  type: string
  severity: 'Critical' | 'Warning'
  date: string
  employee: string
  description: string
}

function parseRosterDate(value: string): Date | null {
  const parsed = new Date(value)

  if (!Number.isNaN(parsed.getTime())) {
    return new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    )
  }

  const parts = value.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)

  if (!parts) return null

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const month = months.findIndex(
    item => item.toLowerCase() === parts[2].toLowerCase()
  )

  if (month === -1) return null

  return new Date(Number(parts[3]), month, Number(parts[1]))
}

function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function ConflictDetection() {
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [checked, setChecked] = useState(false)

  const validateRoster = () => {
    const found: Conflict[] = []

    try {
      const savedRoster = localStorage.getItem('roster-generated')
      const savedLeaves = localStorage.getItem('roster-leaves')

      const roster: RosterEntry[] = savedRoster
        ? JSON.parse(savedRoster)
        : []

      const leaves: Leave[] = savedLeaves
        ? JSON.parse(savedLeaves)
        : []

      if (!Array.isArray(roster) || !Array.isArray(leaves)) {
        throw new Error('Invalid saved data')
      }

      if (roster.length === 0) {
        setConflicts([{
          id: 'no-roster',
          type: 'Roster Missing',
          severity: 'Warning',
          date: '-',
          employee: '-',
          description: 'Generate a weekly roster before running conflict validation.',
        }])
        setChecked(true)
        return
      }

      const assignments = new Map<string, string[]>()

      roster.forEach((entry, index) => {
        const date = parseRosterDate(entry.date)

        if (!date) {
          found.push({
            id: `invalid-date-${index}`,
            type: 'Invalid Roster Date',
            severity: 'Critical',
            date: entry.date || '-',
            employee: entry.process || '-',
            description: 'The roster contains an invalid date.',
          })
          return
        }

        if (!Array.isArray(entry.assigned)) {
          found.push({
            id: `invalid-assignment-${index}`,
            type: 'Invalid Assignment Data',
            severity: 'Critical',
            date: entry.date,
            employee: entry.process,
            description: 'Unable to validate employee assignments for this process.',
          })
          return
        }

        if (entry.shortage > 0) {
          found.push({
            id: `shortage-${index}`,
            type: 'Insufficient Staffing',
            severity: 'Critical',
            date: entry.date,
            employee: entry.process,
            description: `${entry.shortage} additional employee(s) required. Only ${entry.assigned.length} of ${entry.required} positions are filled.`,
          })
        }

        if (entry.assigned.length < entry.required && entry.shortage <= 0) {
          found.push({
            id: `coverage-${index}`,
            type: 'Staffing Mismatch',
            severity: 'Warning',
            date: entry.date,
            employee: entry.process,
            description: 'Assigned employee count does not meet the required staffing level.',
          })
        }

        entry.assigned.forEach(employee => {
          const assignmentKey = `${dateToKey(date)}-${employee.id}`
          const previousProcesses = assignments.get(assignmentKey) || []

          if (previousProcesses.length > 0) {
            found.push({
              id: `duplicate-${index}-${employee.id}`,
              type: 'Overlapping Assignment',
              severity: 'Critical',
              date: entry.date,
              employee: employee.name,
              description: `Employee is assigned to multiple processes: ${[...previousProcesses, entry.process].join(', ')}.`,
            })
          }

          assignments.set(assignmentKey, [
            ...previousProcesses,
            entry.process,
          ])

          const dayName = date.toLocaleDateString('en-US', {
            weekday: 'long',
          })

          if (employee.weeklyOff?.toLowerCase() === dayName.toLowerCase()) {
            found.push({
              id: `weekly-${index}-${employee.id}`,
              type: 'Weekly Off Conflict',
              severity: 'Critical',
              date: entry.date,
              employee: employee.name,
              description: `Employee is scheduled on their weekly off (${dayName}).`,
            })
          }

          if (employee.status === 'Inactive') {
            found.push({
              id: `inactive-${index}-${employee.id}`,
              type: 'Inactive Employee Assignment',
              severity: 'Critical',
              date: entry.date,
              employee: employee.name,
              description: 'An inactive employee has been assigned to this process.',
            })
          }

          const hasLeave = leaves.some(leave => {
            if (
              leave.employeeId !== employee.id ||
              leave.status !== 'Approved'
            ) {
              return false
            }

            const start = new Date(`${leave.startDate}T00:00:00`)
            const end = new Date(`${leave.endDate}T00:00:00`)

            if (
              Number.isNaN(start.getTime()) ||
              Number.isNaN(end.getTime())
            ) {
              return false
            }

            return date >= start && date <= end
          })

          if (hasLeave) {
            found.push({
              id: `leave-${index}-${employee.id}`,
              type: 'Approved Leave Conflict',
              severity: 'Critical',
              date: entry.date,
              employee: employee.name,
              description: 'Employee is scheduled during approved leave.',
            })
          }
        })
      })

      setConflicts(found)
      setChecked(true)
    } catch {
      setConflicts([{
        id: 'validation-error',
        type: 'Validation Error',
        severity: 'Critical',
        date: '-',
        employee: '-',
        description: 'Unable to read saved roster data. Please check your saved data and generate the roster again.',
      }])
      setChecked(true)
    }
  }

  const criticalCount = conflicts.filter(
    item => item.severity === 'Critical'
  ).length

  const warningCount = conflicts.filter(
    item => item.severity === 'Warning'
  ).length

  return (
    <div className="roster-management">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Roster Conflict Detection</h3>
            <p>
              Validate employee schedules, staffing levels, weekly offs
              and approved leaves.
            </p>
          </div>

          <button className="primary-button" onClick={validateRoster}>
            Run Validation
          </button>
        </div>

        <div className="stats roster-stats">
          <div className="stat-card">
            <span>Total Conflicts</span>
            <h2>{conflicts.length}</h2>
            <p>Detected issues</p>
          </div>

          <div className="stat-card">
            <span>Critical Conflicts</span>
            <h2>{criticalCount}</h2>
            <p>Require immediate attention</p>
          </div>

          <div className="stat-card">
            <span>Warnings</span>
            <h2>{warningCount}</h2>
            <p>Require review</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Validation Results</h3>
            <p>
              {checked
                ? `${conflicts.length} issue(s) found during validation.`
                : 'Run validation to check the latest generated roster.'}
            </p>
          </div>
        </div>

        {!checked && (
          <p className="module-message">
            Click Run Validation to analyse your generated roster.
          </p>
        )}

        {checked && conflicts.length === 0 && (
          <div className="alert-item">
            <span className="alert-symbol green">✓</span>
            <div>
              <strong>No conflicts detected</strong>
              <p>Your generated roster passed all current validation checks.</p>
            </div>
          </div>
        )}

        {checked && conflicts.length > 0 && (
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Severity</th>
                  <th>Date</th>
                  <th>Employee / Process</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {conflicts.map(conflict => (
                  <tr key={conflict.id}>
                    <td>{conflict.type}</td>
                    <td>
                      <span className={`status-pill ${
                        conflict.severity === 'Critical'
                          ? 'shortage'
                          : 'covered'
                      }`}>
                        {conflict.severity}
                      </span>
                    </td>
                    <td>{conflict.date}</td>
                    <td>{conflict.employee}</td>
                    <td>{conflict.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default ConflictDetection
