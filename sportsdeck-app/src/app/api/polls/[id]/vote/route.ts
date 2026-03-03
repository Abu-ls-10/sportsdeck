// POST /api/polls/:id/vote
// Casts vote for an option.
// Enforces:
// - one vote per user per poll
// - poll not closed
export async function POST(request: Request, { params }: { params: { id: string } }) {}
