# ROCS — Retail Operations Control System

ROCS is a full-stack retail management system designed to control point-of-sale (POS), inventory, HR, accounting, auditing, and branch operations. It features secure, role-based dashboards for Administrators, Managers, and Terminal operators.

---



## Tech Stack

### Backend (Spring Boot)

- **Language:** Java 25
- **Framework:** Spring Boot 4.0.1
- **Database:** MySQL (Connector/J)
- **Security:** Spring Security & JJWT 0.11.5
- **Build Tool:** Maven (Wrapper included)
- **Tools:** Lombok, Spring Boot Validation

### Frontend (React)

- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4
- **Styling:** Tailwind CSS 3.4.17 (PostCSS + Autoprefixer)
- **Routing:** React Router DOM 7.12.0
- **Icons:** Lucide React 0.562
- **Linting:** ESLint 9.39

---

## Prerequisites

Ensure the following are installed globally on your machine:

- **Java JDK 25** (Required for the backend)
- **Node.js** (Version 18+ required for Vite)
- **MySQL Server** (Running on port 3306)

---

## Configuration

### Backend Configuration

The backend configuration is located in `rocs-backend/Rocs-BE/src/main/resources/application.properties`. Ensure the following variables are set correctly for your local environment:

```properties
spring.application.name=rocs
spring.datasource.url=jdbc:mysql://localhost:3306/your_database_name
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
```

> **Note:** JWT secret configuration may be required in `JwtService.java` if not present in the properties file.

### Frontend Configuration

The frontend currently uses a hardcoded API base URL.

- **Location:** `src/services/authService.js`
- **Current Value:** `http://localhost:8080/api/v1`

---

## Installation & Setup

### 1. Database Setup

Create a new MySQL database for the application:

```sql
CREATE DATABASE rocs_db;
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd rocs-backend/Rocs-BE
```

Install dependencies and build the project:

```bash
# Linux/Mac
./mvnw clean install

# Windows
mvnw.cmd clean install
```

Run the server:

```bash
# Linux/Mac
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

The backend server will start on **port 8080**.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd rocs-FE
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend application will start on **port 5173**.

---

## Key Modules

### Backend Modules

- **Auth:** Handles user registration, authentication, and JWT token generation
- **Dashboard:** Separate logic for Admin, Manager, and Terminal dashboards
- **Inventory:** Management of stock levels and product details
- **POS:** Point-of-Sale transaction processing
- **Common:** Shared utilities and branch listing services

### Frontend Modules

- **Auth & Screens:** Registration and Login interfaces
- **Dashboards:** Scaffolded views for Control and Manager dashboards
- **Operational Modules:** Placeholders for POS, Inventory, HR, Accounting, and Reports

---

## Project Structure

```
rocs/
├── rocs-backend/
│   └── Rocs-BE/
│       ├── .mvn/                      # Maven wrapper files
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/nsbm/rocs/
│       │   │   │   ├── auth/          # Authentication (controller, DTO, repo, service)
│       │   │   │   ├── common/        # Shared resources & utilities
│       │   │   │   ├── config/        # Security config & JWT filter
│       │   │   │   ├── dashboard/     # Role-based dashboard logic
│       │   │   │   │   ├── admin/     # Admin dashboard operations
│       │   │   │   │   ├── manager/   # Manager dashboard operations
│       │   │   │   │   └── terminal/  # Terminal/Cashier operations
│       │   │   │   ├── entity/        # JPA entities & enums
│       │   │   │   │   ├── enums/     # Role, AccountStatus
│       │   │   │   │   └── main/      # UserProfile entity
│       │   │   │   ├── inventory/     # Inventory management
│       │   │   │   └── pos/           # Point of Sale logic
│       │   │   └── resources/
│       │   │       └── application.properties
│       │   └── test/                  # Test files
│       ├── pom.xml                    # Maven configuration
│       ├── mvnw                       # Maven wrapper (Unix)
│       └── mvnw.cmd                   # Maven wrapper (Windows)
│
└── rocs-FE/
    ├── public/                        # Static assets
    ├── src/
    │   ├── accounting/                # Accounting module (scaffolded)
    │   ├── admin/                     # Admin interface (scaffolded)
    │   ├── assets/                    # Images, fonts, etc.
    │   ├── audit/                     # Auditing module (scaffolded)
    │   ├── auth/                      # Auth components (implemented)
    │   ├── components/                # Reusable UI components
    │   │   ├── auth/                  # Authentication components
    │   │   ├── common/                # Common components
    │   │   ├── feedback/              # Feedback/notification components
    │   │   └── icons/                 # Icon components
    │   ├── dashboard/                 # Dashboard views
    │   │   ├── control-dashboard/     # Admin dashboard (scaffolded)
    │   │   └── manager-dashboard/     # Manager dashboard (scaffolded)
    │   ├── hooks/                     # Custom React hooks
    │   ├── hr/                        # HR module (scaffolded)
    │   ├── inventory/                 # Inventory interface (scaffolded)
    │   ├── layout/                    # Layout components
    │   ├── pos/                       # POS interface (scaffolded)
    │   ├── reports/                   # Reporting module (scaffolded)
    │   ├── screens/                   # Screen components (Login, etc.)
    │   ├── services/                  # API integration
    │   │   └── authService.js         # Authentication API calls
    │   ├── store/                     # State management
    │   ├── styles/                    # Global styles
    │   ├── utils/                     # Utility functions
    │   ├── App.jsx                    # Main application component
    │   └── main.jsx                   # Application entry point
    ├── package.json                   # Node.js dependencies
    ├── vite.config.js                 # Vite configuration
    ├── tailwind.config.js             # Tailwind CSS configuration
    ├── postcss.config.js              # PostCSS configuration
    └── eslint.config.js               # ESLint configuration
```

---

## License

This project is proprietary software developed for retail operations management.

---

## Contributing

For contribution guidelines and development standards, please contact the project maintainers.

---

**Built for efficient retail management**
