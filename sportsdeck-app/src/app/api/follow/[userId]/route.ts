// POST /api/follow/:userId
// Authenticated user follows another user.
export async function POST(request: Request, { params }: { params: { userId: string } }) {}

// DELETE /api/follow/:userId
// Unfollows a user.
export async function DELETE(request: Request, { params }: { params: { userId: string } }) {}