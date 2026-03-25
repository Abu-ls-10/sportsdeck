import { PrismaClient } from "../../src/generated/prisma"

export default async function seedFollows(prisma: PrismaClient, users: any[]) {

  await prisma.follow.create({
    data: {
      followerId: users[1].id,
      followingId: users[0].id
    }
  })

  await prisma.follow.create({
    data: {
      followerId: users[2].id,
      followingId: users[1].id
    }
  })
}
