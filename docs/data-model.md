# Data Model

## User
- id
- name
- email (unique)
- passwordHash
- createdAt

## Project
- id
- name
- description
- createdBy (userId)
- createdAt

## Membership
- id
- projectId
- userId
- role: Owner | Member | Viewer
- createdAt

## Incident
- id
- projectId
- title
- severity: SEV1 | SEV2 | SEV3 | SEV4
- status: Open | Mitigating | Resolved
- description
- createdBy
- createdAt
- deletedAt (nullable)

## IncidentUpdate
- id
- incidentId
- message
- status (nullable)
- createdBy
- createdAt

## Decision
- id
- projectId
- title
- tags: string[]
- createdBy
- createdAt
- deletedAt (nullable)

## DecisionVersion
- id
- decisionId
- version (int)
- context
- decision
- consequences
- createdBy
- createdAt

## AuditLog
- id
- projectId
- actorUserId
- action (string)
- entityType (Project/Incident/Decision/etc)
- entityId
- metadata (json)
- createdAt
