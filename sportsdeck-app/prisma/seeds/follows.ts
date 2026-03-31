import { PrismaClient } from "../../src/generated/prisma"
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export default async function seedFollows(prisma: PrismaClient, users: any[]) {
  const query = [];

  for (const user of users) {
    // Choose people not including self
    const others = users.filter(u => u.id != user.id);

    // Randomly follow users-1 people, minimum 1
    const numToFollow = randInt(1, others.length);

    // Shuffle people
    const shuffled = others.sort(() => 0.5 - Math.random());
    
    // Take first numToFollow people
    const toFollow = shuffled.slice(0, numToFollow);

    // Add it to toFollow list
    query.push(...toFollow.map(u => {
      return {
        followerId: user.id,
        followingId: u.id
      }
    }))
  }

  const follows = await prisma.follow.createMany({
    data: query,
    skipDuplicates: true
  })

  console.log(`Seeded ${follows.count} follows.`);
  return follows;

}
