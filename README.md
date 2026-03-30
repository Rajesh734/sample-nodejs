# Family Contribution Ledger Backend

A production-ready Node.js backend for tracking family contributions (Seimurai/Moi) - financial and non-financial gifts across family events.

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Docker & Docker Compose
- PostgreSQL 15 (for local development)

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL** (Docker)
   ```bash
   docker-compose up postgres -d
   ```

4. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed sample data**
   ```bash
   npm run prisma:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:3000`

### Docker Deployment

```bash
docker-compose up
```

This starts:
- PostgreSQL database (port 5432)
- Backend API (port 3000)

## 📁 Project Structure

```
src/
├── controllers/      # Request handlers
├── services/        # Business logic
├── routes/          # API routes
├── middlewares/     # Express middleware
├── validators/      # Zod schemas & validation
├── utils/           # Utilities (logger, auth, db)
├── types/           # TypeScript types
├── app.ts           # Express app setup
└── server.ts        # Server entry point

prisma/
├── schema.prisma    # Database schema
├── seed.ts          # Seed data
└── migrations/      # Database migrations

tests/               # Jest integration tests
```

## 🗄️ Database Schema

### Models
- **User**: Authentication users with roles (ADMIN/USER)
- **Person**: Family members
- **Event**: Family events (weddings, celebrations, etc.)
- **Contribution**: Financial/non-financial contributions to events

### Contribution Modes
- **CASH**: Money (requires `amount` + `currencyCode`)
- **GOLD**: Gold gifts (requires `itemQuantity`)
- **SILVER**: Silver gifts (requires `itemQuantity`)
- **ITEM**: Other items (requires `itemType` + `itemQuantity`)

### Soft Deletes
All models support soft deletes via `deletedAt` field. No hard deletes.

## 🔌 API Endpoints

All endpoints require Bearer token authentication (except `/api/health`)

### Health Check
```
GET /api/health
```

### People
```
POST   /api/people              # Create person
GET    /api/people              # List people (paginated)
GET    /api/people/:id          # Get person details
PUT    /api/people/:id          # Update person
DELETE /api/people/:id          # Soft delete person
GET    /api/people/:id/balance  # Get person's CASH balance
GET    /api/balances/all        # Get all balances
```

### Events
```
POST   /api/events              # Create event
GET    /api/events              # List events (paginated)
GET    /api/events/:id          # Get event with contributions
PUT    /api/events/:id          # Update event
DELETE /api/events/:id          # Soft delete event
```

### Contributions
```
POST   /api/contributions                   # Create contribution
GET    /api/contributions                   # List contributions (paginated)
GET    /api/contributions/:id               # Get contribution
GET    /api/contributions/person/:personId  # Get person's contributions
PUT    /api/contributions/:id               # Update contribution
DELETE /api/contributions/:id               # Soft delete contribution
```

### Items
```
GET    /api/items/suggestions   # List distinct item types
```

## 🔐 Authentication

### Bearer Token
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

### Example Request
```bash
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:3000/api/people
```

## 📝 Example API Usage

### Create a Person
```bash
curl -X POST http://localhost:3000/api/people \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Hassan",
    "displayName": "Ahmed",
    "fatherName": "Hassan Mohamed",
    "phone": "+1234567890",
    "homeTown": "Cairo"
  }'
```

### Create an Event
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Family Wedding",
    "eventDate": "2024-06-15",
    "location": "Cairo",
    "hostPersonId": "<person-uuid>"
  }'
```

### Create CASH Contribution
```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "<event-uuid>",
    "fromPersonId": "<person-uuid>",
    "toPersonId": "<person-uuid>",
    "type": "GAVE",
    "mode": "CASH",
    "amount": 500,
    "currencyCode": "EGP",
    "notes": "Wedding gift"
  }'
```

### Create GOLD Contribution
```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "<event-uuid>",
    "fromPersonId": "<person-uuid>",
    "toPersonId": "<person-uuid>",
    "type": "GAVE",
    "mode": "GOLD",
    "itemQuantity": 25
  }'
```

### Get Person Balance
```bash
curl http://localhost:3000/api/people/<person-id>/balance \
  -H "Authorization: Bearer <token>"
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

## 🛠 Development Commands

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Lint/type check
npm run lint

# Database migrations
npm run prisma:migrate:dev
npm run prisma:seed
npm run prisma:generate
```

## 🐳 Docker

### Build Image
```bash
docker build -t family-ledger:latest .
```

### Docker Compose
```bash
# Start all services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 🔧 Environment Variables

```
DATABASE_URL=postgres://user:password@host:5432/dbname
PORT=3000
NODE_ENV=development|production
JWT_SECRET=your-secret-key
LOG_LEVEL=info|debug|warn|error
```

## 📊 Logging

Logs are written to:
- **Console**: All logs
- **logs/combined.log**: All logs
- **logs/error.log**: Error logs only

Log levels: `debug`, `info`, `warn`, `error`

## 🔄 Soft Delete Pattern

All models include `deletedAt` field. Deletes are soft (rows not removed):

```typescript
// Soft delete
await prisma.person.update({
  where: { id: personId },
  data: { deletedAt: new Date() }
});

// Query active records only
await prisma.person.findMany({
  where: { deletedAt: null }
});
```

## 🚨 Error Handling

API returns consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad request / Validation error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `500`: Server error

## 🔐 Security Features

- ✅ Soft deletes (no data loss)
- ✅ JWT authentication
- ✅ Role-based access control (ADMIN/USER)
- ✅ Input validation (Zod schemas)
- ✅ Prepared statements (Prisma)
- ✅ CORS enabled
- ✅ Environment variables for secrets

## 📦 Dependencies

**Production:**
- `express` - Web framework
- `@prisma/client` - ORM
- `zod` - Validation
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `winston` - Logging
- `pg` - PostgreSQL driver

**Development:**
- `typescript` - Type safety
- `jest` - Testing
- `supertest` - API testing
- `ts-node` - Run TypeScript directly

## 📄 License

ISC

## 🤝 Contributing

Follow these conventions:
- Services contain business logic
- Controllers handle requests/responses
- Validators use Zod schemas
- Soft delete all records
- Log all errors
- Write tests for new features

## 📞 Support

For issues or questions, create a GitHub issue.
