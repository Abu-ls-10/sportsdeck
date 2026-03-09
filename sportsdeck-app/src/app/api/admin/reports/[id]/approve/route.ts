// PATCH /api/admin/reports/:id/approve
// Admin approves report.
// Typically hides content, optionally bans user.
// Sets status to APPROVED.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {}
