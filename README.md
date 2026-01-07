# Personal All-in-One Dashboard

A comprehensive, production-ready personal dashboard application with homelab services integration, featuring a modern dark-themed UI with drag-and-drop widgets.

## 🚀 Features

- **Modern Dark Theme**: Neon-accented dark theme with switchable color schemes (Blue/Orange/Purple)
- **Drag-and-Drop Widgets**: Customizable grid layout with GridStack.js
- **Homelab Integration**: 
  - Docker container management
  - Proxmox VE virtual machine control
  - Pi-hole DNS filtering statistics
  - qBittorrent download monitoring
- **Real-time Updates**: Live system statistics (CPU, RAM, disk, temperature)
- **Mobile Support**: Responsive design with dedicated Flutter mobile app
- **Authentication**: JWT validation with Authentik integration
- **PostgreSQL + Redis**: Persistent storage with intelligent caching

## 🛠 Tech Stack

### Backend (API)
- **Framework**: Fastify (Node.js, TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis (ioredis)
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **Authentication**: JWT validation
- **Validation**: Zod schemas

### Frontend (Web)
- **Framework**: SvelteKit (Vite-powered)
- **UI Library**: Svelte 4+
- **Grid System**: GridStack.js (drag-and-drop masonry layout)
- **Icons**: lucide-svelte
- **HTTP Client**: Auto-generated from OpenAPI
- **State Management**: Svelte stores

### Mobile
- **Framework**: Flutter
- **API Client**: Auto-generated Dart client from OpenAPI

### Infrastructure
- **Package Manager**: pnpm workspaces
- **Build Orchestration**: Turborepo
- **Deployment**: Docker Compose
- **CI/CD**: Forgejo Actions

## 📁 Project Structure

```
my-dashboard/
├── apps/
│   ├── api/                 # Fastify TypeScript API
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   ├── plugins/     # Fastify plugins
│   │   │   ├── db/          # Database schema & client
│   │   │   └── utils/       # Utilities
│   │   ├── migrations/      # Database migrations
│   │   └── Dockerfile
│   │
│   ├── web/                 # SvelteKit frontend
│   │   ├── src/
│   │   │   ├── routes/      # SvelteKit routes
│   │   │   ├── lib/         # Library code
│   │   │   │   ├── components/
│   │   │   │   ├── widgets/
│   │   │   │   ├── stores/
│   │   │   │   └── api/
│   │   │   └── app.html
│   │   ├── static/
│   │   └── Dockerfile
│   │
│   └── mobile/              # Flutter mobile app
│       ├── lib/
│       │   ├── api/         # Generated API client
│       │   └── screens/
│       └── pubspec.yaml
│
├── packages/
│   └── shared/              # Shared types and constants
│       ├── src/
│       │   ├── types/       # Generated TypeScript types
│       │   └── constants.ts
│       └── package.json
│
├── scripts/                 # Build and development scripts
│   ├── generate-openapi.sh
│   ├── generate-clients.sh
│   └── dev.sh
│
├── docker-compose.dev.yml   # Development services
├── docker-compose.prod.yml  # Production deployment
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with pnpm
- Docker and Docker Compose
- PostgreSQL 16+
- Redis 7+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development databases**
   ```bash
   pnpm docker:dev
   ```

4. **Setup environment variables**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   # Edit .env files with your configuration
   ```

5. **Run database migrations**
   ```bash
   pnpm --filter api db:migrate
   ```

6. **Generate API clients**
   ```bash
   pnpm generate:clients
   ```

7. **Start development servers**
   ```bash
   pnpm dev
   ```

The application will be available at:
- **API**: http://localhost:3000
- **Web**: http://localhost:5173
- **API Docs**: http://localhost:3000/docs

### Production Deployment

1. **Build and push Docker images**
   ```bash
   pnpm build
   docker build -t registry.home.arpa/dashboard-api:latest ./apps/api
   docker build -t registry.home.arpa/dashboard-web:latest ./apps/web
   docker push registry.home.arpa/dashboard-api:latest
   docker push registry.home.arpa/dashboard-web:latest
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🔧 Configuration

### Environment Variables

#### API (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dashboard

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentik (JWT validation)
AUTHENTIK_ISSUER=https://auth.home.arpa
AUTHENTIK_JWKS_URL=https://auth.home.arpa/.well-known/jwks.json

# External Services
PROXMOX_API=https://proxmox.home.arpa:8006/api2/json
PROXMOX_TOKEN_ID=dashboard@pve!api
PROXMOX_TOKEN_SECRET=your_token_secret
DOCKER_SOCKET=/var/run/docker.sock
PIHOLE_API=http://pihole.home.arpa/admin/api.php
PIHOLE_TOKEN=your_pihole_token
QBITTORRENT_URL=http://qbittorrent.home.arpa:8080
QBITTORRENT_USER=admin
QBITTORRENT_PASS=your_password
OPENWEATHER_API_KEY=your_api_key
OPENWEATHER_CITY=Warsaw
```

#### Web (.env)
```bash
PUBLIC_API_URL=http://localhost:3000
```

## 🎨 Theme System

The dashboard supports three color themes:

- **Blue** (default): `--accent-primary: #00d4ff`
- **Orange**: `--accent-primary: #ff6b35`
- **Purple**: `--accent-primary: #9d4edd`

Themes can be switched in the UI or by setting the `data-theme` attribute on the document root.

## 📱 Widget System

### Built-in Widgets

1. **System Stats**: CPU, RAM, disk, and temperature monitoring
2. **Docker Quick**: Container management interface
3. **Pi-hole Stats**: DNS filtering statistics
4. **qBittorrent Stats**: Download monitoring
5. **Notes**: Personal notes with auto-save

### Creating Custom Widgets

1. **Define the widget type** in `src/lib/widgets/registry.ts`
2. **Create the Svelte component** in `src/lib/widgets/`
3. **Add to widget registry** with default size and configuration
4. **Register in main page** component mapping

Example:
```typescript
// registry.ts
'my-custom-widget': {
  type: 'my-custom-widget',
  name: 'My Custom Widget',
  description: 'Custom widget description',
  icon: 'star',
  defaultSize: { w: 3, h: 2 },
  category: 'system',
}
```

## 🔌 API Documentation

Interactive API documentation is available at `/docs` when running the API server. The documentation is auto-generated from OpenAPI specifications and includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests

## 🧪 Testing

Run tests for all packages:
```bash
pnpm test
```

Run tests for specific package:
```bash
pnpm --filter api test
pnpm --filter web test
```

## 📊 Performance

### Caching Strategy
- **System Stats**: 5-second cache
- **Docker Containers**: 30-second cache
- **Pi-hole Stats**: 60-second cache
- **qBittorrent Stats**: 30-second cache
- **Weather**: 5-minute cache

### Optimization Features
- Lazy loading of widgets
- Connection pooling for PostgreSQL (max 20 connections)
- Redis caching with TTL
- Optimized Docker images with multi-stage builds

## 🔒 Security

- JWT token validation for mobile endpoints
- CORS configuration with allowed origins
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with proper content headers

## 📱 Mobile App

The Flutter mobile app provides:
- Native performance on iOS and Android
- OAuth2 authentication flow
- Real-time data synchronization
- Push notifications (future enhancement)

### Building Mobile App
```bash
cd apps/mobile
flutter pub get
flutter build apk  # Android
flutter build ios  # iOS
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by homelab dashboard solutions
- Designed for personal use and learning

---

**Built with ❤️ by Michał using modern web technologies**