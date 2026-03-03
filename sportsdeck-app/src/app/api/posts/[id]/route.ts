// PATCH /api/posts/:id
// Allows post owner to edit content.
// Creates PostVersion record.
// Sets isEdited = true.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {}

// DELETE /api/posts/:id
// Soft-hides post.
// Only owner or admin allowed.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {}