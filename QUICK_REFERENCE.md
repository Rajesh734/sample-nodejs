# 🎯 Quick Reference Guide

## File Structure

```
sample-nodejs/
├── src/                          # 22 TypeScript source files
│   ├── controllers/              # 4 API controllers
│   ├── services/                 # 5 business logic services
│   ├── routes/                   # Router configuration
│   ├── middlewares/              # 3 middlewares
│   ├── validators/               # Zod schemas
│   ├── utils/                    # Utilities (logger, auth, db)
│   ├── app.ts                    # Express app
│   └── server.ts                 # Server entry point
├── prisma/
│   ├── schema.prisma             # Database definition
│   ├── seed.ts                   # Sample data
│   └── migrations/               # Database migrations
├── tests/                        # 6 test files
│   ├── setup.ts                  # Test setup
│   ├── helpers.ts                # Test utilities
│   ├── people.test.ts
│   ├── events.test.ts
│   ├── contributions.test.ts
│   └── items.test.ts
├── dist/                         # 88 compiled files (built TypeScript)
├── Dockerfile                    # Production container
├── docker-compose.yml            # Full stack setup
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── jest.config.js                # Test config
├── .env.example                  # Environment template
├── README.md                     # Full documentation
├── IMPLEMENTATION_CHECKLIST.md   # Tasks completed
└── node_modules/                 # 485 dependencies
```

---

## Quick Commands

### 🚀 Start Development
```bash
npm run dev              # Start with auto-reload
```

### 🐳 Docker
```bash
docker-compose up       # Start everything
docker-compose down     # Stop everything
docker-compose logs -f  # View logs
```

### 🧪 Testing
```bash
npm test                # Run tests
npm test:watch         # Watch mode
npm test:coverage      # Coverage report
```

### 📦 Production
```bash
npm run build          # Build TypeScript
npm start              # Run production server
npm run lint           # Type check
```

### 🗄️ Database
```bash
npm run prisma:migrate    # Run migrations
npm run prisma:seed       # Seed data
npm run prisma:generate   # Generate client
```

---

## API Quick Test

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Create Person (with token)
```bash
TOKEN="eyJ..."  # Your JWT token
curl -X POST http://localhost:3000/api/people \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmed","fatherName":"Hassan"}'
```

### List People
```bash
curl http://localhost:3000/api/people?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Balance
```bash
curl http://localhost:3000/api/people/UUID/balance \
  -H "Authorization: Bearer $TOKEN"
```

---

## Environment Setup

Create `.env` file:
```
DATABASE_URL=postgres://moi_user:moi_password@localhost:5432/moi_db
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
LOG_LEVEL=info
```

---

## Database Details

**Models**: User, Person, Event, Contribution
**Views**: balance_view (for CASH calculations)
**Soft Delete**: All models use `deletedAt`

### Sample Data Included
- 4 people
- 2 events
- 8 contributions (CASH, GOLD, SILVER, ITEM)

---

## Key Features

✅ **19 API Endpoints** - Fully RESTful
✅ **4 Database Models** - Complete schema
✅ **5 Services** - Clean business logic
✅ **Soft Deletes** - No data loss
✅ **JWT Auth** - Bearer token based
✅ **Zod Validation** - Type-safe schemas
✅ **Jest Tests** - Integration tests
✅ **Docker Ready** - Production deployment

---

## Contribution Modes

| Mode | Fields | Example |
|------|--------|---------|
| **CASH** | amount, currencyCode | 500 EGP |
| **GOLD** | itemQuantity | 25 grams |
| **SILVER** | itemQuantity | 100 grams |
| **ITEM** | itemType, itemQuantity | 1 China set |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / Validation error |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |
| 500 | Server error |

---

## Project Stats

| Metric | Value |
|--------|-------|
| Source Files | 22 |
| Test Files | 6 |
| Endpoints | 19 |
| Models | 4 |
| Services | 5 |
| Controllers | 4 |
| Build Output | 88 files |
| Total Dependencies | 485 packages |
| Code Lines | 3,000+ |

---

## Troubleshooting

### "Cannot connect to database"
- Ensure PostgreSQL is running: `docker-compose up postgres -d`
- Check DATABASE_URL in .env
- Wait 10 seconds for DB startup

### "Port 3000 already in use"
- Change PORT in .env
- Or kill existing process: `lsof -i :3000`

### "Prisma migration failed"
- Run: `npm run prisma:migrate` again
- Or: `docker-compose up postgres && npm run prisma:migrate`

### "Tests not running"
- Install supertest: `npm install supertest`
- Check jest.config.js exists
- Run: `npm test`

---

## Production Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Set NODE_ENV=production
- [ ] Configure DATABASE_URL for production
- [ ] Update LOG_LEVEL if needed
- [ ] Build: `npm run build`
- [ ] Test: `npm test`
- [ ] Deploy: `docker-compose up -d`
- [ ] Verify: `curl http://localhost:3000/api/health`

---

## Support Files

- **README.md** - Full documentation
- **IMPLEMENTATION_CHECKLIST.md** - Tasks completed
- **.env.example** - Environment template
- **Dockerfile** - Container setup
- **docker-compose.yml** - Full stack

---

## Getting Token

For testing, you can use a test token:
```
Header: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Or generate one in code:
```typescript
import { generateToken } from './src/utils/authUtils';
const token = generateToken('user-id', 'user@example.com', 'USER');
```

---

**Backend Status**: ✅ Production Ready
**Last Updated**: March 30, 2026
**Version**: 1.0.0
