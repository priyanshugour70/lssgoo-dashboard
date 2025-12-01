# Prisma Schema Organization

This directory contains modular Prisma schema files organized by feature. The schemas are automatically merged into a single `schema.prisma` file in the parent directory.

## 📁 File Structure

```
prisma/
├── schemas/
│   ├── base.prisma      # Generator and datasource configuration
│   ├── user.prisma      # User and Profile models
│   ├── rbac.prisma      # Role, Permission, and RBAC models
│   ├── session.prisma   # Session, Token, and Device models
│   ├── audit.prisma     # AuditLog model
│   └── README.md        # This file
├── merge-schemas.js     # Script to merge all schemas
└── schema.prisma        # Auto-generated merged schema (DO NOT EDIT)
```

## 🔄 How It Works

1. **Edit individual schema files** in `prisma/schemas/` directory
2. **Run merge script** to combine them: `pnpm db:merge`
3. **Use Prisma commands** as normal - they automatically merge first

## 📝 Schema Files

### `base.prisma`
- Prisma generator configuration
- Database datasource configuration
- **Must be first** in the merge order

### `user.prisma`
- `User` model - Core authentication and user management
- `Profile` model - Extended user information

### `rbac.prisma`
- `Role` model - User roles
- `Permission` model - Granular permissions
- `RolePermission` model - Role-Permission junction
- `UserRole` model - User-Role junction

### `session.prisma`
- `Session` model - Custom session management
- `RefreshToken` model - Refresh token with rotation
- `AccessToken` model - Access token tracking
- `Device` model - Device tracking
- `LoginHistory` model - Login attempt tracking
- `TokenBlacklist` model - Token blacklisting

### `audit.prisma`
- `AuditLog` model - Admin action tracking

## 🚀 Usage

### Manual Merge
```bash
pnpm db:merge
```

### Automatic Merge (Recommended)
All database commands automatically merge schemas first:
```bash
pnpm db:generate  # Merges + generates Prisma client
pnpm db:push      # Merges + pushes schema to database
pnpm db:migrate   # Merges + creates migration
```

## ⚠️ Important Notes

1. **DO NOT edit `schema.prisma` directly** - It's auto-generated
2. **Edit files in `schemas/` directory** instead
3. **Run `pnpm db:merge`** after making changes to schema files
4. **File order matters** - Update `merge-schemas.js` if adding new files

## ➕ Adding New Schema Files

1. Create your new `.prisma` file in `prisma/schemas/`
2. Add the filename to `SCHEMA_ORDER` array in `merge-schemas.js`
3. Place it in the correct order (base first, then by dependency)
4. Run `pnpm db:merge` to test

## 🔍 Example: Adding a New Feature

Let's say you want to add a `Blog` feature:

1. Create `prisma/schemas/blog.prisma`:
```prisma
// Blog models
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  // ... other fields
}
```

2. Update `prisma/merge-schemas.js`:
```javascript
const SCHEMA_ORDER = [
  'base.prisma',
  'user.prisma',
  'rbac.prisma',
  'session.prisma',
  'audit.prisma',
  'blog.prisma',  // Add here
];
```

3. Run merge:
```bash
pnpm db:merge
```

## 🐛 Troubleshooting

### Merge fails
- Check that all files in `SCHEMA_ORDER` exist
- Verify file syntax is correct
- Check file permissions

### Schema validation errors
- Ensure model names are unique across all files
- Check that relations reference existing models
- Verify enum names don't conflict

### Missing models after merge
- Check that the file is in `SCHEMA_ORDER`
- Verify the file is in `prisma/schemas/` directory
- Run `pnpm db:merge` manually to see errors

