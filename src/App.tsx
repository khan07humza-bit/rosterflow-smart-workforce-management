import { useEffect, useState, type FormEvent } from 'react'
import { employees as initialEmployees, type Employee } from './data'
import LeaveManagement from './LeaveManagement'
import BrandsProcesses from './BrandsProcesses'
import RosterManagement from './RosterManagement'
import ConflictDetection from './ConflictDetection'
import './App.css'

type Tab =
  | 'Dashboard'
  | 'Roster Management'
  | 'Employees'
  | 'Brands & Processes'
  | 'Leave Management'
  | 'Conflict Detection'

type ProcessRequirement = {
  id: string
  name: string
  minimumStaff: number
}

type RosterEntry = {
  date: string
  process: string
  required: number
  assigned: Employee[]
  shortage: number
  onLeave: number
}

const menuItems: Tab[] = [
  'Dashboard',
  'Roster Management',
  'Employees',
  'Brands & Processes',
  'Leave Management',
  'Conflict Detection',
]

const menuIcons: Record<Tab, string> = {
  Dashboard: '▦',
  'Roster Management': '▤',
  Employees: '♙',
  'Brands & Processes': '▣',
  'Leave Management': '▧',
  'Conflict Detection': '⚠',
}

const defaultProcesses: ProcessRequirement[] = [
  { id: '1', name: 'Customer Support', minimumStaff: 5 },
  { id: '2', name: 'Live Chat', minimumStaff: 3 },
  { id: '3', name: 'Order Management', minimumStaff: 4 },
  { id: '4', name: 'Quality Assurance', minimumStaff: 2 },
]

const defaultBrands = Array.from(
  { length: 12 },
  (_, index) => `Brand ${String.fromCharCode(65 + index)}`
)

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) as T : fallback
  } catch {
    return fallback
  }
}

function getTodayLabel() {
  const today = new Date()
  return `${String(today.getDate()).padStart(2, '0')} ${today.toLocaleDateString('en-US', {
    month: 'short',
  })} ${today.getFullYear()}`
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard')

  const [employeeList, setEmployeeList] = useState<Employee[]>(() =>
    readStorage('roster-employees', initialEmployees)
  )

  const [brands, setBrands] = useState<string[]>(() =>
    readStorage('roster-brands', defaultBrands)
  )

  const [processes, setProcesses] = useState<ProcessRequirement[]>(() =>
    readStorage('roster-processes', defaultProcesses)
  )

  const [roster, setRoster] = useState<RosterEntry[]>(() =>
    readStorage('roster-generated', [])
  )

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const emptyForm: Employee = {
    id: '',
    name: '',
    pod: 'Alpha',
    brand: brands[0] || 'Brand A',
    process: processes[0]?.name || 'Customer Support',
    weeklyOff: 'Sunday',
    status: 'Active',
  }

  const [formData, setFormData] = useState<Employee>(emptyForm)

  useEffect(() => {
    localStorage.setItem('roster-employees', JSON.stringify(employeeList))
  }, [employeeList])

  // Refresh saved configuration and roster when opening the dashboard or employees.
  useEffect(() => {
    if (activeTab === 'Dashboard' || activeTab === 'Employees') {
      setBrands(readStorage('roster-brands', defaultBrands))
      setProcesses(readStorage('roster-processes', defaultProcesses))
      setRoster(readStorage('roster-generated', []))
    }
  }, [activeTab])

  const activeEmployees = employeeList.filter(
    employee => employee.status === 'Active'
  )

  const filteredEmployees = employeeList.filter(employee =>
    `${employee.name} ${employee.id} ${employee.pod} ${employee.brand} ${employee.process}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const todayRoster = roster.filter(entry => entry.date === getTodayLabel())

  const totalRequired = roster.reduce(
    (total, entry) => total + entry.required,
    0
  )

  const totalAssigned = roster.reduce(
    (total, entry) => total + entry.assigned.length,
    0
  )

  const coverage = totalRequired > 0
    ? Math.round((totalAssigned / totalRequired) * 1000) / 10
    : 0

  const shortageEntries = roster.filter(entry => entry.shortage > 0)
  const activeConflicts = shortageEntries.length

  const openAddForm = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      id: `EMP${String(Date.now()).slice(-5)}`,
    })
    setShowForm(true)
  }

  const openEditForm = (employee: Employee) => {
    setEditingId(employee.id)
    setFormData({ ...employee })
    setShowForm(true)
  }

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter employee name.')
      return
    }

    const duplicateName = employeeList.some(
      employee =>
        employee.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        employee.id !== editingId
    )

    if (duplicateName) {
      alert('An employee with this name already exists.')
      return
    }

    if (editingId) {
      setEmployeeList(previous =>
        previous.map(employee =>
          employee.id === editingId ? formData : employee
        )
      )
    } else {
      setEmployeeList(previous => [...previous, formData])
    }

    setShowForm(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  const deleteEmployee = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployeeList(previous =>
        previous.filter(employee => employee.id !== id)
      )
    }
  }

  const goToTab = (tab: Tab) => {
    setActiveTab(tab)
    setShowForm(false)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>RosterFlow</h2>
            <span>Smart Workforce Management</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {menuItems.map(item => (
            <button
              key={item}
              className={`menu-item ${activeTab === item ? 'selected' : ''}`}
              onClick={() => goToTab(item)}
            >
              <span className="menu-icon">{menuIcons[item]}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Admin</strong>
            <span>Operations Manager</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>{activeTab}</h2>
            <p>Welcome back! Here's what's happening today.</p>
          </div>

          <div className="topbar-right">
            <span className="today-label">● System Online</span>
            <div className="profile-circle">A</div>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <>
            <section className="welcome">
              <div>
                <span className="welcome-tag">WORKFORCE OVERVIEW</span>
                <h1>Good morning, Manager! 👋</h1>
                <p>
                  Here's your workforce overview. Manage your teams,
                  monitor staffing and keep operations running smoothly.
                </p>
              </div>
              <div className="welcome-illustration">📊</div>
            </section>

            <section className="stats">
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Employees</span>
                  <span className="stat-icon blue">♙</span>
                </div>
                <h2>{employeeList.length}</h2>
                <p>{activeEmployees.length} active employees</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Brands</span>
                  <span className="stat-icon purple">▣</span>
                </div>
                <h2>{brands.length}</h2>
                <p>{processes.length} configured processes</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Staffing Coverage</span>
                  <span className="stat-icon green">✓</span>
                </div>
                <h2>{roster.length > 0 ? `${coverage}%` : '—'}</h2>
                <p>
                  {roster.length > 0
                    ? 'Based on generated roster'
                    : 'Generate a roster to calculate'}
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Staffing Shortages</span>
                  <span className="stat-icon orange">⚠</span>
                </div>
                <h2>{activeConflicts}</h2>
                <p>Roster entries requiring attention</p>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel schedule-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Today's Staffing Overview</h3>
                    <p>Process-wise workforce allocation</p>
                  </div>
                  <span className="panel-date">Today</span>
                </div>

                {todayRoster.length > 0 ? (
                  <div className="staffing-table">
                    <div className="staff-row staff-header">
                      <span>Process</span>
                      <span>Required</span>
                      <span>Assigned</span>
                      <span>Status</span>
                    </div>

                    {todayRoster.map((entry, index) => (
                      <div className="staff-row" key={`${entry.process}-${index}`}>
                        <span>{entry.process}</span>
                        <span>{entry.required}</span>
                        <span>{entry.assigned.length}</span>
                        <span>
                          <span className={`status-pill ${
                            entry.shortage === 0 ? 'covered' : 'shortage'
                          }`}>
                            {entry.shortage === 0 ? 'Covered' : 'Shortage'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="module-message">
                    No roster found for today. Generate a roster to view staffing.
                  </p>
                )}
              </div>

              <div className="panel conflicts-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Attention Needed</h3>
                    <p>Roster shortages and alerts</p>
                  </div>
                  <span className="alert-count">{shortageEntries.length}</span>
                </div>

                {shortageEntries.length > 0 ? (
                  shortageEntries.slice(0, 5).map((entry, index) => (
                    <div className="alert-item" key={`${entry.date}-${entry.process}-${index}`}>
                      <span className="alert-symbol red">!</span>
                      <div>
                        <strong>Understaffing detected</strong>
                        <p>
                          {entry.process} · {entry.shortage} employee(s) required · {entry.date}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert-item">
                    <span className="alert-symbol green">✓</span>
                    <div>
                      <strong>No staffing shortages</strong>
                      <p>
                        {roster.length > 0
                          ? 'All generated roster entries are covered.'
                          : 'Generate a roster to see staffing alerts.'}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  className="text-button"
                  onClick={() => goToTab('Conflict Detection')}
                >
                  View conflict detection →
                </button>
              </div>
            </section>

            <section className="panel roster-panel">
              <div className="panel-heading">
                <div>
                  <h3>Roster Planning</h3>
                  <p>Quick access to workforce management modules</p>
                </div>
              </div>

              <div className="planning-grid">
                {[
                  {
                    icon: '📅',
                    title: 'Generate Roster',
                    description: 'Create employee schedules',
                    tab: 'Roster Management' as Tab,
                  },
                  {
                    icon: '👥',
                    title: 'Manage Employees',
                    description: 'View and update employees',
                    tab: 'Employees' as Tab,
                  },
                  {
                    icon: '🏢',
                    title: 'Brands & Processes',
                    description: 'Configure staffing requirements',
                    tab: 'Brands & Processes' as Tab,
                  },
                ].map(card => (
                  <button
                    className="planning-card"
                    key={card.title}
                    onClick={() => goToTab(card.tab)}
                  >
                    <span>{card.icon}</span>
                    <strong>{card.title}</strong>
                    <p>{card.description}</p>
                    <b>Open module →</b>
                  </button>
                ))}
              </div>
            </section>

            <footer className="footer">
              RosterFlow · Smart Workforce Management System
              <span>Built for Datastraw Technologies</span>
            </footer>
          </>
        )}

        {activeTab === 'Employees' && (
          <section className="panel employee-panel">
            <div className="panel-heading">
              <div>
                <h3>Employee Directory</h3>
                <p>Manage your workforce records</p>
              </div>

              <button className="primary-button" onClick={openAddForm}>
                + Add Employee
              </button>
            </div>

            {showForm && (
              <form className="employee-form" onSubmit={handleSave}>
                <h3>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={formData.name}
                      onChange={event =>
                        setFormData({ ...formData, name: event.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    Employee ID
                    <input value={formData.id} disabled />
                  </label>

                  <label>
                    Pod
                    <input
                      value={formData.pod}
                      onChange={event =>
                        setFormData({ ...formData, pod: event.target.value })
                      }
                      placeholder="Enter pod name"
                      required
                    />
                  </label>

                  <label>
                    Brand
                    <select
                      value={formData.brand}
                      onChange={event =>
                        setFormData({ ...formData, brand: event.target.value })
                      }
                    >
                      {[...new Set([...brands, formData.brand])].map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Process
                    <select
                      value={formData.process}
                      onChange={event =>
                        setFormData({ ...formData, process: event.target.value })
                      }
                    >
                      {[...new Set([
                        ...processes.map(process => process.name),
                        formData.process,
                      ])].map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Weekly Off
                    <select
                      value={formData.weeklyOff}
                      onChange={event =>
                        setFormData({ ...formData, weeklyOff: event.target.value })
                      }
                    >
                      {[
                        'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                        'Friday', 'Saturday', 'Sunday',
                      ].map(day => (
                        <option key={day}>{day}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Status
                    <select
                      value={formData.status}
                      onChange={event =>
                        setFormData({
                          ...formData,
                          status: event.target.value as Employee['status'],
                        })
                      }
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </label>
                </div>

                <div className="form-actions">
                  <button className="primary-button" type="submit">
                    {editingId ? 'Update Employee' : 'Save Employee'}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <input
              className="employee-search"
              placeholder="Search employees..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />

            <div className="table-wrapper">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Pod</th>
                    <th>Brand</th>
                    <th>Process</th>
                    <th>Weekly Off</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.name}</td>
                      <td>{employee.pod}</td>
                      <td>{employee.brand}</td>
                      <td>{employee.process}</td>
                      <td>{employee.weeklyOff}</td>
                      <td>{employee.status}</td>
                      <td>
                        <button
                          className="action-edit"
                          onClick={() => openEditForm(employee)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-delete"
                          onClick={() => deleteEmployee(employee.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEmployees.length === 0 && (
                <p style={{ padding: 20 }}>No employees found.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'Roster Management' && <RosterManagement />}
        {activeTab === 'Brands & Processes' && <BrandsProcesses />}
        {activeTab === 'Leave Management' && <LeaveManagement />}
        {activeTab === 'Conflict Detection' && <ConflictDetection />}
      </main>
    </div>
  )
}

export default App