---
name: create-migration
description: Create a new Prisma migration with schema validation and safety checks
disable-model-invocation: true
---

# Create Prisma Migration

Guide the user through creating a safe Prisma migration for the DreamCar project.

## Workflow

1. **Understand the change**: Ask what schema change is needed if not specified.

2. **Edit the schema**: Modify `prisma/schema.prisma` with the requested changes.

3. **Validate the schema**:
   ```bash
   npx prisma validate
   ```
   Fix any errors before proceeding.

4. **Generate the migration** (do NOT apply automatically):
   ```bash
   npx prisma migrate dev --create-only --name <descriptive_name>
   ```
   Use snake_case for migration names (e.g., `add_user_model`, `add_horsepower_to_car`).

5. **Review the SQL**: Read the generated SQL file in `prisma/migrations/` and present it to the user.

6. **Check for destructive operations**: Warn the user if the migration contains:
   - `DROP TABLE` or `DROP COLUMN`
   - `ALTER COLUMN` that changes type (potential data loss)
   - Removing `DEFAULT` values from non-nullable columns

7. **Apply only after user approval**:
   ```bash
   npx prisma migrate dev
   ```

8. **Regenerate the client**:
   ```bash
   npx prisma generate
   ```

9. **Update types**: If new models or fields affect TypeScript types in `src/types/`, update them.

## Naming Conventions

- Migration names: `snake_case`, descriptive (e.g., `add_user_preferences_table`)
- Model names: `PascalCase` (e.g., `Car`, `UserPreference`)
- Field names: `camelCase` (e.g., `vehicleType`, `priceLower`)
- Always add `createdAt` and `updatedAt` to new models
- Use `cuid()` for `@id` fields

## Safety Rules

- Never run `prisma migrate reset` without explicit user approval
- Never drop columns or tables without warning
- Always use `--create-only` first so the SQL can be reviewed
