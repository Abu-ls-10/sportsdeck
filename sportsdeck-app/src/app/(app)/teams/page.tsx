import TeamsPageClient from "./TeamsPageClient";
import { fetchTeamsPayload } from "@/lib/teamsData";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const data = await fetchTeamsPayload();
  return <TeamsPageClient {...data} />;
}
