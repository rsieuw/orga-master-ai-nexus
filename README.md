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
