Collecting workspace information# PulseBoard Backend

A TypeScript/Express.js backend for an incident management platform with project-based access control, audit logging, and timeline tracking.

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   ├── db.ts              # MongoDB connection setup
│   │   └── env.ts             # Environment variable configuration
│   ├── controllers/
│   │   ├── auth.controller.ts          # Authentication endpoints
│   │   ├── project.controller.ts       # Project management
│   │   ├── incident.controller.ts      # Incident CRUD operations
│   │   ├── incidentUpdate.controller.ts # Timeline & status changes
│   │   └── audit.controller.ts         # Audit log queries
│   ├── middleware/
│   │   ├── requireAuth.ts              # JWT authentication
│   │   └── requireProjectRole.ts       # Role-based access control
│   ├── models/
│   │   ├── user.ts            # User schema
│   │   ├── project.ts         # Project schema
│   │   ├── membership.ts      # User-project relationships
│   │   ├── incident.ts        # Incident schema
│   │   ├── incidentUpdate.ts  # Timeline entries
│   │   └── auditLog.ts        # Audit trail
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── project.routes.ts
│   │   ├── incident.routes.ts
│   │   ├── incidentUpdate.routes.ts
│   │   └── audit.routes.ts
│   └── utils/
│       ├── hash.ts            # Password hashing (bcrypt)
│       └── jwt.ts             # JWT token operations
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

## 📂 Directory Breakdown

### `/config`
- **db.ts**: Mongoose connection to MongoDB
- **env.ts**: Loads and validates environment variables (PORT, MONGO_URI, JWT_SECRET)

### `/controllers`
Business logic for all API endpoints:
- **auth.controller.ts**: User registration, login, and profile
- **project.controller.ts**: Create projects, list user projects, invite members
- **incident.controller.ts**: Create, read, update incidents with field-level tracking
- **incidentUpdate.controller.ts**: Add comments, change status, fetch timeline
- **audit.controller.ts**: Query audit logs for compliance/debugging

### `/middleware`
- **requireAuth.ts**: Validates JWT tokens, attaches `userId` to requests
- **requireProjectRole.ts**: Enforces role-based permissions (OWNER > MEMBER > VIEWER)

### `/models`
Mongoose schemas with TypeScript interfaces:
- **user.ts**: User accounts with hashed passwords
- **project.ts**: Projects with creator reference
- **membership.ts**: Many-to-many relationship (userId ↔ projectId + role)
- **incident.ts**: Incidents with severity, status, soft deletes
- **incidentUpdate.ts**: Timeline entries (comments, field changes)
- **auditLog.ts**: Immutable audit trail for compliance

### `/routes`
Express route definitions mapping HTTP endpoints to controllers

### `/utils`
- **hash.ts**: bcrypt password hashing and verification
- **jwt.ts**: JWT signing and verification

## 🔐 Authentication & Authorization

### Authentication Flow
1. User registers or logs in → receives JWT token
2. Client includes token in `Authorization: Bearer <token>` header
3. `requireAuth` middleware validates token and attaches `userId` to request

### Role-Based Access Control
Three roles with hierarchical permissions:
- **OWNER**: Full control (create, update, delete, invite members)
- **MEMBER**: Can create/update incidents, add comments
- **VIEWER**: Read-only access to incidents and timelines

The `requireProjectRole` middleware checks `Membership` records to enforce permissions.

## 🌐 API Endpoints

### Authentication
```http
POST /api/v1/auth/register
Body: { name, email, password }
Response: { user: { id, name, email } }

POST /api/v1/auth/login
Body: { email, password }
Response: { user: { id, name, email }, accessToken }

GET /api/v1/auth/me
Headers: Authorization: Bearer <token>
Response: { user: { id, name, email } }
```

### Projects
```http
POST /api/v1/projects
Headers: Authorization: Bearer <token>
Body: { name, description? }
Response: { project: { id, name, description, createdBy, createdAt } }

GET /api/v1/projects
Headers: Authorization: Bearer <token>
Response: { items: [{ id, name, description, role }] }

POST /api/v1/projects/:projectId/invite
Headers: Authorization: Bearer <token>
Body: { email, role? }
Requires: OWNER role
Response: { membership: { id, projectId, userId, role } }
```

### Incidents
```http
POST /api/v1/projects/:projectId/incidents
Headers: Authorization: Bearer <token>
Body: { title, description?, severity: "SEV1"|"SEV2"|"SEV3"|"SEV4" }
Requires: MEMBER role
Response: { incident: { id, title, description, severity, status, ... } }

GET /api/v1/projects/:projectId/incidents
Headers: Authorization: Bearer <token>
Query: ?status=OPEN|MITIGATING|RESOLVED
Requires: VIEWER role
Response: { incidents: [...] }

GET /api/v1/projects/:projectId/incidents/:incidentId
Headers: Authorization: Bearer <token>
Requires: VIEWER role
Response: { incident: { ... } }

PATCH /api/v1/projects/:projectId/incidents/:incidentId
Headers: Authorization: Bearer <token>
Body: { title?, description?, severity? }
Requires: MEMBER role
Response: { incident: { ... }, updates: [...] }
Note: Stores description length changes (not full text) to prevent DB bloat
```

### Incident Timeline
```http
POST /api/v1/projects/:projectId/incidents/:incidentId/comments
Headers: Authorization: Bearer <token>
Body: { message }
Requires: MEMBER role
Response: { update: { id, type: "COMMENT", message, createdBy, createdAt } }

PATCH /api/v1/projects/:projectId/incidents/:incidentId/status
Headers: Authorization: Bearer <token>
Body: { status: "OPEN"|"MITIGATING"|"RESOLVED", message? }
Requires: MEMBER role
Response: { incident: { ... }, update: { type: "STATUS_CHANGE", from, to, ... } }

GET /api/v1/projects/:projectId/incidents/:incidentId/timeline
Headers: Authorization: Bearer <token>
Requires: VIEWER role
Response: { items: [{ id, type, message, from?, to?, createdBy, createdAt }] }
```

### Audit Logs
```http
GET /api/v1/projects/:projectId/audit
Headers: Authorization: Bearer <token>
Query: ?limit=50 (default, max 200)
Requires: VIEWER role
Response: { items: [{ id, event, actorId, entityType, entityId, metadata, createdAt }] }
```

## 🗄️ Data Models

### User
- `name`, `email`, `passwordHash`
- Email is unique and indexed

### Project
- `name`, `description`, `createdBy`
- Linked to creator via `User` reference

### Membership
- `projectId`, `userId`, `role` (OWNER | MEMBER | VIEWER)
- Unique compound index on `(projectId, userId)`

### Incident
- `projectId`, `title`, `description`, `severity`, `status`
- `createdBy`, `deletedAt` (soft delete)
- Indexed on `projectId + createdAt`, `projectId + status + createdAt`

### IncidentUpdate
- `projectId`, `incidentId`, `type`, `message`, `from`, `to`, `createdBy`
- Types: COMMENT, STATUS_CHANGE, SEVERITY_CHANGE, TITLE_CHANGE, DESCRIPTION_CHANGE
- **Description changes**: Stores character lengths in `from`/`to`, preview in `message` (max 120 chars)

### AuditLog
- `projectId`, `actorId`, `event`, `entityType`, `entityId`, `metadata`
- Immutable audit trail for compliance
- Events: INCIDENT_CREATED, INCIDENT_COMMENT_ADDED, INCIDENT_STATUS_CHANGED, etc.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally or remote instance

### Installation
```bash
npm install
```

### Environment Setup
Create a .env file:
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pulseboard
JWT_SECRET=your-secret-key-change-in-production
```

### Development
```bash
npm run dev
```

### Build & Production
```bash
npm run build
npm start
```

## 🔍 Key Features

### 1. **Field-Level Change Tracking**
When updating incidents via `updateIncidentInProject`:
- Diffs old vs new values for `title`, `description`, `severity`
- Creates separate `IncidentUpdate` entries for each changed field
- Stores description **length changes** (not full text) to prevent timeline bloat

### 2. **Dual Logging System**
- **Timeline** (`IncidentUpdate`): User-facing activity feed per incident
- **Audit Log** (`AuditLog`): System-wide compliance trail with metadata

### 3. **Role-Based Access**
- Hierarchical permissions enforced by `requireProjectRole`
- OWNER ≥ MEMBER ≥ VIEWER

### 4. **Soft Deletes**
- `Incident` model has `deletedAt` field
- Queries filter `deletedAt: null` to exclude deleted records

## 📊 Database Indexes

Optimized for common queries:
- **User**: `email` (unique)
- **Membership**: `(projectId, userId)` (unique), `userId`
- **Incident**: `projectId + createdAt`, `projectId + status + createdAt`
- **IncidentUpdate**: `incidentId + createdAt`
- **AuditLog**: `projectId + createdAt`, `entityId`

## 🛡️ Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens expire in 7 days
- Route protection via `requireAuth` + `requireProjectRole`
- Input validation on all endpoints
- Normalized email addresses (lowercase, trimmed)

## 📝 Example Usage Flow

1. **Register** → `POST /api/v1/auth/register`
2. **Login** → `POST /api/v1/auth/login` (get token)
3. **Create Project** → `POST /api/v1/projects`
4. **Invite Team Member** → `POST /api/v1/projects/:projectId/invite`
5. **Create Incident** → `POST /api/v1/projects/:projectId/incidents`
6. **Update Incident** → `PATCH /api/v1/projects/:projectId/incidents/:incidentId`
7. **Add Comment** → `POST /api/v1/projects/:projectId/incidents/:incidentId/comments`
8. **View Timeline** → `GET /api/v1/projects/:projectId/incidents/:incidentId/timeline`
9. **Check Audit Logs** → `GET /api/v1/projects/:projectId/audit`

## 🔧 Technologies

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Custom middleware + Mongoose schema validation

---

**Note**: This README reflects the current implementation. For production use, consider adding:
- Rate limiting
- Request validation library (e.g., Zod, Joi)
- Pagination for list endpoints
- Websocket support for real-time updates
- Comprehensive error logging (e.g., Winston, Pino)