
export default async function seedFollows(prisma, users) {

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
