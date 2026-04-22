# ISUDocs — ISU Documentation Platform

ISUDocs is basically like Confluence, but built for schools and universities. It helps departments and research labs keep their notes and documents organized in one place, making it super easy to share knowledge and work together.

---

## ✨ Key Features

- **Organized Spaces**: Group your pages into folders (Spaces) so everything is easy to find.
- **Easy Editing**: Write and format your documents effortlessly, just like in your favorite word processor. You can add tables, lists, and highlighting.
- **Rewind Mistakes**: Every time you update a page, we keep a safe copy. If you mess up, you can easily see what changed and bring back an older version.
- **Stay in the Loop**: Get notified right away when someone drops a comment or makes changes to your pages.
- **Keep Your Stuff Safe**: Only the person who created a page (and the admins) can edit it, so no one else can mess with your hard work.
- **Search Everything**: Looking for something specific? Our built-in search tool scans all your documents instantly.
- **File Uploads**: Drop images and files directly into your pages.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 / TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Radix UI components (Headless UI)
- **State Management**: Zustand (Global Store) + TanStack React Query (Server State Cache)
- **Editor**: Tiptap (ProseMirror based)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM / Database**: SQLAlchemy / SQLite (Supports seamless plug-and-play migration to Oracle Database)
- **Authentication**: JWT-based with role-based access control (RBAC) via Passlib and Python-JOSE

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+ — [Download](https://www.python.org/downloads/)
- Node.js 20+ — [Download](https://nodejs.org/)

### Day-to-Day Execution

UniDocs includes wrapper scripts to rapidly start the platform:

**Windows (The Quick Way):**
Double-click the **`start_dev.bat`** file in your project root, or execute `.\start_dev.bat` in your terminal to automatically open both the frontend and backend servers.

**Mac/Linux (The Quick Way):**
Make the script executable once `chmod +x start_dev.sh`, then run `./start_dev.sh` to launch both servers. Press `Ctrl+C` once to shut them down together.

---

## ⚙️ Manual Setup

### 1. Backend

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# MacOS/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
# copy .env.example .env (Edit .env and ensure SECRET_KEY is set)

# 4. Initialize Database
python -c "from app.database import create_tables; create_tables()"

# 5. Seed default templates
python -m app.scripts.seed_templates

# 6. Start the server
uvicorn app.main:app --reload --port 8000
```
Interactive API docs are available at: `http://localhost:8000/api/docs`

### 2. Frontend

```bash
cd frontend

# 1. Install packages
npm install

# 2. Configure environment
# copy .env.example .env  (or `cp .env.example .env` on Mac/Linux)

# 3. Start the Vite React app
npm run dev
```
The application will launch at: `http://localhost:5173`

---

## 👥 Default User Roles

| Role   | Permissions |
|--------|-------------|
| **Admin** | Everything — manage users, spaces, templates, and all content organization-wide. |
| **Editor** | Create spaces, create/edit pages, manage templates. Subject to content ownership rules. |
| **Viewer** | Read-only access to public spaces and individual pages. Cannot modify environments. |

**Important Note:** The *first* user to register automatically gets the **viewer** role. To elevate to an admin, an update must be performed on the backend database manually.

```sql
-- Via SQLite browser or command line:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or via the Python shell:
```python
from app.database import SessionLocal
from app.models.user import User, UserRole

db = SessionLocal()
user = db.query(User).filter(User.email == "your@email.com").first()
user.role = UserRole.admin
db.commit()
```

---

## 🗄 Oracle Migration

By default, the platform boots with SQLite. When you are ready to scale locally or push to an enterprise environment using Oracle Database:

1. In `backend/.env`, modify the connection string:
   ```env
   DATABASE_URL=oracle+oracledb://username:password@host:1521/?service_name=ORCLPDB
   ```
2. In `backend/requirements.txt`, replace `aiosqlite==0.20.0` with `oracledb`.
3. In `backend/app/services/search_service.py`, update the FTS5 equivalent search querying with Oracle Text capabilities:
   ```python
   # Replace the MATCH query with:
   "SELECT p.id, p.title, p.space_id FROM pages p WHERE CONTAINS(p.content_text, :query) > 0 ..."
   ```
4. Run `pip install -r requirements.txt` and restart your Uvicorn server.

*All application models, Pydantic schemas, routing schemas, and business logic require zero additional changes.*

---

## 📁 Project Structure

```text
confluence/
├── backend/
│   ├── alembic.ini               Database migration configuration
│   ├── requirements.txt          Python dependency tree
│   └── app/
│       ├── api/v1/               FastAPI modular routers (auth, spaces, pages, versions)
│       ├── core/                 JWT security, startup dependencies, and custom exceptions
│       ├── models/               SQLAlchemy ORM definitions
│       ├── schemas/              Pydantic strictly-typed models
│       ├── services/             Business logic and content ownership verification
│       ├── main.py               Application factory & CORS setup
│       ├── database.py           SQLAlchemy engine and sessions
│       └── scripts/              CLI utilities for DB seeding (e.g., templates)
└── frontend/
    ├── package.json              Node dependencies and scripts
    ├── vite.config.ts            Build system specs
    └── src/
        ├── api/                  Typed Axios endpoints and interactors
        ├── components/           Modals, navigation layouts, UI atoms, Tiptap editor
        ├── hooks/                TanStack Query data hooks (`useQuery`, `useMutation`)
        ├── pages/                Route-level view components (Dashboard, Spaces, History)
        └── store/                Zustand slices for JWT Auth and Local UI state
```

---

## 🌐 API Reference Map

Full interactive Swagger documentation: `http://localhost:8000/api/docs`

| Business Domain | Base Path |
|-----------------|-----------|
| Authentication | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Workspaces | `/api/v1/spaces` |
| Pages & Content | `/api/v1/pages` |
| Revision History| `/api/v1/versions` |
| Comments | `/api/v1/comments` |
| File Attachments| `/api/v1/attachments` |
| General Search | `/api/v1/search?q=` |
| Templates | `/api/v1/templates` |
