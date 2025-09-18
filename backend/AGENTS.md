# Backend Agent Notes

- When changing backend routes or utilities, run `node --check <file>` on the touched modules to catch syntax issues early.
- Keep mentor panic alert flows consistent with mentor escalation requirements and ensure new middleware is added as individual arguments instead of wrapped arrays when Express parsing causes issues.
- Document all backend changes in `docs/Wiki.md` so future contributors understand the context behind updates.
- Double-check route definitions end with their closing `);` pair so `node --check` passes before pushing changes.
- When touching the admin form management endpoints, keep the default template protections intact so system templates are never
  deleted by mistake.
- Admin mentor management now includes routes for linking/unlinking journalers and deleting mentors; ensure mentor/journaler
  integrity checks remain in place and update the wiki when adjusting these flows.
- Admin journaler stewardship now lists mentor relationships and allows deleting journaler accounts via `/admin/journalers` and
  `DELETE /admin/journalers/:id`; keep the aggregated mentor metadata accurate and rely on cascading deletes for related data.
- Admin `/forms` responses must continue returning `creatorName` metadata and the `mentees` association array so the frontend can
  surface who built each form and which journalers are linked.
- Leave the `/forms` creation route restricted to mentors; admins now manage forms without crafting new templates through that
  endpoint.
- The public `/api/auth/expertise` route aggregates mentor profile keywords for registration suggestions—keep its splitting logic
  aligned with the frontend `parseExpertise` helper whenever you adjust how expertise data is stored.
- Mentor registration now mirrors the mentee flow: accounts are created immediately, mentors receive the usual verification
  email, and the follow-up acknowledgement comes from the `mentor_registered_mentor` notification while admins get
  `mentor_registered_admin`. Keep these notices aligned with the registration experience.
