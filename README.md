# OrgaMaster AI

Welcome to the OrgaMaster AI project repository! This application helps you manage your tasks efficiently with the assistance of AI.

**Project Goal:** To create an intuitive task management application that leverages AI to streamline task creation, research, and organization.

**Key Features (Planned & Implemented):**

* User Authentication (Supabase Auth)
* Task Management (CRUD operations)
* AI-Powered Task Detail Generation
* AI-Powered "Deep Research" for tasks
* Task Filtering & Sorting
* Notifications & Reminders
* See `task.md` for a detailed feature list and progress.

## How can I edit this code?

There are several ways of editing your application.

### Use your preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/rsieuw/orga-master-ai-nexus.git

# Step 2: Navigate to the project directory.
cd orga-master-ai-nexus

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Edit a file directly in GitHub

* Navigate to the desired file(s).
* Click the "Edit" button (pencil icon) at the top right of the file view.
* Make your changes and commit the changes.

### Use GitHub Codespaces

* Navigate to the main page of your repository.
* Click on the "Code" button (green button) near the top right.
* Select the "Codespaces" tab.
* Click on "New codespace" to launch a new Codespace environment.
* Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

* **Vite**: For fast frontend bundling and development server.
* **TypeScript**: For static typing and improved code quality.
* **React**: For building the user interface.
* **Tailwind CSS**: For utility-first CSS styling.
* **shadcn/ui**: For a collection of beautifully designed and accessible UI components built on Radix UI.
* **Radix UI**: Provides the underlying unstyled, accessible UI primitives for shadcn/ui.
* **Lucide Icons**: For a comprehensive set of SVG icons.
* **TanStack Query (React Query)**: For server-state management, data fetching, caching, and synchronization.
* **Zod**: For schema declaration and validation.
* **React Hook Form**: For performant and flexible form state management and validation (often used with Zod).
* **Supabase**: For backend services including:
  * Authentication
  * Database (PostgreSQL)
  * Edge Functions (likely using Deno)
* **Deno**: Used for backend logic, potentially for Supabase Edge Functions and other scripts (indicated by `deno.jsonc` and `deno.lock`).
* **Node.js**: For the development environment, running Vite, and managing npm packages.
* **Sonner**: Installed as a dependency for toast notifications, though the primary toast functionality in `TaskDetail.tsx` currently uses a custom hook (`@/hooks/use-toast.ts`).
* **Other notable libraries**: `class-variance-authority`, `clsx`, `tailwind-merge` (for styling utilities with shadcn/ui), `date-fns` (for date manipulation), `react-router-dom` (for routing), `vitest` (for testing).

## Project Structure

```plaintext
orga-master-ai-nexus
├── android/                  # Android native project (Capacitor)
│   ├── app/
│   └── gradle/
├── assets/                   # Static assets for the web app (e.g., images not specific to categories)
├── icons/                    # App icons (likely source files)
├── ios/                      # iOS native project (Capacitor)
│   └── App/
├── public/                   # Static assets served directly by the web server
│   ├── assets/
│   │   └── categories/       # Category-specific icons/images
│   └── locales/              # Localization files (i18n)
│       ├── en/
│       └── nl/
├── resources/                # Platform-specific resources (icons, splash screens) for Capacitor
│   ├── android/
│   └── ios/
├── src/                      # Main source code for the React application
│   ├── app/                  # Core application setup, routing, global state
│   ├── components/           # Reusable UI components
│   │   ├── admin/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── filters/
│   │   ├── layout/
│   │   ├── task/
│   │   ├── tasks/
│   │   └── ui/               # Generic UI elements (e.g., from shadcn/ui)
│   ├── constants/            # Application-wide constants
│   ├── contexts/             # React Context API providers
│   ├── hooks/                # Custom React hooks
│   ├── integrations/         # Third-party service integrations
│   │   └── supabase/         # Supabase client and related functions
│   ├── lib/                  # Utility functions and libraries
│   ├── pages/                # Top-level page components
│   │   └── admin/
│   ├── test/                 # Test files
│   └── types/                # TypeScript type definitions
├── supabase/                 # Supabase project specific files
│   ├── .branches/            # Supabase local development branches
│   ├── .temp/                # Supabase temporary files
│   ├── functions/            # Supabase Edge Functions
│   │   ├── _shared/          # Shared code/vendors for Edge Functions
│   │   ├── create-checkout-session/
│   │   ├── deep-research/
│   │   ├── delete-research/
│   │   ├── generate-chat-response/
│   │   ├── generate-subtasks/
│   │   ├── generate-task-details/
│   │   ├── get-all-users/
│   │   ├── get-theme-settings/
│   │   ├── save-research/
│   │   ├── stripe-webhooks/
│   │   └── update-theme-settings/
│   └── migrations/           # Supabase database migration files
├── .gitignore                # Specifies intentionally untracked files that Git should ignore
├── assets.config.json        # Configuration for Capacitor assets generation
├── capacitor.config.ts       # Capacitor configuration file
├── components.json           # Likely related to shadcn/ui component management
├── deno.jsonc                # Deno configuration file
├── deno.lock                 # Deno lock file for dependencies
├── eslint.config.js          # ESLint configuration for code linting
├── find_dupes.js             # Custom script (likely for finding duplicate files)
├── import_map.json           # Deno import map
├── index.html                # Main HTML file for the web application
├── package-lock.json         # Records exact versions of npm dependencies
├── package.json              # npm package manifest (dependencies, scripts)
├── postcss.config.js         # PostCSS configuration (used with Tailwind CSS)
├── README.md                 # This file! Project overview and instructions
├── tailwind.config.ts        # Tailwind CSS configuration
├── task.md                   # Detailed feature list and progress
├── tsconfig.json             # TypeScript compiler options for the project
├── tsconfig.node.json        # TypeScript compiler options for Node.js specific parts (e.g., Vite config)
├── validate.js               # Custom script (likely for validation purposes)
├── vite.config.ts            # Vite bundler configuration
└── vitest.config.ts          # Vitest (testing framework) configuration
```
