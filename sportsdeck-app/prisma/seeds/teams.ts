import { PrismaClient, Prisma } from "../../src/generated/prisma";
import { DefaultArgs } from "../../src/generated/prisma/runtime/library";

export async function main(prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>){
    const apiKey = process.env.X_AUTH_TOKEN;
    if (!apiKey) throw new Error("Missing X_AUTH_TOKEN");

    const seasons = [2025];
    for (const season of seasons){
        const api_route = `https://api.football-data.org/v4/competitions/PL/teams?season=${String(season)}`;
        let response = await fetch(
            api_route, 
            {
                headers: {
                    "X-Auth-Token": apiKey
                },
            }
        );

        if (!response.ok) {
            console.error(`Failed for season ${season}: ${response.status} ${response.statusText}`)
            const body = await response.text()
            console.error("Response body:", body)
            throw new Error("Failed to fetch teams. API failed")
        }

        const data = await response.json();
        const teams = data["teams"];

        await Promise.all(teams.map((team: any) =>
            prisma.team.upsert({
                where: {externalId: String(team.id)},
                update: {
                    name: team.name,
                    shortName: team.tla,
                    logoUrl: team.crest,
                    venue: team.venue ?? "",
                    cachedAt: new Date()
                },
                create: {
                    externalId: String(team.id),
                    name: team.name,
                    shortName: team.tla,
                    logoUrl: team.crest,
                    venue: team.venue ?? "",
                    cachedAt: new Date()
                }
            })
        ))
    }
    console.log("Teams added!!!");
    return await prisma.team.findMany();
}
