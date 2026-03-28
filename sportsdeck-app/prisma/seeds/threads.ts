import { PrismaClient } from "../../src/generated/prisma"
import type { User, Team, Match, Tag } from "../../src/generated/prisma"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type MatchWithTeams = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
}

// Default thread titles for match threads
const preMatchTitles = [
  "Pre-match discussion thread",
  "Match day thread",
  "Your predictions for today",
  "Lineup discussion"
];

const postMatchTitles = [
  "Post-match analysis",
  "Match reactions",
  "Player ratings thread",
  "What did we learn today?"
];

// Default thread titles for team forums
const teamThreadTitles = [
  "Team form discussion",
  "Transfer rumors and news",
  "Upcoming fixtures preview",
  "Recent performance analysis",
  "Player spotlight discussion",
  "Squad depth and tactics",
  "Manager's strategies",
  "Fan expectations for the season",
  "Historical retrospective",
  "Best moments from last season",
  "Comparing squad depth",
  "Injury updates and concerns",
  "Youth academy prospects",
  "Reserve team updates",
  "Community meet-up ideas"
];

// Available tags for threads
const availableTags = [
  "discussion",
  "analysis",
  "tactics",
  "team-news",
  "transfer",
  "player-performance",
  "injury",
  "fixture",
  "season",
  "history",
  "highlight",
  "prediction",
  "match-thread",
  "live" 
];

async function getOrCreateTags(prisma: PrismaClient, tagNames: string[]) {
  const tags = await Promise.all(
    tagNames.map(name =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );
  return tags;
}

export async function create_different_match_threads(prisma: PrismaClient, matches: MatchWithTeams[], users: User[], matchTags: Tag[]){
  const now = new Date();
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;  
    
  if (users.length === 0) {
    console.warn("No users available, skipping match thread creation");
    return [];
  }
  
  // Filter and process matches
  const matchThreadsToCreate = matches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      // Only create threads for matches within 2 weeks past or future from now
      const timeDiff = matchDate.getTime() - now.getTime();
      return timeDiff <= oneYearInMs && timeDiff >= -(oneYearInMs);
      
    })
    .map(match => {
      const matchDate = new Date(match.matchDate);
      const timeSinceMatch = now.getTime() - matchDate.getTime();
      const isPast = timeSinceMatch > 0;
      
      return {
        match,
        isPast,
        opensAt: new Date(matchDate.getTime() - twoWeeksInMs),
        lockedAt: new Date(matchDate.getTime() + twoWeeksInMs),
        isLocked: now.getTime() > matchDate.getTime() + twoWeeksInMs || matchDate.getTime() - now.getTime() > twoWeeksInMs

      };
    });

  // Create threads
  const createdThreads = await Promise.all(
    matchThreadsToCreate.map(async (threadData) => {
      const titlePool = threadData.isPast ? postMatchTitles : preMatchTitles;
      const randomAuthor = users[Math.floor(Math.random() * users.length)];
      const homeTeamName = threadData.match.homeTeam?.name || "Team A";
      const awayTeamName = threadData.match.awayTeam?.name || "Team B";
      
      const thread = await prisma.thread.create({
        data: {
          title: `${homeTeamName} vs ${awayTeamName} - ${titlePool[Math.floor(Math.random() * titlePool.length)]}`,
          authorId: randomAuthor.id,
          matchId: threadData.match.id,
          isMatchThread: true,
          isLocked: threadData.isLocked,
          opensAt: threadData.opensAt,
          lockedAt: threadData.lockedAt,
        }
      });

      // Add random tags to the thread
      const numTags = Math.min(Math.floor(Math.random() * 3) + 1, matchTags.length);
      const uniqueTags = shuffle(matchTags).slice(0, numTags).map(t => t.id)

      
      await Promise.all(
        uniqueTags.map(tagId =>
          prisma.threadTag.create({
            data: {
              threadId: thread.id,
              tagId
            }
          }).catch((e) => {
            if (!e.message.includes('Unique constraint')) {
              throw e;
            }
          })
        )
      );

      return thread;
    })
  );

  const validThreads = createdThreads.filter(t => t !== null);
  console.log(`Match threads created: ${validThreads.length}`);
  return validThreads;
}

export async function create_threads_for_teams(prisma: PrismaClient, teams: Team[], users: User[], teamTags: Tag[]) {
  if (users.length === 0) {
      console.warn("No users available, skipping team thread creation");
      return [];
  }
  const allTeamThreads = (await Promise.all(
  teams.map(async (team) => {
      const numThreadsForTeam = Math.floor(Math.random() * 5) + 1;

      const teamThreads = await Promise.all(
        Array.from({ length: numThreadsForTeam }).map(async () => {

          const randomAuthor = users[Math.floor(Math.random() * users.length)];
          const threadTitle = teamThreadTitles[Math.floor(Math.random() * teamThreadTitles.length)];

          const thread = await prisma.thread.create({
            data: {
              title: `[${team.shortName}] ${threadTitle}`,
              authorId: randomAuthor.id,
              teamId: team.id,
              isMatchThread: false,
              isLocked: false,
            }
          });

          const numTags = Math.min(Math.floor(Math.random() * 3) + 2, teamTags.length);
          const uniqueTags = shuffle(teamTags).slice(0, numTags).map(t => t.id);    

          await Promise.all(
            uniqueTags.map(tagId =>
              prisma.threadTag.create({
                data: { threadId: thread.id, tagId }
              }).catch((e) => {
                if (!e.message.includes('Unique constraint')) throw e;
              })
            )
          );

          // Team forum threads only (thread.teamId). Match center uses Thread.matchId
          // threads and never shows these posts.
          const numInitialPosts = Math.floor(Math.random() * 3) + 1;
          await Promise.all(
            Array.from({ length: numInitialPosts }).map(async () => {
              const postAuthor = users[Math.floor(Math.random() * users.length)];
              const postContents = [
                `Great discussion starter! I think we should focus more on defense.`,
                `Does anyone else think the team needs reinforcement in midfield?`,
                `The performance has been improving lately. I'm optimistic about the future.`,
                `Tough match ahead, but I believe in our squad's ability to deliver.`,
                `Looking at the stats, our attack has been more effective recently.`,
                `The manager is doing a good job with team coordination.`,
                `What are your thoughts on the recent tactical changes?`,
                `I'm impressed with the recent form of the younger players.`,
                `The team spirit seems to be at an all-time high this season.`
              ];

              await prisma.post.create({
                data: {
                  threadId: thread.id,
                  authorId: postAuthor.id,
                  content: postContents[Math.floor(Math.random() * postContents.length)]
                }
              });
            })
          );

          return thread;
        })
      );

      return teamThreads.filter(t => t !== null);
    })
  )).flat();

  console.log(`Team threads created: ${allTeamThreads.length}`);
  return allTeamThreads;
}



export default async function seedThreads(prisma: PrismaClient, users: User[], teams: Team[], matches: MatchWithTeams[]) {
  const allTags = await getOrCreateTags(prisma, availableTags);  
  const matchOnlyTagNames = ["match-thread", "live", "prediction", "analysis", "tactics"];
  const teamOnlyTagNames  = ["discussion", "team-news", "transfer", "player-performance", "injury", "fixture", "season", "history", "highlight"];

  const matchTags = allTags.filter(t => matchOnlyTagNames.includes(t.name));
  const teamTags  = allTags.filter(t => teamOnlyTagNames.includes(t.name));

  const match_threads = await create_different_match_threads(prisma, matches, users, matchTags);
  const team_threads  = await create_threads_for_teams(prisma, teams, users, teamTags);

  console.log("Threads added!!!")
  return [...match_threads.filter(t => t !== null), ...team_threads.filter(t => t !== null)]
}
