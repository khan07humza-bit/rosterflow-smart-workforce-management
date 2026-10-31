
import { useEffect, useState } from 'react'

type Process = {
  id: number
  name: string
  minimumStaff: number
}

const defaultBrands = [
  'Brand A', 'Brand B', 'Brand C', 'Brand D',
  'Brand E', 'Brand F', 'Brand G', 'Brand H',
  'Brand I', 'Brand J', 'Brand K', 'Brand L',
]

const defaultProcesses: Process[] = [
  { id: 1, name: 'Customer Support', minimumStaff: 5 },
  { id: 2, name: 'Live Chat', minimumStaff: 3 },
  { id: 3, name: 'Order Management', minimumStaff: 4 },
  { id: 4, name: 'Quality Assurance', minimumStaff: 2 },
]

export default function BrandsProcesses() {
  const [brands, setBrands] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('roster-brands') || 'null') || defaultBrands
    } catch {
      return defaultBrands
    }
  })

  const [processes, setProcesses] = useState<Process[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('roster-processes') || 'null') || defaultProcesses
    } catch {
      return defaultProcesses
    }
  })

  const [brandName, setBrandName] = useState('')
  const [processName, setProcessName] = useState('')
  const [minimumStaff, setMinimumStaff] = useState(3)

  useEffect(() => {
    localStorage.setItem('roster-brands', JSON.stringify(brands))
  }, [brands])

  useEffect(() => {
    localStorage.setItem('roster-processes', JSON.stringify(processes))
  }, [processes])

  function addBrand(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = brandName.trim()

    if (!name) return
    if (brands.some(b => b.toLowerCase() === name.toLowerCase())) {
      alert('This brand already exists.')
      return
    }

    setBrands(previous => [...previous, name])
    setBrandName('')
  }

  function addProcess(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = processName.trim()

    if (!name) return
    if (processes.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      alert('This process already exists.')
      return
    }

    setProcesses(previous => [
      ...previous,
      { id: Date.now(), name, minimumStaff },
    ])
    setProcessName('')
    setMinimumStaff(3)
  }

  function deleteBrand(name: string) {
    if (!window.confirm(`Delete ${name} from brand settings?`)) return
    setBrands(previous => previous.filter(b => b !== name))
  }

  function deleteProcess(id: number) {
    if (!window.confirm('Delete this process from settings?')) return
    setProcesses(previous => previous.filter(p => p.id !== id))
  }

  function updateMinimum(id: number, value: number) {
    setProcesses(previous =>
      previous.map(p =>
        p.id === id ? { ...p, minimumStaff: value } : p
      )
    )
  }

  return (
    <div style={{ marginTop: 25 }}>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-top">Total brands</div>
          <h2>{brands.length}</h2>
          <p>Configured brands</p>
        </div>
        <div className="stat-card">
          <div className="stat-top">Total processes</div>
          <h2>{processes.length}</h2>
          <p>Configured processes</p>
        </div>
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Brand Management</h3>
              <p>Add and manage business brands</p>
            </div>
          </div>

          <form onSubmit={addBrand} className="config-form">
            <input
              required
              placeholder="Enter brand name"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
            />
            <button className="primary-button" type="submit">
              + Add Brand
            </button>
          </form>

          <div className="config-list">
            {brands.map(brand => (
              <div className="config-row" key={brand}>
                <span>{brand}</span>
                <button className="action-delete" onClick={() => deleteBrand(brand)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Process Management</h3>
              <p>Configure processes and staffing requirements</p>
            </div>
          </div>

          <form onSubmit={addProcess} className="process-form">
            <input
              required
              placeholder="Process name"
              value={processName}
              onChange={e => setProcessName(e.target.value)}
            />

            <label>
              Minimum staff
              <input
                type="number"
                min="1"
                max="100"
                value={minimumStaff}
                onChange={e => setMinimumStaff(Math.max(1, Number(e.target.value)))}
              />
            </label>

            <button className="primary-button" type="submit">
              + Add Process
            </button>
          </form>

          <div className="config-list">
            {processes.map(process => (
              <div className="process-row" key={process.id}>
                <div>
                  <strong>{process.name}</strong>
                  <p>Minimum staffing requirement</p>
                </div>
                <input
                  aria-label={`Minimum staff for ${process.name}`}
                  type="number"
                  min="1"
                  max="100"
                  value={process.minimumStaff}
                  onChange={e => updateMinimum(process.id, Math.max(1, Number(e.target.value)))}
                />
                <button className="action-delete" onClick={() => deleteProcess(process.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
