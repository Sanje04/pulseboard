# PulseBoard

PulseBoard is a production-grade, full-stack web application for managing projects, tracking operational incidents, and documenting technical decisions with accountability and historical traceability. The system is designed to mirror real-world software engineering concerns such as authentication, authorization, auditability, scalability, and deployment reliability.

---

## 🚀 Motivation

In real engineering teams, work extends beyond simple task tracking. Teams must:
- Respond to and document incidents
- Understand why technical decisions were made
- Maintain accountability across collaborators
- Enforce access control and data integrity

PulseBoard was built to model these realities. Rather than focusing on feature quantity, the project emphasizes clean architecture, explicit tradeoffs, and production readiness.

---

## 🧠 Core Features

### Authentication & Authorization
- Secure email/password authentication using JWT
- Password hashing with bcrypt
- Role-based access control (Owner, Member, Viewer)
- Project-level permission enforcement

### Projects
- Create and manage multiple projects
- Invite collaborators with assigned roles
- Fine-grained access control per project

### Incident Tracking
- Log incidents with severity levels and statuses
- Maintain a timeline of incident updates
- Record resolution summaries
- Immutable audit trail for all changes

### Decision Logging
- Record technical and product decisions
- Tag decisions by category (architecture, infrastructure, product)
- Maintain versioned edit history for transparency

---

## ⚙️ Engineering & System Design

PulseBoard is built around a versioned REST API and emphasizes production-aware backend design.

Key engineering considerations include:
- Centralized error handling
- Input validation at API boundaries
- Pagination and filtering for scalable data access
- Rate limiting to protect critical endpoints
- Soft deletes to preserve historical data
- Structured logging for observability

The frontend consumes the API through authenticated requests and implements protected routes and optimistic UI updates to provide a responsive user experience.

---

## 🏗 Architecture Overview

