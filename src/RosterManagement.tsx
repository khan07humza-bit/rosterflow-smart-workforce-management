import { useState } from 'react'
import { employees as initialEmployees, type Employee } from './data'

type ProcessRequirement = {
  id?: number | string
  name: string
  minimumStaff: number
}

type Leave = {
  employeeId: string
  startDate: string
  endDate: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

type RosterEntry = {
  date: string
  process: string
  required: number
  assigned: Employee[]
  shortage: number
  onLeave: number
}

const defaultRequirements: ProcessRequirement[] = [
  { name: 'Customer Support', minimumStaff: 5 },
  { name: 'Live Chat', minimumStaff: 3 },
  { name: 'Order Management', minimumStaff: 4 },
  { name: 'Quality Assurance', minimumStaff: 2 },
]

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) as T : fallback
  } catch {
    return fallback
  }
}

function getNextSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() + index)
    return date
  })
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function displayDate(date: Date) {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function RosterManagement() {
  const [roster, setRoster] = useState<RosterEntry[]>(() =>
    readStorage('roster-generated', [])
  )

  const [generated, setGenerated] = useState(
    () => readStorage<RosterEntry[]>('roster-generated', []).length > 0
  )

  const [generating, setGenerating] = useState(false)

  const generateRoster = () => {
    setGenerating(true)

    try {
      const employees = readStorage<Employee[]>(
        'roster-employees',
        initialEmployees
      )

      const requirements = readStorage<ProcessRequirement[]>(
        'roster-processes',
        defaultRequirements
      )

      const leaves = readStorage<Leave[]>('roster-leaves', [])

      const activeEmployees = employees.filter(
        employee => employee.status === 'Active'
      )

      if (activeEmployees.length === 0) {
        alert('No active employees found. Please add employees first.')
        setGenerating(false)
        return
      }

      if (requirements.length === 0) {
        alert('No process requirements found. Please configure processes first.')
        setGenerating(false)
        return
      }

      const days = getNextSevenDays()
      const newRoster: RosterEntry[] = []

      // Tracks how often each employee has been assigned.
      // Employees with fewer assignments get priority.
      const assignmentCount = new Map<string, number>()

      activeEmployees.forEach(employee => {
        assignmentCount.set(employee.id, 0)
      })

      days.forEach(date => {
        const dayName = date.toLocaleDateString('en-US', {
          weekday: 'long',
        })

        const currentDate = formatDate(date)
        const assignedToday = new Set<string>()

        requirements.forEach((requirement, processIndex) => {
          const required = Math.max(
            0,
            Math.floor(Number(requirement.minimumStaff) || 0)
          )

          const processEmployees = activeEmployees.filter(
            employee => employee.process === requirement.name
          )

          const onLeaveEmployees = processEmployees.filter(employee =>
            leaves.some(leave =>
              leave.employeeId === employee.id &&
              leave.status === 'Approved' &&
              currentDate >= leave.startDate &&
              currentDate <= leave.endDate
            )
          )

          const availableEmployees = processEmployees.filter(employee => {
            const hasWeeklyOff = employee.weeklyOff === dayName

            const hasApprovedLeave = leaves.some(leave =>
              leave.employeeId === employee.id &&
              leave.status === 'Approved' &&
              currentDate >= leave.startDate &&
              currentDate <= leave.endDate
            )

            const alreadyAssigned = assignedToday.has(employee.id)

            return (
              !hasWeeklyOff &&
              !hasApprovedLeave &&
              !alreadyAssigned
            )
          })

          // Fair rotation: employees with fewer previous assignments
          // are selected first.
          const sortedEmployees = [...availableEmployees].sort((a, b) => {
            const countDifference =
              (assignmentCount.get(a.id) || 0) -
              (assignmentCount.get(b.id) || 0)

            if (countDifference !== 0) {
              return countDifference
            }

            // Stable tie-breaker so selection changes across days/processes.
            const aIndex = activeEmployees.findIndex(emp => emp.id === a.id)
            const bIndex = activeEmployees.findIndex(emp => emp.id === b.id)

            const rotation = (date.getDate() + processIndex) %
              Math.max(activeEmployees.length, 1)

            return (
              (aIndex - rotation + activeEmployees.length) %
                activeEmployees.length -
              (bIndex - rotation + activeEmployees.length) %
                activeEmployees.length
            )
          })

          const assigned = sortedEmployees.slice(0, required)

          assigned.forEach(employee => {
            assignedToday.add(employee.id)

            assignmentCount.set(
              employee.id,
              (assignmentCount.get(employee.id) || 0) + 1
            )
          })

          newRoster.push({
            date: displayDate(date),
            process: requirement.name,
            required,
            assigned,
            shortage: Math.max(0, required - assigned.length),
            onLeave: onLeaveEmployees.length,
          })
        })
      })

      setRoster(newRoster)
      setGenerated(true)

      // Save the latest generated roster for other modules.
      localStorage.setItem(
        'roster-generated',
        JSON.stringify(newRoster)
      )
    } catch {
      alert('Unable to generate roster. Please check your saved data.')
    } finally {
      setGenerating(false)
    }
  }

  const totalShortages = roster.reduce(
    (total, entry) => total + entry.shortage,
    0
  )

  const totalAssigned = roster.reduce(
    (total, entry) => total + entry.assigned.length,
    0
  )

  const totalOnLeave = roster.reduce(
    (total, entry) => total + entry.onLeave,
    0
  )

  const totalRequired = roster.reduce(
    (total, entry) => total + entry.required,
    0
  )

  const coverage = totalRequired > 0
    ? Math.round((totalAssigned / totalRequired) * 100)
    : 0

  return (
    <div className="roster-management">
      <section className="panel roster-generator">
        <div className="panel-heading">
          <div>
            <h3>Automatic Roster Generator</h3>
            <p>
              Generate a seven-day employee schedule based on availability,
              approved leaves, weekly offs and staffing requirements.
            </p>
          </div>
          <span className="panel-date">Next 7 Days</span>
        </div>

        <div className="generator-info">
          <div>
            <strong>Fair Employee Rotation</strong>
            <p>Employees with fewer previous assignments get priority.</p>
          </div>

          <div>
            <strong>Weekly Off Check</strong>
            <p>Employees are not assigned on their weekly off.</p>
          </div>

          <div>
            <strong>Approved Leave Check</strong>
            <p>Approved leave dates are excluded automatically.</p>
          </div>

          <div>
            <strong>Staffing Requirements</strong>
            <p>Minimum staffing is read from Brands & Processes.</p>
          </div>
        </div>

        <button
          className="primary-button"
          onClick={generateRoster}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Weekly Roster'}
        </button>
      </section>

      {generated && (
        <>
          <section className="stats roster-stats">
            <div className="stat-card">
              <span>Total Assignments</span>
              <h2>{totalAssigned}</h2>
              <p>Employees scheduled</p>
            </div>

            <div className="stat-card">
              <span>Staffing Coverage</span>
              <h2>{coverage}%</h2>
              <p>Filled positions</p>
            </div>

            <div className="stat-card">
              <span>Staffing Shortages</span>
              <h2>{totalShortages}</h2>
              <p>Unfilled positions</p>
            </div>

            <div className="stat-card">
              <span>Employees on Leave</span>
              <h2>{totalOnLeave}</h2>
              <p>Approved leave exclusions</p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Generated Weekly Schedule</h3>
                <p>Process-wise employee allocation</p>
              </div>
              <span className="panel-date">7 Days</span>
            </div>

            <div className="table-wrapper">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Process</th>
                    <th>Required</th>
                    <th>Assigned</th>
                    <th>On Leave</th>
                    <th>Employee Names</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {roster.map((entry, index) => (
                    <tr key={`${entry.date}-${entry.process}-${index}`}>
                      <td>{entry.date}</td>
                      <td>{entry.process}</td>
                      <td>{entry.required}</td>
                      <td>{entry.assigned.length}</td>
                      <td>{entry.onLeave}</td>
                      <td>
                        {entry.assigned.length > 0
                          ? entry.assigned
                              .map(employee => employee.name)
                              .join(', ')
                          : 'No employees available'}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            entry.shortage === 0 ? 'covered' : 'shortage'
                          }`}
                        >
                          {entry.shortage === 0
                            ? 'Covered'
                            : `${entry.shortage} Short`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default RosterManagement