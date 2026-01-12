# PulseBoard — Requirements (MVP)

## Goal
PulseBoard is a multi-user platform for managing Projects, tracking Incidents, and documenting Decisions with historical traceability via audit logs.

## MVP Features
### Authentication
- Register, login, and "me" endpoint
- JWT access tokens (refresh token optional later)
- Passwords stored as bcrypt hashes

### Projects & Membership
- Create projects
- Invite users to a project
- Project-scoped roles: Owner / Member / Viewer
- Only members can see a project

### Incidents
- Create incidents under a project
- List incidents with pagination and filters (status, severity)
- View incident details
- Add incident updates (timeline)

### Decisions
- Create decisions under a project
- List decisions with pagination
- Update decisions by creating a new version (version history)

### Audit Logging
- Every write action creates an audit log entry:
  - who did it
  - what entity
  - what action
  - when
  - minimal metadata

## Non-goals (for now)
- Real-time collaboration (websockets)
- File uploads
- Complex notifications/email
- Multi-org billing
- Mobile app

## Roles & Permissions (Project Scope)
- Owner:
  - Invite/remove members
  - CRUD incidents/decisions
  - View audit logs
- Member:
  - CRUD incidents/decisions
  - View audit logs
- Viewer:
  - Read-only access to incidents/decisions
  - No audit log access (optional: allow read-only audit later)

## Definitions
- "Project member" means a user with a Membership record for that project.
- All project data is private to project members.
