# Swagger API Documentation

The Tamamdır API now includes interactive Swagger/OpenAPI documentation for all endpoints.

## Accessing Swagger UI

Once the backend server is running, open your browser and visit:

```
http://localhost:4000/api/docs
```

## Features

✅ **Interactive endpoint testing** — Try API calls directly from the browser  
✅ **Authentication support** — Test endpoints that require JWT tokens  
✅ **Request/response schemas** — See exactly what data is expected and returned  
✅ **Error documentation** — Understand all possible response codes  
✅ **Parameter descriptions** — Learn what each query/path parameter does  

## Using the Swagger UI

### Testing an authenticated endpoint (e.g., creating a service)

1. Go to **Auth** section
2. Click **POST /api/auth/login** (or /register)
3. Fill in credentials and click **Try it out** → **Execute**
4. Copy the `token` from the response
5. Click the **Authorize** button (lock icon) at the top
6. Paste the token as: `Bearer <your-token-here>`
7. Now you can test protected endpoints like **POST /api/services**

### Available Endpoints by Tag

- **Auth** — Login, register, current user
- **Categories** — Browse service categories
- **Services** — Create, list, search, update services with images
- **Orders** — Place orders, track status, manage workflow
- **Users** — View profiles, update interests, manage avatar
- **Messages** — Conversations and messaging
- **Reviews** — Leave and view service reviews

## Endpoint Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login & get JWT |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/services` | List services |
| `POST` | `/api/services` | Create service |
| `GET` | `/api/orders` | My orders |
| `POST` | `/api/orders` | Place order |
| `GET` | `/api/messages/conversations` | My conversations |

See Swagger UI for complete endpoint list with parameters and examples.

## For Developers

The Swagger spec is generated from JSDoc comments in route files:

```javascript
/**
 * @swagger
 * /api/services:
 *   get:
 *     tags: [Services]
 *     summary: List services
 *     ...
 */
```

To add/update documentation:
1. Edit the JSDoc in `src/routes/*.js`
2. Swagger UI will auto-reload on page refresh
3. No backend restart needed for documentation changes

---

**Server Health Check:** http://localhost:4000/health
