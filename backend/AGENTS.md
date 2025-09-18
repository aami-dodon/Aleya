# Backend Agent Notes

- When changing backend routes or utilities, run `node --check <file>` on the touched modules to catch syntax issues early.
- Keep mentor panic alert flows consistent with mentor escalation requirements and ensure new middleware is added as individual arguments instead of wrapped arrays when Express parsing causes issues.
- Document all backend changes in `docs/Wiki.md` so future contributors understand the context behind updates.
- Double-check route definitions end with their closing `);` pair so `node --check` passes before pushing changes.
- When touching the admin form management endpoints, keep the default template protections intact so system templates are never
  deleted by mistake.
- Admin `/forms` responses must continue returning `creatorName` metadata and the `mentees` association array so the frontend can
  surface who built each form and which journalers are linked.
- Leave the `/forms` creation route restricted to mentors; admins now manage forms without crafting new templates through that
  endpoint.
