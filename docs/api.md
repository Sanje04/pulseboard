# API (v1)

Base URL: /api/v1  
Auth: Bearer JWT in Authorization header

---

## Auth
### POST /auth/register
Body:
- name: string
- email: string
- password: string
Returns: { accessToken, user }

### POST /auth/login
Body:
- email: string
- password: string
Returns: { accessToken, user }

### GET /auth/me
Returns: { user }

---

## Projects
### POST /projects
Auth: required
Body:
- name: string
- description?: string
Returns: { project }

Side effects:
- creates membership with role OWNER for creator
- writes audit log

### GET /projects
Auth: required
Returns: list of projects user belongs to

### GET /projects/:projectId
Auth: required (must be member)
Returns: { project, role }

---

## Memberships
### POST /projects/:projectId/invite
Auth: required (OWNER)
Body:
- email: string
- role: OWNER | MEMBER | VIEWER
Returns: { membership }

Side effects:
- writes audit log

### GET /projects/:projectId/members
Auth: required (OWNER or MEMBER)
Returns: { members: [{ userId, name, email, role }] }

---

## Incidents
### POST /projects/:projectId/incidents
Auth: required (OWNER or MEMBER)
Body:
- title: string
- severity: SEV1|SEV2|SEV3|SEV4
- description: string
Returns: { incident }
Side effects:
- writes audit log

### GET /projects/:projectId/incidents
Auth: required (any member)
Query (optional):
- status=OPEN|MITIGATING|RESOLVED
- severity=SEV1|SEV2|SEV3|SEV4
- page=1
- limit=20
Returns: { items, page, limit, total }

### GET /incidents/:incidentId
Auth: required (member of incident.projectId)
Returns: { incident, updates: [...] }

### POST /incidents/:incidentId/updates
Auth: required (OWNER or MEMBER)
Body:
- message: string
- status?: OPEN|MITIGATING|RESOLVED
Returns: { update }
Side effects:
- may update incident.status
- writes audit log

---

## Decisions
### POST /projects/:projectId/decisions
Auth: required (OWNER or MEMBER)
Body:
- title: string
- tags?: string[]
- context: string
- decision: string
- consequences: string
Returns: { decision, version }

Side effects:
- creates decision + version 1
- writes audit log

### GET /projects/:projectId/decisions
Auth: required (any member)
Query:
- page=1
- limit=20
Returns: { items, page, limit, total }

### GET /decisions/:decisionId
Auth: required (member)
Returns: { decision, latestVersion }

### GET /decisions/:decisionId/versions
Auth: required (member)
Returns: { versions: [...] }

### PUT /decisions/:decisionId
Auth: required (OWNER or MEMBER)
Body:
- title?: string
- tags?: string[]
- context: string
- decision: string
- consequences: string
Returns: { version }

Side effects:
- creates new decisionVersion (latestVersion + 1)
- updates decisions.latestVersion
- writes audit log

---

## Audit Logs
### GET /projects/:projectId/audit
Auth: required (OWNER or MEMBER)
Query:
- page=1
- limit=50
Returns: { items, page, limit, total }
