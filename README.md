# Employee Portal - AceTech

A comprehensive employee/employer portal with cash requisition and task management modules.

## Features

### Cash Requisition Module
- Employees can create cash requisition requests
- Platform admins can approve or reject requests
- Status tracking and history
- Real-time notifications

### Task Management Module
- Create and assign tasks with priorities and due dates
- Task status workflow (Todo → In Progress → Completed)
- Comments and file attachments
- Task dependencies
- Time tracking per task
- Kanban board and list views
- Real-time notifications

### Authentication & Authorization
- Email/password authentication
- Role-based access control (Employee/Admin)
- Secure session management

## Tech Stack

- **Frontend/Backend**: Next.js 14+ (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Form Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your database URL and NextAuth secret.

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Create the admin user:
   ```bash
   npm run db:seed
   ```
   This creates an admin user with:
   - Email: `admin@acetech.com`
   - Password: `admin123`
   - **Important**: Change this password after first login!

6. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Commands

- Generate Prisma Client: `npm run db:generate`
- Run migrations: `npm run db:migrate`
- Open Prisma Studio: `npm run db:studio`

## Project Structure

```
/
├── app/                    # Next.js app router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   ├── api/                # API routes
│   └── login/register/     # Auth pages
├── components/             # React components
│   ├── cash-requisitions/ # Cash requisition components
│   ├── tasks/              # Task management components
│   └── shared/             # Shared components
├── lib/                    # Utility functions
├── prisma/                 # Prisma schema and migrations
└── types/                  # TypeScript type definitions
```

## User Roles

- **EMPLOYEE**: Can create requisitions and tasks, view assigned tasks
- **ADMIN**: Can approve/reject requisitions, manage all tasks

## License

ISC

