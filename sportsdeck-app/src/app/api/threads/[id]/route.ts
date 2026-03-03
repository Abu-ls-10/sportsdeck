// Returns detailed thread information:
// - thread metadata
// - post count
// - poll (if exists)
export async function GET(request: Request) {}

// Allows thread owner or admin to edit:
// - title
// - tags
// - metadata
export async function PATCH(request: Request) {}

// Soft-hides thread.
// Marks isHidden = true.
// Thread remains in DB but not visible to regular users.
export async function DELETE(request: Request) {}