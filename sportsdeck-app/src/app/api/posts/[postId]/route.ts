// POST /api/posts/:postId/replies
// Creates reply to a specific post.
// Checks:
// - user not banned
// - thread not locked
export async function POST(request: Request, { params }: { params: { postId: string } }) {}

// GET /api/posts/:postId/replies
// Returns all replies under a post.
// Paginated.
export async function GET(request: Request, { params }: { params: { postId: string } }) {}
