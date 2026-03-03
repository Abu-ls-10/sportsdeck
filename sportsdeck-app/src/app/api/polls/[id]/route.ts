// GET /api/polls/:id
// Returns poll details:
// - question
// - options
// - deadline
// - isClosed
export async function GET(request: Request, { params }: { params: { id: string } }) {}
