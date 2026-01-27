# GMB SaaS - Google My Business Management Platform

A comprehensive SaaS solution for managing, optimizing, and tracking Google My Business (GMB) listings. This platform provides advanced tools for local SEO, rank tracking, and competitor analysis using a modern tech stack.

## 🚀 Features

*   **Authentication & User Management**
    *   Google OAuth 2.0 Integration
    *   Credit-based system with tier limits (Free, Pro, Enterprise)
    *   Secure JWT session management

*   **Listing Management**
    *   Import and sync GMB listings
    *   "Smart Search" to find and add businesses via Google Places API
    *   Profile completeness scoring and optimization tips

*   **Local SEO Tools**
    *   **Geo Grid Scan**: Visualize ranking performance across a geographic grid.
    *   **Rank Tracking**: Monitor keyword rankings over time.
    *   **Competitor Analysis**: Analyze top competitors for specific keywords and locations.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Leaflet
*   **Backend**: .NET 8 Web API, Entity Framework Core
*   **Database**: PostgreSQL
*   **Infrastructure**: Docker, Docker Compose

## 📋 Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop)
*   [Node.js 18+](https://nodejs.org/) (for local frontend dev)
*   [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) (for local backend dev)

## ⚙️ Setup & Installation

### 1. clone the repository
```bash
git clone <repository-url>
cd gmb_saas
```

### 2. Configure Environment Variables

**Backend:**
Copy `backend/GmbSaas.Backend/appsettings.example.json` to `appsettings.json` and update the values:
*   `ConnectionStrings`: Your PostgreSQL connection string.
*   `SerpApi:ApiKey`: Your API key from [SerpApi](https://serpapi.com/).

**Frontend:**
Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run with Docker Request (Recommended)

The easiest way to run the entire stack is with Docker Compose.

```bash
docker-compose up --build
```

*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend API**: [http://localhost:8080](http://localhost:8080)
*   **Swagger Docs**: [http://localhost:8080/swagger](http://localhost:8080/swagger)

## 🔧 Local Development

If you prefer to run services individually:

**Backend:**
```bash
cd backend/GmbSaas.Backend
dotnet restore
dotnet run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📝 License

This project is proprietary software. All rights reserved.
