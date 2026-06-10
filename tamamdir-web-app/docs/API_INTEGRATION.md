# API Integration Contract

Base URL: `VITE_API_URL` (default `http://localhost:3000`)

All authenticated endpoints require:
```
Authorization: Bearer <token>
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`
Create a new account.

**Body**
```json
{ "full_name": "string", "email": "string", "password": "string (min 8 chars)" }
```

**Response `201`**
```json
{ "token": "string", "user": { ...User }, "needs_interests": true }
```
`needs_interests: true` → redirect to `/onboarding`.
IYTE emails (`@iyte.edu.tr`, `@std.iyte.edu.tr`) are auto-verified.

**Errors** — `409` email taken · `422` validation

---

### `POST /api/auth/login`
Exchange credentials for a JWT.

**Body**
```json
{ "email": "string", "password": "string" }
```

**Response `200`**
```json
{ "token": "string", "user": { ...User } }
```

**Errors** — `401` invalid credentials · `422` validation

---

### `GET /api/auth/me` *(auth)*
Current user with interests.

**Response `200`**
```json
{
  "id": "uuid", "full_name": "string", "email": "string",
  "avatar_url": "string|null", "is_verified": 0|1, "is_provider": 0|1,
  "department": "string|null", "bio": "string|null",
  "rating": 0.0, "review_count": 0,
  "interests": [{ "id": "uuid", "name": "string", "slug": "string", "icon": "string" }]
}
```

---

## Categories — `/api/categories`

### `GET /api/categories`
All categories (public).

**Response `200`**
```json
[{ "id": "uuid", "name": "string", "slug": "string", "icon": "string", "service_count": 0 }]
```

`icon` is a Material Symbols identifier (e.g. `code`, `sports_tennis`, `palette`).

---

## Services — `/api/services`

### `GET /api/services`
List / search services (public).

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | — | full-text on title + description |
| `category` | string | — | category slug or id |
| `min_price` | number | — | |
| `max_price` | number | — | |
| `sort` | string | `newest` | `newest` `rating` `price_asc` `price_desc` `popular` |
| `page` | number | `1` | |
| `limit` | number | `20` | |

**Response `200`**
```json
{
  "services": [{ ...Service, "cover_image": "string|null" }],
  "pagination": { "total": 0, "page": 1, "limit": 20, "pages": 1 }
}
```

---

### `POST /api/services` *(auth)*
Create a service.

**Body**
```json
{
  "title": "string (max 120)",
  "description": "string (max 2000)",
  "category_id": "uuid",
  "price": 0.0,
  "price_unit": "session|hour|item|day|piece",
  "delivery_days": 1
}
```

**Response `201`** — full Service object

---

### `GET /api/services/:id`
Service detail with images and recent reviews (public).

**Response `200`**
```json
{
  "id": "uuid", "title": "string", "description": "string",
  "price": 0.0, "price_unit": "string", "delivery_days": 1,
  "rating": 0.0, "review_count": 0, "order_count": 0,
  "category_name": "string", "category_slug": "string",
  "provider_name": "string", "provider_avatar": "string|null",
  "provider_verified": 0|1, "provider_rating": 0.0,
  "provider_department": "string|null",
  "images": [{ "id": "uuid", "image_url": "string", "is_cover": 0|1 }],
  "recent_reviews": [{ "id": "uuid", "rating": 5, "comment": "string",
    "reviewer_name": "string", "reviewer_avatar": "string|null" }]
}
```

---

### `PATCH /api/services/:id` *(owner)*
Update service fields — send only changed fields.

### `DELETE /api/services/:id` *(owner)*
Soft-delete (sets `is_active = 0`).

---

## Users — `/api/users`

### `GET /api/users/:id`
Public profile.

### `PATCH /api/users/:id` *(auth, own only)*
Update profile.

**Body** `{ "full_name", "bio", "department", "year": "1st|2nd|3rd|4th|Grad" }`

### `PUT /api/users/:id/interests` *(auth, own only)*
Replace all interest categories (onboarding / settings).

**Body** `{ "category_ids": ["uuid", …] }`

**Response `200`** — updated interests array

---

## Messages — `/api/messages`

### `GET /api/messages` *(auth)*
All conversations for the current user.

### `GET /api/messages/:userId` *(auth)*
Message thread with a specific user.

### `POST /api/messages/:userId` *(auth)*
Send a message.

**Body** `{ "text": "string" }`

---

## Orders — `/api/orders`

### `POST /api/orders` *(auth)*
Place an order.

**Body** `{ "service_id": "uuid", "note": "string" }`

### `GET /api/orders` *(auth)*
Orders for the current user (buyer or seller).

### `PATCH /api/orders/:id` *(auth)*
Update order status.

**Body** `{ "status": "accepted|rejected|completed|cancelled" }`

---

## Reviews — `/api/reviews`

### `POST /api/reviews` *(auth)*
Leave a review after a completed order.

**Body** `{ "order_id": "uuid", "rating": 1–5, "comment": "string" }`
