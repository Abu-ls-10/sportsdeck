export function generateUsername(): string {
  const adjectives = [
    "swift", "silent", "savage", "elite", "clutch",
    "rapid", "cold", "prime", "dynamic", "tactical"
  ];

  const roles = [
    "striker", "playmaker", "winger", "keeper",
    "defender", "midfielder", "finisher", "captain"
  ];

  const fandom = [
    "arsenal", "chelsea", "liverpool", "madrid",
    "barca", "bayern", "city"
  ];

  const extras = ["fan", "ultra", "zone", "hub", "daily"];
  const separators = ["", "_"];

  const number = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 1000)}`;

  const style = Math.floor(Math.random() * 5);

  let username = "";

  switch (style) {
    case 0:
      username = `${rand(adjectives)}${rand(roles)}${number}`;
      break;
    case 1:
      username = `${rand(fandom)}${rand(extras)}${rand(separators)}${number}`;
      break;
    case 2:
      username = `${rand(adjectives)}${rand(roles)}${number}`;
      break;
    case 3:
      username = `${rand(adjectives)}${rand(separators)}${rand(extras)}${number}`;
      break;
    case 4:
      username = `${rand(roles)}${rand(["maestro", "vision", "brain", "iq"])}${number}`;
      break;
  }

  return username.toLowerCase();
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

import { prisma } from "@/lib/prisma";

export async function generateUniqueUsername(): Promise<string> {
  let username = "";
  let exists = true;

  while (exists) {
    username = generateUsername();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    exists = !!user;
  }

  return username;
}