# SportsDeck Database Backup & Restore Guide

## 🐳 Docker Postgres Setup

**Container Name:** `sportsdeck-db`  
**Database User:** `sportsdeck`  
**Database Name:** `sportsdeck`

---

## 📦 Export Database (Backup)

Run:

```
docker exec -t sportsdeck-db pg_dump -U sportsdeck sportsdeck > dump.sql
```

This creates a file `dump.sql` in your current directory containing:
- full schema
- all data

---

## 🔁 Import Database (Restore)

### Standard Import

```
docker exec -i sportsdeck-db psql -U sportsdeck -d sportsdeck < dump.sql
```

---

### ⚠️ Clean Import (Recommended)

If your database already has data, reset it first:

```
docker exec -it sportsdeck-db psql -U sportsdeck -d sportsdeck -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Then import:

```
docker exec -i sportsdeck-db psql -U sportsdeck -d sportsdeck < dump.sql
```

---

## 🔍 Verify Database

```
docker exec -it sportsdeck-db psql -U sportsdeck -d sportsdeck -c "\dt"
```

---

## 💡 Notes

- Make sure your container is running: `docker ps`
- Ensure `dump.sql` is in your current directory
- Use clean import if you see duplicate key errors

---

## 🏆 Summary

- Export → `pg_dump`
- Import → `psql < dump.sql`
- Reset → drop & recreate schema

