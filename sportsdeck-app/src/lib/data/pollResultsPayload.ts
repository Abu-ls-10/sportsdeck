import { prisma } from "@/lib/prisma"

export type PollResultsPayload = {
  pollId: string
  question: string
  results: { id: string; optionText: string; votes: number }[]
}

/** Returns null if poll missing or hidden (do not cache). */
export async function loadPollResultsPayload(
  pollId: string
): Promise<PollResultsPayload | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
    },
  })

  if (!poll || poll.isHidden) return null

  const results = poll.options.map((option) => ({
    id: option.id,
    optionText: option.optionText,
    votes: option._count?.votes ?? 0,
  }))

  return {
    pollId: poll.id,
    question: poll.question,
    results,
  }
}
