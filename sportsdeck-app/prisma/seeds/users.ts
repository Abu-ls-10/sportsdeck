import { PrismaClient } from "@prisma/client";

export default async function seedUsers(prisma: PrismaClient) {
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "system",
        email: "system@sportsdeck.com",
        username: "system",
        role: "ADMIN",
        isBanned: false
      }
    }),
    prisma.user.create({
      data: {
        email: "abu@sportsdeck.com",
        username: "abu",
        role: "ADMIN",
        passwordHash: "$2b$10$j8drJk6ih851hQHSmR8jM.YToeiJEg6lfm8vwFlD9wbpkrYPgs0MG",
        isBanned: false
      }
    }),
    prisma.user.create({
      data: {
        email: "arsenal@sportsdeck.com",
        username: "arsenalFan"
      }
    }),
    prisma.user.create({
      data: {
        email: "liverpool@sportsdeck.com",
        username: "lfcFan"
      }
    }),
    prisma.user.create({
      data: {
        email: "chelsea@sportsdeck.com",
        username: "chelseaFan"
      }
    })
  ])

  return users
}
