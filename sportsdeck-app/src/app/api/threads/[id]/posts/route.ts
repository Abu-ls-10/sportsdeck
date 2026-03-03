// POST /api/threads/:threadId/posts
// Creates a new top-level post inside a thread.
// Checks:
// - user is not banned
// - thread is not locked
// Stores post content.
export async function POST(request: Request, { params }: { params: { id: string } }) {}

// GET /api/threads/:threadId/posts
// Returns all posts for a thread.
// Paginated.
// Excludes hidden posts for normal users.
export async function GET(request: Request, { params }: { params: { id: string } }) {}