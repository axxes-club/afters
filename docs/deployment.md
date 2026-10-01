
## Production delivery from main

Pushes to `main` run `.github/workflows/gcp-production.yml`, authenticate to Google without stored keys, and submit `cloudbuild.yaml` in project `gravy-meta` (build metadata region `global`; production runtime and artifacts in `us-west1`). The pipeline retains Linux checks, final-image secret scanning, immutable image deployment, staged readiness and rollback. `deploy/gcp` is retained as migration history and no longer triggers production. Superseded queued commits are skipped before build submission. Runtime secrets and database authority are managed separately; production releases preserve current Cloud Run configuration.

The former Neon-specific manual migration workflow is archived in `docs/legacy/neon-migration-workflow.yml`; it must not run against the fenced source database. Apply reviewed schema migrations through the authoritative Cloud SQL runtime. Browser tests require an isolated `E2E_DATABASE_URL`, never the production database secret.
