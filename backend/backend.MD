# Fotobook Backend Overview

This document reflects the current Express server state for the Fotobook backend.

## 1. Purpose

The backend is a TypeScript + Express API that currently provides:

- authentication and session management
- user profiles, follows, and account management
- photo and album CRUD plus likes
- feed and discovery endpoints
- image upload support for photos and avatars
- Prisma-backed persistence with PostgreSQL

## 2. Server entry point

The server starts in [backend/src/index.ts](backend/src/index.ts).

Current responsibilities:

- create the Express app
- enable CORS for the frontend
- parse JSON and cookies
- serve uploaded files from /uploads
- mount the main API router at /api
- register a centralized error handler

## 3. Current route structure

All API routes are mounted under /api through [backend/src/routes/index.ts](backend/src/routes/index.ts).

### Authentication

- [backend/src/routes/auth.routes.ts](backend/src/routes/auth.routes.ts)
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/verify-email
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Photos

- [backend/src/routes/photos.routes.ts](backend/src/routes/photos.routes.ts)
- POST /api/photos
- PUT /api/photos/:id
- DELETE /api/photos/:id
- POST /api/photos/:id/like

### Albums

- [backend/src/routes/albums.routes.ts](backend/src/routes/albums.routes.ts)
- POST /api/albums
- PUT /api/albums/:id
- DELETE /api/albums/:id
- POST /api/albums/:id/like
- POST /api/albums/:id/photos
- POST /api/albums/:id/photos/existing
- DELETE /api/albums/:id/photos/:photoId

### Feed and discovery

- [backend/src/routes/feed.routes.ts](backend/src/routes/feed.routes.ts)
- GET /api/feed/photos
- GET /api/feed/albums
- GET /api/discovery/photos
- GET /api/discovery/albums

### Users

- [backend/src/routes/users.routes.ts](backend/src/routes/users.routes.ts)
- GET /api/users/:id
- GET /api/users/current/profile
- PUT /api/users/current/profile
- POST /api/users/current/change-password
- POST /api/users/:id/follow
- DELETE /api/users/:id/follow
- GET /api/users/users
- POST /api/users/:id/deactivate
- POST /api/users/:id/reactivate
- DELETE /api/users/:id

### Admin

- [backend/src/routes/admin.routes.ts](backend/src/routes/admin.routes.ts)
- GET /api/admin/photos
- GET /api/admin/albums

## 4. Application architecture

The server follows a layered structure:

1. Routes receive HTTP requests.
2. Controllers handle request and response flow.
3. Services contain the business logic.
4. Prisma performs database access.
5. Middleware enforces authentication, validation, uploads, and errors.

### Controllers

- [backend/src/controllers](backend/src/controllers)

### Services

- [backend/src/services](backend/src/services)

### Middleware

- [backend/src/middlewares/auth.middleware.ts](backend/src/middlewares/auth.middleware.ts)
- [backend/src/middlewares/validate.ts](backend/src/middlewares/validate.ts)
- [backend/src/middlewares/upload.ts](backend/src/middlewares/upload.ts)
- [backend/src/middlewares/error-handler.ts](backend/src/middlewares/error-handler.ts)

## 5. Authentication and authorization

Authentication uses JWT access tokens and refresh tokens.

Current behavior:

- access tokens are sent in the Authorization: Bearer <token> header
- refresh tokens are stored in an httpOnly cookie named refreshToken
- protected routes require a valid access token
- optional-auth routes allow guests to access the same endpoints with different behavior
- admin routes require both authentication and an admin role

## 6. Upload handling

Image uploads are handled by multer in [backend/src/middlewares/upload.ts](backend/src/middlewares/upload.ts).

Current limits:

- photos/albums: 5 MB
- avatars: 2 MB

Allowed types:

- JPEG
- PNG
- GIF

Uploaded files are stored under the configured upload directory and served from /uploads.

## 7. Validation and schemas

Request validation is implemented through Zod schemas in [backend/src/schemas](backend/src/schemas).

This covers:

- auth payloads
- photo payloads
- album payloads
- profile updates and password changes

## 8. Prisma and database layer

The Prisma schema lives in [backend/src/prisma/schema.prisma](backend/src/prisma/schema.prisma).

It currently models:

- users and auth-related tokens
- photos and albums
- album-photo links
- follows
- likes
- standalone-vs-album photo state via isStandalone

## 9. Error handling

The global error handler in [backend/src/middlewares/error-handler.ts](backend/src/middlewares/error-handler.ts) normalizes errors into consistent HTTP responses.

Examples:

- validation failures return 400
- auth failures return 401
- permission problems return 403
- duplicate records return 409
- upload issues return 400 with friendly messages

## 10. Current implementation notes

- email verification and password reset links are currently logged to the server console instead of being emailed
- admin endpoints are only available to accounts with the admin role
- refresh-token rotation and replay detection are now implemented
- the server currently uses local file uploads and serves them under /uploads
