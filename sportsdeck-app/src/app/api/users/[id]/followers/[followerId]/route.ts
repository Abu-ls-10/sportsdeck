// DELETE /api/users/:id/followers/:followerId
// Allows user to remove a follower.
export async function DELETE(request: Request, { params }: { params: { id: string; followerId: string } }) {}
