import { PrismaClient } from "../../src/generated/prisma"

interface DateLike {
  getTime: () => number
}

const randomDateBetween = (start: DateLike, end: DateLike): Date => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
}

const pollQuestions = [
  "Who will win the Premier League title this season?",
  "Which team will finish in the top 4?",
  "Who is the best goalkeeper in the Premier League right now?",
  "Which newly promoted team will survive relegation?",
  "Who will win the Golden Boot this season?",
  "Which manager is doing the best job this season?",
  "Who is the most overrated player in the league right now?",
  "Which team has the best squad depth?",
  "Who will be the biggest transfer flop of the season?",
  "Which team will surprise everyone this season?",
  "Who is the best young player under 23 in the league?",
  "Which rivalry is the most intense in the Premier League?",
  "Who will be relegated this season?",
  "Which team plays the most attractive football?",
  "Who is the best captain in the Premier League?",
  "Which stadium has the best atmosphere?",
  "Who will win the most Man of the Match awards this season?",
  "Which team has the best starting eleven on paper?",
  "Who is the most important player to their club?",
  "Which match are you most looking forward to this season?",
  "Who will be the best signing of the January transfer window?",
  "Which team has the hardest fixture list this season?",
  "Who is the best referee in the Premier League?",
  "Which team will have the best defensive record?",
  "Who will score the goal of the season?",
  "Which manager is most likely to get sacked first?",
  "Who is the best dribbler in the Premier League?",
  "Which team performs best under pressure?",
  "Who will win the most headers this season?",
  "Which team has the best academy talent coming through?",
]

const addWeek = (date: DateLike): Date => {
  return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
}

export default async function seedPolls(prisma: PrismaClient, threads: any[]) {
  const shuffled = threads.sort(() => Math.random() - 0.5);
  const potential_selected = shuffled.slice(0, Math.floor(threads.length * 0.30)); // take 30% of threads
  const selected = potential_selected.filter(thread => thread.isHidden === false); // filter out hidden threads


  // thread or to be made polls
  const now = new Date();
  const query = selected.map((thread) => {
    if (thread.isMatchThread && thread.opensAt) {
      const opensAt = new Date(thread.opensAt);
      return {
        threadId: thread.id,
        question: pollQuestions[Math.floor(Math.random() * pollQuestions.length)],
        deadline: randomDateBetween(opensAt, addWeek(opensAt)),
        isClosed: thread.isLocked || (thread.lockedAt ? now > new Date(thread.lockedAt) : false),
      };
    }
    // Team/general thread (or match thread missing opensAt): fallback to createdAt window.
    const start = new Date(thread.createdAt);
    return {
      threadId: thread.id,
      question: pollQuestions[Math.floor(Math.random() * pollQuestions.length)],
      deadline: randomDateBetween(start, addWeek(start)),
      isClosed: !!thread.isLocked,
    };
  })

  const batch = await prisma.poll.createMany({
    data: query,
    skipDuplicates: true,
  });

  const polls = await prisma.poll.findMany({
    where: { threadId: { in: query.map((i:any) => i.threadId) } }
  });

  console.log(`Seeded ${polls.length} polls.`);

  const polloptions = [];

  for (const poll of polls){
    const numOptions = Math.floor(Math.random() * 4) + 2; // 2 to 5 options
    for (let i = 0; i < numOptions; i++){
      polloptions.push({pollId: poll.id, optionText: `Option ${i + 1}`});
    }
  }

  await prisma.pollOption.createMany({
    data: polloptions,
    skipDuplicates: true,
  })

  console.log(`Seeded ${polloptions.length} poll options.`);

  const poptions = await prisma.pollOption.findMany({
    where: { pollId: { in: polloptions.map((i:any) => i.pollId) } }
  });

  return [polls, poptions];
}
