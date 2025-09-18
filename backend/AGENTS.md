# Backend Agent Notes

- When changing backend routes or utilities, run `node --check <file>` on the touched modules to catch syntax issues early.
- Keep mentor panic alert flows consistent with mentor escalation requirements and ensure new middleware is added as individual arguments instead of wrapped arrays when Express parsing causes issues.
- Document all backend changes in `docs/Wiki.md` so future contributors understand the context behind updates.
