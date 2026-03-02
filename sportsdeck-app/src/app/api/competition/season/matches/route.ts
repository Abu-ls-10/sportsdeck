import { NextResponse } from "next/server";

export async function GET(req: Request){
    // Assert api key exists otherwise a type error will occur
    const apiKey = process.env.X_AUTH_TOKEN;

    if (!apiKey){
        return NextResponse.json({message: "Internal Server Error"}, {status: 500});
    }

    //Get all matches from the 2026 season from football.org
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") ?? "2026-01-01";
    const dateTo = searchParams.get("dateTo") ?? "2026-12-31";
    

    var api_route = "http://api.football-data.org/v4/competitions/PL/matches?dateFrom=" + dateFrom + "&dateTo=" + dateTo;
    
    console.log("Fetching from API:", api_route);

    // At this point, assume the uer put the right info. Just fetch data. If the same url is hit, cache the result
    const response = await fetch(
        api_route, 
        {
            headers: {
                "X-Auth-Token": apiKey
            },
            next: { revalidate: 75}
        }
    );

    // Check if response failed, api might have been the problem
    if (!response.ok){
        return NextResponse.json({message: "Internal Server Error"}, {status: 500});
    }

    return NextResponse.json({matches: await response.json()}, {status: 200});

}