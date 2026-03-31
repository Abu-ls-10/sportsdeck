import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

// =========================
// CONFIG
// =========================
const USER_COUNT = 120;
const ACTIONS_PER_USER = 25;
const CONCURRENCY = 10;
const TAG_NAMES = [
  "Transfer News",
  "Match Analysis",
  "Hot Take",
  "Injury Update",
  "Tactics",
  "Rumors",
  "Lineups",
  "Predictions",
  "Breaking News",
  "Fan Debate",
];

// =========================
// TYPES
// =========================
type Personality = "casual" | "debater" | "troll" | "analyst";

type UserSession = {
  id: string;
  token: string;
  username: string;
  personality: Personality;
};

type Poll = {
  id: string;
  options: { id: string }[];
};

type Thread = {
  id: string;
  post: { id: string };
  team: string;
  poll?: Poll;
};

type Tag = {
  id: string;
  name: string;
};

// =========================
// UTILS
// =========================
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function assignPersonality(): Personality {
  return rand(["casual", "debater", "troll", "analyst"]);
}

// =========================
// CONTENT ENGINE
// =========================
const teams = [
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Man City",
  "Barcelona",
  "Real Madrid",
  "Bayern",
];

const titleTemplates = [
  "Is {team} actually overrated this season?",
  "Hot take: {team} won't make top 4",
  "What went wrong for {team} today?",
  "{team} fans, be honest...",
  "This ref decision ruined the {team} game",
  "Unpopular opinion about {team}",
  "{team} are being carried by one player",
  "Can we talk about {team}'s defense?",
];

function generateTitle(team: string) {
  return rand(titleTemplates).replace("{team}", team);
}

const genericReplies = [
  "Completely agree with this",
  "Nah this is a terrible take",
  "People aren't ready to hear this",
  "This is exactly what I've been saying",
  "You're overreacting tbh",
  "Stats don't support this at all",
  "Watch the game again",
  "Lowkey true",
  "Highkey wrong 😭",
  "Cooked take 🔥",
];

function generateReply(personality: Personality): string {
  if (personality === "analyst") {
    return rand([
      "Statistically this doesn't hold up",
      "If you look at the last 5 games...",
      "The xG tells a different story",
    ]);
  }

  if (personality === "troll") {
    return rand([
      "Worst take I've seen today",
      "Delete this 😭",
      "You don't watch football",
    ]);
  }

  if (personality === "debater") {
    return rand([
      "I disagree and here's why",
      "You're ignoring context here",
      "This argument doesn't make sense",
    ]);
  }

  return rand(genericReplies);
}

// =========================
// API
// =========================
async function api(path: string, options: any = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("❌ API ERROR:", path);
    console.error("Status:", res.status);
    console.error("Response:", data);

    throw new Error((data as any)?.error || "Request failed");
  }

  return data as any;
}

// =========================
// AUTH
// =========================
async function createUser(i: number): Promise<UserSession> {
  const email = `sim${i}@test.com`;
  const password = "password123";

  await api("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      username: `simUser${i}`,
      email,
      password,
    }),
  });

  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return {
    id: login.user.id,
    token: login.token,
    username: login.user.username,
    personality: assignPersonality(),
  };
}

// =========================
// ACTIONS
// =========================
async function seedTags(actor: UserSession): Promise<Tag[]> {
  const created: Tag[] = [];

  for (const name of TAG_NAMES) {
    try {
      const tag = await api(`/api/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${actor.token}`,
        },
        body: JSON.stringify({ name }),
      });

      created.push(tag);
    } catch {
      // tag probably already exists → ignore
    }
  }

  console.log(`Tags ready: ${created.length}`);
  return created;
}

async function attachTagsToThread(
  actor: UserSession,
  threadId: string,
  tags: Tag[]
) {
  // pick 1–3 random tags
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);

  for (const tag of selected) {
    try {
      await api(`/api/threads/${threadId}/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${actor.token}`,
        },
        body: JSON.stringify({ tagId: tag.id }),
      });
    } catch {
      // ignore duplicates or failures
    }
  }
}

async function follow(users: UserSession[], actor: UserSession) {
  const target = rand(users.filter(u => u.id !== actor.id));

  await api(`/api/follow/${target.id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
  });
}

async function createPoll(
  actor: UserSession,
  threadId: string
): Promise<Poll> {
  return api(`/api/polls/${threadId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
    body: JSON.stringify({
      question: rand([
        "Who wins this matchup?",
        "Was this the right decision?",
        "Man of the match?",
        "Is this team overrated?",
      ]),
      options: [
        { text: "Yes" },
        { text: "No" },
        { text: "Not sure" },
      ],
    }),
  });
}

async function createThread(
  actor: UserSession,
  allTags: Tag[]
): Promise<Thread> {
  const team = rand(teams);

  const thread = await api(`/api/threads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
    body: JSON.stringify({
      title: generateTitle(team),
      content: rand([
        "Thoughts?",
        "Am I wrong here?",
        "Curious what everyone thinks",
      ]),
    }),
  });

  // attach tags here
  if (allTags.length > 0) {
    await attachTagsToThread(actor, thread.id, allTags);
  }

  let poll: Poll | undefined;

  if (Math.random() < 0.3) {
    try {
      poll = await createPoll(actor, thread.id);
    } catch {}
  }

  return { ...thread, team, poll };
}

async function reply(actor: UserSession, thread: Thread) {
  return api(`/api/posts/${thread.post.id}/replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
    body: JSON.stringify({
      content: generateReply(actor.personality),
    }),
  });
}

// =========================
// VOTING SYSTEM
// =========================
const votedPolls = new Map<string, Set<string>>();

async function votePoll(user: UserSession, poll: Poll) {
  const votedUsers = votedPolls.get(poll.id) || new Set();

  if (votedUsers.has(user.id)) return;

  const option = rand(poll.options);

  await api(`/api/polls/${poll.id}/vote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({ optionId: option.id }),
  });

  votedUsers.add(user.id);
  votedPolls.set(poll.id, votedUsers);
}

// =========================
// ACTION LOGIC
// =========================
function weightedAction(): "follow" | "thread" | "reply" | "vote" {
  const r = Math.random();

  if (r < 0.5) return "reply";
  if (r < 0.75) return "follow";
  if (r < 0.9) return "thread";
  return "vote";
}

// =========================
// USER SIMULATION
// =========================
async function simulateUser(
  user: UserSession,
  users: UserSession[],
  threads: Thread[],
  allTags: Tag[]
) {
  for (let i = 0; i < ACTIONS_PER_USER; i++) {
    const action = weightedAction();

    try {
      if (action === "follow") {
        await follow(users, user);
      }

      if (action === "thread") {
        const thread = await createThread(user, allTags);
        threads.push(thread);
      }

      if (action === "reply" && threads.length > 0) {
        const thread = rand(threads);
        await reply(user, thread);
      }

      if (action === "vote") {
        const threadsWithPolls = threads.filter(t => t.poll);

        if (threadsWithPolls.length > 0) {
          const thread = rand(threadsWithPolls);
          await votePoll(user, thread.poll!);
        }
      }

      console.log(`✔ ${user.username} → ${action}`);
    } catch (err: any) {
      console.log(`✖ ${user.username} ${action}: ${err.message}`);
    }

    await sleep(50 + Math.random() * 150);
  }
}

// =========================
// CONCURRENCY
// =========================
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
) {
  const queue = [...items];

  const workers = Array.from({ length: limit }).map(async () => {
    while (queue.length) {
      const item = queue.pop();
      if (!item) return;
      await fn(item);
    }
  });

  await Promise.all(workers);
}

// =========================
// MAIN
// =========================
async function run() {
  console.log("Creating users...");

  const users = await Promise.all(
    Array.from({ length: USER_COUNT }).map((_, i) => createUser(i))
    );

    // seed tags using first user
    const allTags = await seedTags(users[0]);

    await runWithConcurrency(users, CONCURRENCY, async (user) => {
    await simulateUser(user, users, threads, allTags);
    });

  console.log(`Created ${users.length} users`);

  const threads: Thread[] = [];

  console.log("Starting simulation...");

  await runWithConcurrency(users, CONCURRENCY, async (user) => {
    await simulateUser(user, users, threads, allTags);
  });

  console.log("Simulation complete");
}

run().catch(console.error);