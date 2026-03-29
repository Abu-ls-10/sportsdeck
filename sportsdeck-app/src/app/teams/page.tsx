import TeamsPageClient from "./TeamsPageClient";
import { getCachedTeamsPayload } from "@/lib/teamsData";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const data = await getCachedTeamsPayload();
  return <TeamsPageClient {...data} />;
}
