// scripts/exportJson.ts
import { prisma } from "@/lib/prisma";
import { writeFileSync } from "fs";

async function main() {
  console.log("Exporting DB to JSON...");

  const data = {
    users: await prisma.user.findMany(),
    follows: await prisma.follow.findMany(),
    threads: await prisma.thread.findMany(),
    posts: await prisma.post.findMany(),
    replies: await prisma.reply.findMany(),
    tags: await prisma.tag.findMany(),
    threadTags: await prisma.threadTag.findMany(),

    polls: await prisma.poll.findMany({
      include: {
        options: true,
      },
    }),

    votes: await prisma.vote.findMany(),
  };

  writeFileSync("seed-data.json", JSON.stringify(data, null, 2));

  console.log("Done → seed-data.json");
}

main().finally(() => prisma.$disconnect());