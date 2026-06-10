# Tamamdır – Backend API

REST API for the **Tamamdır** campus service marketplace (IYTE). Built with Express.js and SQLite (Node 22 built-in).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env config
cp .env.example .env
# Edit JWT_SECRET and CLIENT_URL as needed

# 3. Start (Node 22 required for built-in SQLite)
node --experimental-sqlite server.js

# Or with watch mode (auto-restart on file changes)
node --experimental-sqlite --watch server.js
```

Server starts on `http://localhost:3000`. The SQLite database file `tamamdir.db` is created automatically on first run, along with all tables and seed data (12 categories).

---

## Project Structure

```
tamamdir-backend/
├── server.js                   # Entry point
├── src/
│   ├── app.js                  # Express app + route mounting
│   ├── config/
│   │   └── database.js         # SQLite init, schema, seed, query helpers
│   ├── middleware/
│   │   ├── auth.js             # JWT requireAuth / optionalAuth / signToken
│   │   ├── errorHandler.js     # Global error handler
│   │   └── upload.js           # Multer config (avatars / service images / portfolios)
│   └── routes/
│       ├── auth.js             # /api/auth
│       ├── users.js            # /api/users
│       ├── services.js         # /api/services
│       ├── orders.js           # /api/orders
│       ├── messages.js         # /api/messages
│       ├── reviews.js          # /api/reviews
│       └── categories.js       # /api/categories
└── uploads/
    ├── avatars/                # User profile pictures
    ├── services/               # Service portfolio images
    └── portfolios/             # Additional portfolio items
```

---

## Database Schema

| Table              | Purpose                                         |
|--------------------|-------------------------------------------------|
| `users`            | Accounts – buyers and providers share one table |
| `categories`       | Service categories (Coding, Tennis, etc.)       |
| `user_interests`   | Many-to-many: users ↔ categories (onboarding)  |
| `services`         | Service listings                                |
| `service_images`   | Portfolio images per service                    |
| `orders`           | Transactions between buyer and provider         |
| `conversations`    | Messaging thread index                          |
| `messages`         | Individual chat messages                        |
| `reviews`          | Post-order ratings (1–5 stars + comment)        |
| `notifications`    | In-app notification feed                        |

### Order lifecycle

```
pending → accepted → in_progress → completed
         ↘           ↘              (terminal)
          cancelled   cancelled
```

---

## Authentication

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

Tokens are valid for **7 days**. IYTE university e-mail addresses (`@iyte.edu.tr` / `@std.iyte.edu.tr`) are automatically marked as `is_verified = true`.

---

## API Reference

### Auth – `/api/auth`

| Method | Path         | Auth | Description                     |
|--------|--------------|------|---------------------------------|
| POST   | `/register`  | –    | Create account, returns JWT     |
| POST   | `/login`     | –    | Login, returns JWT              |
| GET    | `/me`        | ✅   | Current user + interests        |

**Register body:**
```json
{ "full_name": "Ayşe Kaya", "email": "a.kaya@std.iyte.edu.tr", "password": "secure123" }
```

**Login body:**
```json
{ "email": "a.kaya@std.iyte.edu.tr", "password": "secure123" }
```

---

### Users – `/api/users`

| Method | Path                      | Auth       | Description                        |
|--------|---------------------------|------------|------------------------------------|
| GET    | `/:id`                    | –          | Public profile + interests         |
| PATCH  | `/:id`                    | ✅ (own)   | Update bio, department, year       |
| POST   | `/:id/avatar`             | ✅ (own)   | Upload avatar (`multipart/form-data`, field: `avatar`) |
| GET    | `/:id/interests`          | –          | List user's selected interests     |
| PUT    | `/:id/interests`          | ✅ (own)   | Replace all interests (onboarding) |
| GET    | `/:id/services`           | –          | Active services by this user       |
| GET    | `/:id/orders`             | ✅ (own)   | Order history (`?role=buyer\|provider`) |

**Update interests body:**
```json
{ "category_ids": ["uuid1", "uuid2"] }
```

---

### Services – `/api/services`

| Method | Path                        | Auth       | Description                     |
|--------|-----------------------------|------------|---------------------------------|
| GET    | `/`                         | –          | Search/browse services          |
| POST   | `/`                         | ✅         | Create a service listing        |
| GET    | `/:id`                      | –          | Full service detail             |
| PATCH  | `/:id`                      | ✅ (owner) | Update service                  |
| DELETE | `/:id`                      | ✅ (owner) | Deactivate service              |
| POST   | `/:id/images`               | ✅ (owner) | Upload images (`multipart`, field: `images`, max 10) |
| DELETE | `/:id/images/:imageId`      | ✅ (owner) | Remove image                    |

**Search query params:**

| Param       | Type   | Default   | Description                                   |
|-------------|--------|-----------|-----------------------------------------------|
| `q`         | string | –         | Free-text search on title & description       |
| `category`  | string | –         | Category slug or UUID                         |
| `min_price` | number | –         | Minimum price (TRY)                           |
| `max_price` | number | –         | Maximum price (TRY)                           |
| `sort`      | string | `newest`  | `newest\|rating\|price_asc\|price_desc\|popular` |
| `page`      | int    | `1`       | Pagination                                    |
| `limit`     | int    | `20`      | Results per page                              |

**Create service body:**
```json
{
  "title": "Python Coding Lessons",
  "description": "Weekly 1-hour sessions, beginner to intermediate.",
  "category_id": "<uuid>",
  "price": 250,
  "price_unit": "session",
  "delivery_days": 1
}
```

---

### Orders – `/api/orders`

| Method | Path               | Auth       | Description                         |
|--------|--------------------|------------|-------------------------------------|
| POST   | `/`                | ✅         | Place an order                      |
| GET    | `/`                | ✅         | My orders (`?role=buyer\|provider`, `?status=`) |
| GET    | `/:id`             | ✅ (party) | Single order detail                 |
| PATCH  | `/:id/accept`      | ✅ (provider) | Accept a pending order           |
| PATCH  | `/:id/start`       | ✅ (provider) | Start work                       |
| PATCH  | `/:id/complete`    | ✅ (provider) | Mark as complete, credit wallet  |
| PATCH  | `/:id/cancel`      | ✅ (party) | Cancel (`{ "reason": "..." }`)      |

**Place order body:**
```json
{ "service_id": "<uuid>", "note": "Available Mon/Wed afternoons", "scheduled_at": "2026-06-10T14:00:00Z" }
```

---

### Messages – `/api/messages`

| Method | Path                              | Auth       | Description                       |
|--------|-----------------------------------|------------|-----------------------------------|
| GET    | `/conversations`                  | ✅         | All conversations + unread counts |
| POST   | `/conversations`                  | ✅         | Start/get conversation            |
| GET    | `/conversations/:id`              | ✅ (party) | Load messages (`?before=`, `?limit=`) |
| POST   | `/conversations/:id`              | ✅ (party) | Send message                      |
| PATCH  | `/conversations/:id/read`         | ✅ (party) | Mark all messages as read         |

**Start conversation body:**
```json
{ "recipient_id": "<user_uuid>" }
```

---

### Reviews – `/api/reviews`

| Method | Path              | Auth  | Description                                |
|--------|-------------------|-------|--------------------------------------------|
| POST   | `/`               | ✅    | Leave a review for a completed order       |
| GET    | `/service/:id`    | –     | All reviews for a service                  |
| GET    | `/user/:id`       | –     | All reviews received by a provider         |

**Post review body:**
```json
{ "order_id": "<uuid>", "rating": 5, "comment": "Super helpful, highly recommend!" }
```

After a review is posted, the service's and provider's average ratings are automatically recalculated.

---

### Categories – `/api/categories`

| Method | Path    | Auth | Description                           |
|--------|---------|------|---------------------------------------|
| GET    | `/`     | –    | All categories with live service count |
| GET    | `/:id`  | –    | Single category (by UUID or slug)     |

---

## Seeded Categories

| Name                | Slug                  | Icon                 |
|---------------------|-----------------------|----------------------|
| Coding Lessons      | coding-lessons        | code                 |
| Tennis Coaching     | tennis-coaching       | sports_tennis        |
| Custom Knitting     | custom-knitting       | yarn                 |
| Graphic Design      | graphic-design        | palette              |
| Language Exchange   | language-exchange     | translate            |
| Photography         | photography           | photo_camera         |
| Instrument Lessons  | instrument-lessons    | music_note           |
| Calculus Tutoring   | calculus-tutoring     | calculate            |
| House Cleaning      | house-cleaning        | cleaning_services    |
| Nail Art            | nail-art              | spa                  |
| Pet Sitting         | pet-sitting           | pets                 |
| Handmade Goods      | handmade-goods        | handyman             |

---

## Error Responses

All errors follow the format:
```json
{ "error": "Human-readable message" }
```

Validation errors return HTTP 422:
```json
{ "errors": [{ "field": "email", "msg": "Valid e-mail required" }] }
```

---

## Notes for Production

- Replace `JWT_SECRET` in `.env` with a cryptographically strong secret
- Add HTTPS / reverse proxy (nginx) in front of Express
- Consider migrating from SQLite to PostgreSQL for multi-instance deployments
- Add rate limiting (e.g. `express-rate-limit`) to auth endpoints
- Set up proper file storage (S3-compatible) instead of local `uploads/`
