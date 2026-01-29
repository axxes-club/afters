# MORE_PARTIES Command

This command crawls EDMTrain, Posh.vip, and DICE.fm for new events, migrates their flyers to UploadThing, and syncs the data across all environment databases (Main, Vercel-Dev, Local).

## Usage
When the user says "MORE_PARTIES", the agent should:
1. Search for new events in NYC/Brooklyn area using `google_web_search`.
2. Extract details (title, date, venue, description, flyer URL) using `web_fetch`.
3. Run `scripts/more-parties.ts` with the new data or update the source database.
4. Ensure all `flyerUrl` fields point to `https://utfs.io/f/...` (UploadThing).

## Databases
- **Main**: `MAIN_DATABASE_URL`
- **Vercel-Dev**: `DATABASE_URL`
- **Local**: `LOCAL_DATABASE_URL`

## Implementation
The script `scripts/more-parties.ts` handles:
- Downloading external images and uploading to UploadThing.
- Upserting event records to multiple PostgreSQL instances using Prisma/PG.
