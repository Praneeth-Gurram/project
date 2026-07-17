

# SupplyPrescript AI — Frontend

An enterprise-grade, responsive frontend interface for the **SupplyPrescript AI** platform. This application is built using modern web technologies to ensure exceptional performance, strict type safety, and a seamless, data-driven user experience.

## 🚀 Current Task & Status

* **Scaffold Layout:** Successfully scaffolded the core frontend architecture.
* **Responsive Enterprise Design:** Implemented a fully responsive layout optimized for complex data views, sidebars, and enterprise dashboards.
* **Tech Stack Baseline:** Initialized with **React**, **TypeScript**, and **Vite** for optimized Hot Module Replacement (HMR) and fast build performances.

---

## 🛠️ Tech Stack & Tools

* **Frontend Framework:** React 19 / 18
* **Build Tool:** Vite (configured for rapid development and optimized production bundles)
* **Language:** TypeScript (for robust type safety across data pipelines and component props)
* **Code Quality & Linting:** Oxlint / Oxc (leveraging ultra-fast linting rules for React and TypeScript)

---

## 📁 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd supply-prescript-ai

```


2. Install the required dependencies:
```bash
npm install

```



### Development Server

To launch the responsive layout locally with HMR:

```bash
npm run dev

```

### Production Build

To compile and optimize the enterprise frontend for deployment:

```bash
npm run build

```

---

## ⚙️ Linting & Code Standards

This project uses **Oxlint** for lightning-fast performance feedback. To ensure strict type-aware linting for React hooks and components during development, the setup utilizes:

```json
{
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}

```

---

Would you like to add specific sections detailing the sidebar components, data analytics charts, or state management tools you plan to integrate next?

Week 1 frontend milestone completed
The initial SupplyPrescript AI frontend scaffold is now set up as a modern React + TypeScript enterprise-style app with:

Vite + React 19 + TypeScript
Tailwind CSS configured
React Router DOM enabled
React Query, Axios, MUI, ECharts, and React Hook Form installed
Responsive shell with:
sidebar
top navigation
footer
Mock-data pages for:
Dashboard
Orders
Shipments
Suppliers
Inventory
Settings
Reusable UI components:
DataTable
StatCard
SearchBar
FilterPanel
LoadingSpinner
EmptyState
ErrorState
PageHeader

Folder structure overview
src — app source
components — reusable UI pieces
pages — route-based pages
layouts — shared app shell
data — mock JSON-style data
types — shared TypeScript types