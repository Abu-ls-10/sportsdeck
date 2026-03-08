
export default async function seedPosts(prisma, users, threads) {

  const post1 = await prisma.post.create({
    data: {
      threadId: threads[0].id,
      authorId: users[1].id,
      content: "Arsenal will win 2-1."
    }
  })

  await prisma.reply.create({
    data: {
      postId: post1.id,
      authorId: users[2].id,
      content: "No chance, Liverpool takes this."
    }
  })

  return [post1]
}
