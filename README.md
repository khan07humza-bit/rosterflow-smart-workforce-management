
# RosterFlow
### Smart Workforce Management System

RosterFlow is a browser-based workforce management application designed to help operations managers manage employees, configure processes, handle leave requests, generate weekly rosters, and identify scheduling conflicts.

The application uses React, TypeScript, and Vite. It is designed around configurable staffing requirements, employee availability, approved leaves, weekly offs, and fair employee rotation.

---

## Features

### 1. Dashboard
- Overview of workforce and roster information.
- Summary of staffing and scheduling activity.
- Quick access to management modules.

### 2. Employee Management
- Manage employee records.
- Support multiple employees, brands, processes, and pods.
- Track employee status and weekly offs.
- Store employee information locally.

### 3. Brands & Processes
- Configure brands and operational processes.
- Set minimum staffing requirements for processes.
- Add and manage process configurations.

### 4. Leave Management
- Create employee leave requests.
- Track Pending, Approved, and Rejected requests.
- Approve or reject pending requests.
- Prevent overlapping pending or approved leave requests.
- Preserve leave records using browser local storage.

### 5. Automatic Roster Generation
- Generate a schedule for the next seven days.
- Exclude employees on approved leave.
- Exclude employees on their weekly off.
- Prevent an employee from being assigned to multiple processes on the same day.
- Use fair rotation by prioritising employees with fewer previous assignments.
- Display staffing coverage and shortages.

### 6. Conflict Detection
- Detect insufficient staffing.
- Detect overlapping process assignments.
- Detect weekly-off scheduling conflicts.
- Detect approved-leave conflicts.
- Detect assignments given to inactive employees.
- Display issues with severity levels.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Vite | Development server and build tool |
| CSS | Application styling |
| Browser Local Storage | Local data persistence |
| Git & GitHub | Version control |

---

## Project Structure

```text
datastraw-fresh/
├── public/
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── data.ts
│   ├── RosterManagement.tsx
│   ├── LeaveManagement.tsx
│   ├── ConflictDetection.tsx
│   ├── BrandsProcesses.tsx
│   └── main.tsx
├── index.html
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

Install the following tools:

- Node.js
- npm
- Git
- Visual Studio Code

### Installation

1. Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

2. Open the project folder:

```bash
cd datastraw-fresh
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the local URL displayed in the terminal, usually:

```text
http://localhost:5173/
```

### Production Build

Run the following command to create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Data Model and Relationships

RosterFlow uses the following main entities:

- **Employee:** Stores employee ID, name, pod, brand, process, weekly off, and employment status.
- **Brand:** Represents a business brand or operational unit.
- **Process:** Represents work such as Customer Support, Live Chat, Order Management, and Quality Assurance. It includes a minimum staffing requirement.
- **Leave:** Stores employee ID, leave dates, reason, and approval status.
- **Roster Entry:** Stores the date, process, required staffing, assigned employees, shortage, and employees on leave.

An employee belongs to an assigned brand and process and can be associated with a pod. Leave records are linked to employees through their employee IDs. Roster entries connect employees to processes on specific dates.

---

## Scheduling Approach and Constraints

Roster generation follows a deterministic, rule-based approach.

1. Read active employees, process requirements, and leave records.
2. Generate the next seven calendar dates.
3. Identify employees whose process matches the current staffing requirement.
4. Exclude employees with an approved leave covering that date.
5. Exclude employees whose weekly off matches that day.
6. Exclude employees already assigned to another process on the same date.
7. Sort available employees by their previous assignment count.
8. Assign employees until the minimum staffing requirement is reached or no eligible employees remain.
9. Calculate staffing shortages and save the generated roster.

### Hard Constraints

- Inactive employees cannot be selected by the generator.
- Employees cannot be assigned during approved leave.
- Employees cannot be scheduled on their weekly off.
- An employee cannot be assigned to multiple processes on the same day.
- Staffing requirements must be respected where enough eligible employees are available.

### Preferences

- Employees with fewer previous assignments receive priority.
- A stable rotation rule helps vary assignments across days.

If there are not enough eligible employees, the system reports a staffing shortage instead of silently assigning unavailable employees.

---

## Assessment Reasoning Questions

### 1. What are the main entities and how are they related?

The main entities are Employees, Brands, Processes, Leaves, and Roster Entries.

Employees are associated with a brand, process, and pod. Leave records reference employees through employee IDs. Roster entries connect employees to processes and dates. Process configurations define the minimum staffing requirement.

### 2. How does the roster generation logic work?

The system first loads active employees, process requirements, and approved leaves. It then checks weekly offs and leave dates for each day. Eligible employees are sorted by their previous assignment count, and employees with fewer assignments are prioritised.

The generator also prevents duplicate assignments across processes on the same day. If staffing requirements cannot be met, it records the shortage.

### 3. How would you handle brands with single versus multiple resources?

For a single-resource brand, the roster can be generated using its assigned employees and process requirements.

For a multi-resource brand, employees can be grouped by their brand and process, with separate staffing requirements for each operational unit.

The current implementation supports configurable brands and processes. Brand-specific calendars and independent brand-level staffing rules would be a future enhancement.

### 4. What happens when an employee becomes unavailable?

The generator checks approved leave dates and weekly offs before assigning employees. Unavailable employees are excluded from the schedule.

If the remaining eligible employees are insufficient, the system reports the staffing shortage for that process and date.

### 5. How are conflicts and understaffing handled?

The Conflict Detection module checks staffing shortages, duplicate assignments, weekly-off conflicts, approved-leave conflicts, and inactive employee assignments.

Critical issues are displayed separately from warnings so the operations manager can identify issues requiring immediate attention.

### 6. What should be automated and what should remain under human control?

Routine scheduling, availability checks, staffing calculations, and conflict detection can be automated.

Managers should retain control over leave approvals, staffing decisions, employee changes, and exceptional scheduling situations. Automation should support operational decisions rather than replace human judgement.

### 7. How would the system scale if the team doubled?

The current application uses browser local storage and is suitable as a prototype.

For a larger workforce, I would introduce a central database, backend APIs, authentication, role-based access, and server-side scheduling. I would also optimise employee availability queries and use background processing for larger roster-generation tasks.

### 8. What would you improve next?

My next improvements would include:

- Database integration and secure authentication.
- Brand-specific operating calendars and public holiday rules.
- Manual roster editing with automatic revalidation.
- Employee availability and shift preference management.
- Pod-wise, brand-wise, and employee-wise roster views.
- Exporting rosters to Excel and PDF.
- Better scheduling optimisation for larger teams.
- Audit logs for roster and leave changes.

---

## Assumptions and Current Limitations

- The application uses fictional employee data for demonstration.
- Browser local storage is used for persistence in the current prototype.
- The roster generator creates a seven-day schedule.
- Staffing requirements are configured at the process level.
- Approved leave and weekly-off checks are treated as hard scheduling constraints.
- The current generator uses fair rotation but does not implement advanced mathematical optimisation.
- Brand-specific calendars, public holiday rules, shift preferences, and backend multi-user synchronisation are not yet implemented.
- Conflict detection validates the generated roster; it does not automatically repair conflicts.

---

## Future Scope

RosterFlow can be extended into a full workforce scheduling platform with centralised data storage, advanced scheduling optimisation, configurable operating calendars, role-based access, reporting, and deployment for multiple operations teams.

---

## Author

Developed as an AI + Tech Intern assessment project for Datastraw Technologies.
