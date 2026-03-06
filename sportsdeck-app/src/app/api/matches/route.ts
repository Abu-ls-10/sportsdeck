import { Match } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";




interface API_Match{
    id: number,
    utcDate: string, 
    status: string, 
    homeTeam: {id: number, name: string, tla: string, crest: string, venue: string},
    awayTeam: {id: number, name: string, tla: string, crest: string, venue: string},
    matchday: number,
    venue: string,
    score: {winner: string, fulltime: {home: number | null, away: number | null}}
    season: {startDate: string, endDate: string},
    stage: string
}

async function upsert_match(match: API_Match){
    return await prisma.match.upsert({
        where: {externalId: String(match.id)},
        update: {
            status: match.status,
            venue: match.venue ?? "",
            homeScore: match.score.fulltime.home,
            awayScore: match.score.fulltime.away,
            matchDate: new Date(match.utcDate),
            cachedAt: new Date()
        },
        create: {
            externalId: String(match.id),
            venue: match.venue ?? "",
            status: match.status,
            homeScore: match.score.fulltime.home,
            awayScore: match.score.fulltime.away,
            cachedAt: new Date(),
            matchDate: new Date(match.utcDate),
            homeTeam: {connect: {externalId: String(match.homeTeam.id)}}, 
            awayTeam: {connect: {externalId: String(match.awayTeam.id)}}, 
            matchday: match.matchday,
            season: `${new Date(match.season.startDate).getFullYear()}-${new Date(match.season.endDate).getFullYear()}`,
            stage: match.stage
        }
    })
}



export async function GET(req: Request){
    // Assert api key exists otherwise a type error will occur
    const apiKey = process.env.X_AUTH_TOKEN;

    if (!apiKey){
        return NextResponse.json({message: "Internal Server Error"}, {status: 500});
    }

    // Get the date range. Ensure that they exist before moving on
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (!dateFrom || !dateTo){
        return NextResponse.json({message: "Must provide a range"}, {status: 401});
    }

    if (isNaN(new Date(dateFrom).getTime()) || isNaN(new Date(dateTo).getTime())) {
        return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
    }

    // Make a call to the database
    let matches = await prisma.match.findMany({
        where: {
            matchDate: {
                gte: new Date(dateFrom),
                lte: new Date(dateTo)
            }
        },
        orderBy: {matchDate: "asc"},
        include: {
            homeTeam: true,
            awayTeam: true,
        }
    })

    // Check if there are any matches in that range AND if there is atleast one stale
    const check_freshness = (match: Match) => {
        // Get the time difference
        const time_difference = Date.now() - match.cachedAt.getTime();

        // Finished games should not be refreshed
        if (match.status === "FINISHED"){
            return false;
        }

        // If the game is live, check for a live refresh (1 min in this case)
        if (match.status === "IN_PLAY" || match.status === "PAUSED"){
            return time_difference > 60_000;
        }

        // if any other status, it can be updated after 10 mins
        return time_difference > 10*60_000;
    }

    const is_stale = matches.length === 0 || matches.some(match => check_freshness(match));

    // If the matches are fresh, return them
    if (!is_stale ){
        return NextResponse.json({matches: matches}, {status: 200});
    }


    const api_route = "https://api.football-data.org/v4/competitions/PL/matches?dateFrom=" + dateFrom + "&dateTo=" + dateTo;
    // At this point, assume the uer put the right info. Just fetch data. If the same url is hit, cache the result
    const response = await fetch(
        api_route, 
        {
            headers: {
                "X-Auth-Token": apiKey
            },
        }
    );

    if (!response.ok){
        // Dont break the server, just return stale data
        return NextResponse.json({matches: matches}, {status: 200});
    }


    // Update all database tables in that date range and return that
    const matches_api = (await response.json())["matches"];
    await Promise.all(matches_api.map((match: API_Match) => upsert_match(match)));

    matches = await prisma.match.findMany({
    where: {
        matchDate: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo)
        }
    },
    orderBy: { matchDate: "asc" },
    include: { homeTeam: true, awayTeam: true }
    })

    return NextResponse.json({matches: matches}, {status: 200});

}