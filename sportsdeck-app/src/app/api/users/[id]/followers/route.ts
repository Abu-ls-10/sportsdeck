// GET /api/users/:id/followers
// Returns list of users following this user.
// Sorted by follow date.
export async function GET(request: Request, { params }: { params: { id: string } }) {}
