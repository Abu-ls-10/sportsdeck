// Creates a new discussion thread.
// User provides:
// - title
// - content (first post usually created separately or internally)
// - optional teamId
// - optional tags
// Used for general or team forums.
export async function POST(request: Request) {}

// Returns paginated list of threads.
// Supports filtering and search:
// - teamId
// - matchId
// - tag
// - authorId
// - search text
// - sorting (recent, top)
export async function GET(request: Request) {}