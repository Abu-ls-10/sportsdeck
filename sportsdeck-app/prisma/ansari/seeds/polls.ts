
export default async function seedPolls(prisma, threads) {

  const poll = await prisma.poll.create({
    data: {
      threadId: threads[0].id,
      question: "Who wins?",
      deadline: new Date(Date.now() + 86400000)
    }
  })

  await prisma.pollOption.createMany({
    data: [
      { pollId: poll.id, optionText: "Arsenal" },
      { pollId: poll.id, optionText: "Liverpool" },
      { pollId: poll.id, optionText: "Draw" }
    ]
  })
}
