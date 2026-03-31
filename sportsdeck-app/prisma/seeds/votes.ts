import { PrismaClient } from "../../src/generated/prisma"


export default async function seedVotes(prisma: PrismaClient, users: any[], polloptions: any[]) {
    const votes = [];
    
    for (const user of users) {
        const numVotes = Math.floor(Math.random() * 5) + 1; // Each user votes on 1 to 5 options
        const shuffledOptions = polloptions.sort(() => 0.5 - Math.random());
        const selectedOptions = shuffledOptions.slice(0, numVotes);
        for (const option of selectedOptions) {
            votes.push({
                userId: user.id,
                pollOptionId: option.id,
                pollId: option.pollId,
            });
        }
    }

    const createdVotes = await prisma.vote.createMany({
        data: votes,
        skipDuplicates: true
    });

    console.log(`Seeded ${createdVotes.count} votes.`);
    return createdVotes;
}