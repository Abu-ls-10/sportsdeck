import { prisma } from "@/lib/prisma";
import { PrismaClient } from "../../src/generated/prisma";
import { hashPassword } from "@/lib/auth";

// Helper arrays for generating varied user data
const firstNames = [
  "Alex", "Jordan", "Casey", "Morgan", "Taylor", "Riley", "Cameron", "Blake",
  "Alex", "Chris", "Sam", "Jamie", "Quinn", "Dakota", "Avery", "Skyler",
  "River", "Phoenix", "Sage", "Mason", "Logan", "Oliver", "Wyatt", "Eli",
  "Lucas", "Liam", "Noah", "Benjamin", "Henry", "Harper", "Evelyn", "Amelia",
  "Isabella", "Mia", "Olivia", "Ava", "Emma", "Charlotte", "Sophia", "Scarlett",
  "Victoria", "Aria", "Grace", "Chloe", "Gabriel", "Michael", "Ethan", "Jacob",
  "Jackson", "Sebastian", "Aiden", "Matthew", "Samuel", "David", "Joseph", "Carter",
  "Adrian", "Thomas", "James", "Ryan", "Benjamin", "Daniel", "Dylan", "Nicholas",
  "Tyler", "Andrew", "Kevin", "Brian", "Edward", "Ronald", "Anthony", "Frank",
  "Ryan", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin",
  "Sophia", "Isabella", "Emma", "Olivia", "Ava", "Emily", "Abigail", "Mia"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Young",
  "Strokes", "Walker", "Hall", "Allen", "King", "Wright", "Lopez", "Hill",
  "Scott", "Green", "Adams", "Nelson", "Carter", "Roberts", "Edwards", "Collins",
  "Reeves", "Stewart", "Morris", "Rogers", "Morgan", "Peterson", "Cooper",
  "Brady", "Holmes", "Morrison", "Howell", "Meadows", "Parks", "Summers", "Gates",
  "Hicks", "Crawford", "Henry", "Boyd", "Mason", "Foster", "Luna", "Garrison"
];

const adjectives = [
  "swift", "bright", "bold", "clever", "cool", "daring", "epic", "fierce",
  "glory", "harmony", "icon", "jazzy", "kingly", "lively", "mighty", "noble",
  "optimist", "prime", "quest", "rebel", "storm", "titan", "ultra", "viper",
  "warrior", "xtreme", "zenith", "apex", "blaze", "crown", "dream", "elite"
];

const avatarSources = [
  "https://i.pravatar.cc/",
  "https://avatars.dicebear.com/api/avataaars/",
  "https://avatars.dicebear.com/api/bottts/"
];

// Generate a random string suitable for usernames/domains
function generateRandomString(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a unique username
function generateUsername(): string {
  const variants = [
    () => firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase() + 
           Math.floor(Math.random() * 999),
    () => adjectives[Math.floor(Math.random() * adjectives.length)] + 
           firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase(),
    () => firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase() + 
           "_" + lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase(),
    () => adjectives[Math.floor(Math.random() * adjectives.length)] + 
           Math.floor(Math.random() * 99),
  ];
  
  const variant = Math.floor(Math.random() * variants.length);
  return variants[variant]();
}

// Generate a unique email
function generateEmail(username: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "protonmail.com", "sportsman.net"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}${Math.floor(Math.random() * 9999)}@${domain}`;
}

// Generate a random password
function generatePassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = "";
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  while (password.length < 12) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Generate a random avatar URL
function generateAvatarUrl(): string {
  const source = avatarSources[Math.floor(Math.random() * avatarSources.length)];
  const seed = generateRandomString(12);
  return `${source}${seed}?s=200`;
}

export async function create_admins() {
  const adminPasswordHash =
    "$2b$10$j8drJk6ih851hQHSmR8jM.YToeiJEg6lfm8vwFlD9wbpkrYPgs0MG"

  return await Promise.all([
    prisma.user.upsert({
      where: { email: "abu@sportsdeck.com" },
      create: {
        email: "abu@sportsdeck.com",
        username: "abu",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        isBanned: false,
      },
      update: {
        username: "abu",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        isBanned: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "eshan@sportsdeck.com" },
      create: {
        email: "eshan@sportsdeck.com",
        username: "Eshan",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        isBanned: false,
      },
      update: {
        username: "Eshan",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        isBanned: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "amaan@sportsdeck.com" },
      create: {
        email: "amaan@sportsdeck.com",
        username: "Amaan",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        isBanned: false,
      },
      update: {
        username: "Amaan",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        isBanned: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "system@sportsdeck.com" },
      create: {
        id: "system",
        email: "system@sportsdeck.com",
        username: "system",
        role: "ADMIN",
        isBanned: false,
      },
      update: {
        username: "system",
        role: "ADMIN",
        isBanned: false,
      },
    }),
  ])
}

export async function create_users(){
  // Get all teams to randomly assign as favorites
  const teams = await prisma.team.findMany({
    select: { id: true }
  });
  
  const teamIds = teams.map(t => t.id);
  const roles = ["user", "user", "user", "user", "user", "user", "user", "user", "user"];
  
  // Track used usernames and emails to ensure uniqueness
  const usedUsernames = new Set<string>();
  const usedEmails = new Set<string>();
  
  // Generate user data first without hashing
  const userData = [];
  
  for (let i = 0; i < 100; i++) {
    // Generate unique username
    let username = generateUsername();
    while (usedUsernames.has(username)) {
      username = generateUsername();
    }
    usedUsernames.add(username);
    
    // Generate unique email
    let email = generateEmail(username);
    while (usedEmails.has(email)) {
      email = generateEmail(username);
    }
    usedEmails.add(email);
    
    const password = generatePassword();
    
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    // 30% chance to have an avatar
    const hasAvatar = Math.random() < 0.3;
    const avatarUrl = hasAvatar ? generateAvatarUrl() : null;
    
    // 40% chance to have a favorite team
    const hasFavoriteTeam = Math.random() < 0.4 && teamIds.length > 0;
    const favoriteTeamId = hasFavoriteTeam ? teamIds[Math.floor(Math.random() * teamIds.length)] : null;
    
    // 5% chance to be banned
    const isBanned = Math.random() < 0.05;
    
    userData.push({
      email,
      username,
      password,
      role,
      avatarUrl,
      favoriteTeamId,
      isBanned,
    });
  }
  
  // Hash all passwords in parallel
  const passwordHashes = await Promise.all(userData.map(u => hashPassword(u.password)));
  
  // Create all users with hashed passwords
  const usersToCreate = userData.map((user, index) =>
    prisma.user.create({
      data: {
        email: user.email,
        username: user.username,
        passwordHash: passwordHashes[index],
        role: user.role,
        avatarUrl: user.avatarUrl,
        favoriteTeamId: user.favoriteTeamId,
        isBanned: user.isBanned,
      }
    })
  );
  
  return await Promise.all(usersToCreate);
}


export default async function seedUsers(prisma: PrismaClient) {
  const [admins, users] = await Promise.all([
    create_admins(),
    create_users()
  ])
  console.log("Users added!!!");
  return [...admins, ...users];
}
