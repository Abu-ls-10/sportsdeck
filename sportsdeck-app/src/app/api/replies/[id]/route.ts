// PATCH /api/replies/:id
// Allows reply owner to edit.
// Creates ReplyVersion record.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {}

// DELETE /api/replies/:id
// Soft-hides reply.
// Owner or admin only.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {}
