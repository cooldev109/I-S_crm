-- Wipes all data but keeps the seeded admin user and the schema/migrations.
-- Run via:  .\scripts\pg.ps1 psql   then   \i scripts/db-reset.sql
-- or:      psql -f scripts/db-reset.sql ...

TRUNCATE "PendingIntake","Message","Event","Budget","Project","Client" RESTART IDENTITY CASCADE;
