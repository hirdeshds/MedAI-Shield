# MedAI Shield

## Enterprise Healthcare Data Compliance Console

MedAI Shield is a React-based healthcare compliance and data operations console for monitoring patient data ingestion, validation, quality checks, audit activity, alert workflows, and role-based clinical access. The current implementation is a frontend-only Vite application that simulates operational workflows locally in the browser while keeping the user interface, routing model, and data contracts ready for backend/API integration.

This README is written as an internal corporate handover document. It is intended for engineering, product, QA, security, and operations teams who need to install, review, demo, maintain, or extend the system.

---

## Table of Contents

1. [Business Context](#business-context)
2. [Core Architecture and Innovations](#core-architecture-and-innovations)
3. [System Design](#system-design)
4. [Application Modules](#application-modules)
5. [Security and Compliance Model](#security-and-compliance-model)
6. [Installation and Operation](#installation-and-operation)
7. [Environment Configuration](#environment-configuration)
8. [Demo Access](#demo-access)
9. [Folder Structure](#folder-structure)
10. [Development Standards](#development-standards)
11. [Testing and Verification](#testing-and-verification)
12. [Deployment Readiness](#deployment-readiness)
13. [Troubleshooting](#troubleshooting)
14. [Roadmap](#roadmap)

---

## Business Context

Healthcare data platforms must process sensitive clinical records while maintaining traceability, role-based access, auditability, and operational visibility. MedAI Shield addresses this need through a centralized compliance console for hospital administrators, doctors, and data analysts.

The product focuses on:

- Patient data ingestion and validation.
- Local CSV/JSON upload processing.
- Data quality and quarantine visibility.
- Compliance scoring and operational dashboarding.
- Audit trail visibility.
- SNS-style critical alert workflows.
- Role-specific access for clinical and administrative personas.
- AWS-aligned information architecture for future cloud integration.

The current system is suitable for product demos, UI validation, workflow simulation, frontend integration planning, and stakeholder walkthroughs.

---

## Core Architecture and Innovations

### 1. Frontend-Only Compliance Simulation

The application intentionally avoids backend secrets and direct cloud credentials in browser code. Operational data is simulated with browser-local storage and frontend-safe configuration values. This allows teams to demonstrate workflows without exposing production infrastructure or protected credentials.

### 2. Role-Aware Navigation

MedAI Shield uses protected routes and role gates to separate access for:

- `doctor`
- `analyst`
- `admin`

This mirrors enterprise access-control expectations and provides a clean transition path to OAuth, SSO, Cognito, IAM Identity Center, or another identity provider.

### 3. Local Data Persistence Layer

The data layer stores upload events, audit activity, SNS subscribers, and SNS alert events in `localStorage`. This gives the app realistic stateful behavior during demos without requiring a backend service.

### 4. AWS-Inspired Operational Model

The UI models common cloud healthcare data workflows:

- Raw ingestion.
- ETL execution.
- Curated data review.
- Data lifecycle monitoring.
- IAM visibility.
- Audit and compliance records.
- SNS alert configuration.
- System logs.

### 5. Safe Alert Preview Mode

SNS alert screens can display frontend-safe environment configuration such as region and topic ARN, but they do not store or execute AWS secret keys in the browser bundle.

### 6. Modular Component System

The app uses reusable UI primitives and domain components:

- Radix UI primitives.
- Tailwind CSS styling.
- Lucide icons.
- Shared cards, badges, tables, buttons, dialogs, tabs, and controls.
- Domain-specific components such as stat cards, risk pills, status badges, protected routes, and sidebar navigation.

---

## System Design

### High-Level Runtime Architecture

```text
User Browser
    |
    v
React 18 Application
    |
    |-- React Router route tree
    |-- AuthProvider session state
    |-- Role-based route guards
    |-- UI component layer
    |-- Local API/data adapter
    |
    v
Browser Storage
    |
    |-- medai-shield-user
    |-- medai-shield-token
    |-- medai-shield:uploads
    |-- medai-shield:sns-subscribers
    |-- medai-shield:sns-alerts
```

### Logical Architecture

```text
Presentation Layer
    React screens, layouts, navigation, charts, cards, forms

Application Layer
    Route configuration, auth context, protected route wrappers

Domain UI Layer
    Dashboard metrics, upload workflows, audit records, alerts, quality checks

Data Adapter Layer
    TypeScript API facade in src/app/lib/api.ts

Persistence Layer
    Browser localStorage for demo state and workflow simulation
```

### Future Production Architecture

```text
Browser Client
    |
    v
API Gateway / Backend Service
    |
    |-- Authentication and authorization
    |-- File upload orchestration
    |-- Validation service
    |-- Audit service
    |-- Alert service
    |-- Compliance scoring service
    |
    v
Cloud Data Platform
    |
    |-- Object storage for raw and curated files
    |-- ETL jobs
    |-- Data catalog and query layer
    |-- Monitoring and logging
    |-- Notification topics
    |-- IAM policies and audit trails
```

---

## Application Modules

### Dashboard

Displays operational metrics including processed records, compliance risks, high-risk patient counts, compliance score, and recent activity.

Primary route:

- `/`
- `/dashboard`

### Ingestion

Supports local upload processing for CSV and JSON patient data files. Uploaded records are parsed, normalized, and saved to local browser state for dashboard and audit visibility.

Primary routes:

- `/ingestion`
- `/upload`

### ETL

Represents pipeline execution and status tracking. The current implementation returns local simulated ETL state.

Primary route:

- `/etl`

### Data Quality

Displays validation status, quality score, duplicates, missing values, and pass/fail state based on local upload simulation.

Primary route:

- `/quality`

### Monitoring

Shows platform health and operational status for the simulated healthcare data pipeline.

Primary route:

- `/monitoring`

### SNS Alerts

Provides subscriber management and test alert publishing in preview mode. Alert events and subscriber records are persisted locally.

Primary route:

- `/sns`

### IAM

Displays role/user-oriented access visibility for the demo environment.

Primary route:

- `/iam`

### Audit

Shows audit entries derived from local upload events and system actions.

Primary route:

- `/audit`

### Curated Data

Displays normalized and curated patient record visibility.

Primary route:

- `/curated`

### Lifecycle

Represents data lifecycle stages such as raw, transformed, and curated data zones.

Primary route:

- `/lifecycle`

### ABDM Gateway

Represents clinical interoperability and ABDM-aligned workflow visibility.

Primary route:

- `/abdm`

### Pharmacy and Beds

Represents hospital operations views for pharmacy and bed management.

Primary route:

- `/pharmacy-beds`

### Athena

Represents analytics/query-layer visibility for curated healthcare data.

Primary route:

- `/athena`

### System Logs

Represents administrative log visibility.

Primary route:

- `/logs`

---

## Security and Compliance Model

### Current Security Controls

- Route-level authentication gate.
- Role-based route authorization.
- Local demo credentials only.
- No AWS secret keys in browser code.
- No backend token exchange in the current frontend-only build.
- Local state isolation through browser `localStorage`.
- Explicit preview-mode behavior for SNS-related features.

### Role Matrix

| Module | Doctor | Analyst | Admin |
| --- | --- | --- | --- |
| Dashboard | Yes | Yes | Yes |
| Ingestion | No | Yes | Yes |
| ETL | No | Yes | Yes |
| Data Quality | No | Yes | Yes |
| Monitoring | No | No | Yes |
| SNS Alerts | No | No | Yes |
| IAM | No | No | Yes |
| Audit | Yes | No | Yes |
| Curated Data | Yes | Yes | Yes |
| Lifecycle | No | No | Yes |
| ABDM Gateway | Yes | No | Yes |
| Pharmacy and Beds | Yes | No | Yes |
| Athena | No | Yes | Yes |
| System Logs | No | No | Yes |

### Production Security Requirements

Before production use, the following controls should be implemented:

- Replace demo login with enterprise identity management.
- Move all privileged operations to a backend service.
- Enforce server-side authorization.
- Add API request signing or session-based access control.
- Encrypt sensitive data in transit and at rest.
- Add structured audit logging.
- Add compliance-grade retention policies.
- Add secrets management through a cloud-native secret store.
- Add PHI/PII redaction and masking policies.
- Add automated dependency and vulnerability scanning.

---

## Installation and Operation

### Prerequisites

Install the following before running the application:

- Node.js 18 or later.
- npm 9 or later.
- Modern browser such as Chrome, Edge, or Firefox.

### Local Installation

From the repository root:

```bash
cd frontend
npm install
```

### Start Development Server

```bash
npm run dev
```

Vite will print the local development URL, usually:

```text
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

Build output is generated in:

```text
frontend/dist
```

### Preview Production Build

```bash
npm run preview
```

### Lint the Codebase

```bash
npm run lint
```

---

## Environment Configuration

The current app is frontend-only. Only expose values that are safe for browsers.

Create a local environment file if needed:

```text
frontend/.env.local
```

Supported optional variables:

```bash
VITE_AWS_REGION=ap-south-1
VITE_AWS_SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:medai-shield-alerts
```

Important:

- Do not place AWS access keys in any `VITE_` variable.
- Do not place database credentials in the frontend.
- Do not place production PHI, PII, or patient secrets in local demo files.
- Use backend APIs for real cloud operations.

---

## Demo Access

The current authentication layer uses local demo credentials.

| Persona | Username | Password | Role |
| --- | --- | --- | --- |
| Doctor | `dr-sharma` | `doctor123` | `doctor` |
| Analyst | `analyst-priya` | `analyst123` | `analyst` |
| Administrator | `admin` | `admin123` | `admin` |

Session state is stored locally under:

```text
medai-shield-user
medai-shield-token
```

To reset local demo state, clear browser site data for the local development URL.

---

## Folder Structure

```text
MedAI Shield/
|-- README.md
|-- frontend/
    |-- index.html
    |-- package.json
    |-- package-lock.json
    |-- vite.config.ts
    |-- tsconfig.json
    |-- tsconfig.node.json
    |-- tailwind.config.js
    |-- postcss.config.js
    |-- src/
        |-- main.tsx
        |-- vite-env.d.ts
        |-- api/
        |   |-- index.ts
        |   |-- index.d.ts
        |-- app/
        |   |-- App.tsx
        |   |-- routes.tsx
        |   |-- components/
        |   |   |-- AppSidebar.tsx
        |   |   |-- ProgressSteps.tsx
        |   |   |-- ProtectedRoute.tsx
        |   |   |-- RiskScorePill.tsx
        |   |   |-- StatCard.tsx
        |   |   |-- StatusBadge.tsx
        |   |   |-- figma/
        |   |   |-- ui/
        |   |-- layouts/
        |   |   |-- RootLayout.tsx
        |   |-- lib/
        |   |   |-- api.ts
        |   |   |-- auth.tsx
        |   |-- screens/
        |       |-- AnalyticsScreen.tsx
        |       |-- AuditLogScreen.tsx
        |       |-- AwsRoutesScreen.tsx
        |       |-- ComplianceScreens.tsx
        |       |-- DashboardScreen.tsx
        |       |-- LoginScreen.tsx
        |       |-- NotFoundScreen.tsx
        |       |-- SnsAlertsScreen.tsx
        |       |-- UploadScreen.tsx
        |-- imports/
        |   |-- image.png
        |-- styles/
            |-- fonts.css
            |-- globals.css
            |-- index.css
            |-- tailwind.css
            |-- theme.css
```

---

## Development Standards

### Language and Framework

- React 18.
- TypeScript.
- Vite.
- React Router.
- Tailwind CSS.
- Radix UI components.
- Lucide React icons.

### Coding Conventions

- Keep application screens under `src/app/screens`.
- Keep reusable domain components under `src/app/components`.
- Keep shared UI primitives under `src/app/components/ui`.
- Keep authentication and data access helpers under `src/app/lib`.
- Keep route definitions centralized in `src/app/routes.tsx`.
- Keep frontend-safe API contracts typed with TypeScript interfaces.

### Data Handling Rules

- Treat local uploaded files as demo data.
- Parse only supported CSV and JSON input formats.
- Do not commit real patient data.
- Do not commit secrets.
- Do not put privileged cloud SDK calls in browser code.

---

## Testing and Verification

### Manual Smoke Test

1. Start the app with `npm run dev`.
2. Open the local Vite URL.
3. Log in as `admin`.
4. Confirm dashboard loads.
5. Upload a small CSV or JSON file from the ingestion screen.
6. Confirm recent activity updates.
7. Open audit logs and confirm the upload event appears.
8. Open SNS Alerts and send a test alert.
9. Log out and log in as `doctor`.
10. Confirm restricted admin pages show access denied.

### Build Verification

Run:

```bash
npm run build
```

Expected result:

- TypeScript compiles successfully.
- Vite generates production assets.
- `frontend/dist` is created.

### Recommended Automated Test Coverage

Future test coverage should include:

- AuthProvider login/logout behavior.
- ProtectedRoute redirect behavior.
- RequireRole access-denied behavior.
- File upload parsing for CSV and JSON.
- Dashboard metric normalization.
- SNS subscriber and alert persistence.
- Route-level smoke tests.
- Component-level tests for critical admin screens.

---

## Deployment Readiness

### Current Readiness

The app is ready for static frontend deployment as a demo or prototype.

Suitable targets:

- Vercel.
- Netlify.
- AWS Amplify Hosting.
- S3 and CloudFront.
- Internal static hosting.

### Production Gaps

The following must be completed before handling real healthcare data:

- Backend API service.
- Enterprise authentication.
- Server-side authorization.
- Secure file upload pipeline.
- Database or object storage integration.
- PHI-safe logging.
- Production alert service.
- Compliance audit retention.
- Observability and incident response workflows.
- Legal and security review.

---

## Troubleshooting

### `npm install` fails

Confirm Node.js and npm are installed:

```bash
node --version
npm --version
```

Then retry inside `frontend`.

### Blank page after starting Vite

Check the browser console for runtime errors and confirm dependencies were installed with:

```bash
npm install
```

### Login fails

Use one of the demo credential sets listed in [Demo Access](#demo-access). Usernames are lowercase.

### Uploaded records do not appear

Clear browser site data and re-upload a valid CSV or JSON file. The app stores upload state in `localStorage`.

### SNS topic is not configured

Set optional frontend-safe values in `frontend/.env.local`. This changes display behavior only and does not perform real AWS publishing.

---

## Roadmap

### Phase 1: Frontend Stabilization

- Add component and route tests.
- Consolidate duplicate API facade files.
- Add typed sample upload fixtures.
- Add stronger CSV parsing for quoted fields.
- Add empty, loading, and error state coverage across all screens.

### Phase 2: Backend Integration

- Introduce backend service for authentication and data operations.
- Replace localStorage upload persistence with API-backed storage.
- Add secure file upload endpoints.
- Add server-side audit logging.
- Add server-side role enforcement.

### Phase 3: Cloud Platform Integration

- Integrate object storage for raw and curated files.
- Integrate ETL orchestration.
- Integrate monitoring and alerting.
- Integrate cloud audit trail ingestion.
- Add managed secrets and configuration.

### Phase 4: Compliance Hardening

- Implement PHI masking and redaction.
- Add retention policies.
- Add evidence export.
- Add data access reviews.
- Add vulnerability scanning and dependency policy gates.
- Add disaster recovery and incident response documentation.

---

## Ownership Notes

MedAI Shield should be maintained as a regulated-data application prototype. Any move toward production healthcare usage must include security review, privacy review, backend authorization, audit controls, and explicit handling rules for PHI/PII.

For internal engineering work, treat this repository as the frontend application boundary and keep cloud credentials, database secrets, and privileged operations outside the browser bundle.

