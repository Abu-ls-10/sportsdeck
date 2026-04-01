import fetch, { type RequestInit } from "node-fetch";

const BASE_URL = "http://localhost:3000";

const USER_COUNT = 20;
const ACTIONS_PER_USER = 50;
const CONCURRENCY = 5;

type Personality = "casual" | "debater" | "troll" | "analyst";

type UserSession = {
  id: string;
  token: string;
  username: string;
  personality: Personality;
};

type Thread = {
  id: string;
  authorId: string;
  postId: string;
  poll?: Poll;
};

type Poll = {
  id: string;
  options: { id: string }[];
};

// =========================
// DATA POOLS
// =========================
const TEAMS = [
  "Arsenal", "Manchester City", "Liverpool",
  "Barcelona", "Real Madrid", "Bayern Munich"
];

const PLAYERS = [
  "Haaland", "Saka", "Bellingham",
  "Vinicius Jr", "Musiala", "De Bruyne",
  "Mbappé", "Kane", "Pedri"
];

const POSITIONS = ["midfield", "defense", "attack", "fullbacks", "goalkeeping"];

// =========================
// UTIL
// =========================
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const rand = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function assignPersonality(): Personality {
  return rand(["casual", "debater", "troll", "analyst"]);
}

// =========================
// USERNAME (UPGRADED)
// =========================
export function generateUsername(i: number): string {
  const adjectives = [
    "swift", "silent", "elite", "clutch", "prime",
    "cold", "dynamic", "tactical", "ruthless", "unstoppable"
  ];

  const roles = [
    "striker", "playmaker", "winger", "keeper",
    "defender", "midfielder", "captain", "finisher"
  ];

  const fandom = [
    "arsenal", "chelsea", "liverpool", "madrid",
    "barca", "bayern", "city", "juve", "psg"
  ];

  const players = [
    "saka", "haaland", "bellingham", "vini", "kane",
    "mbappe", "pedri", "musiala", "kdb"
  ];

  const extras = [
    "fan", "ultra", "hub", "zone", "central",
    "daily", "updates", "watch"
  ];

  const suffixes = [
    "fc", "utd", "cf", "afc", "1899", "247", "365"
  ];

  const separators = ["", "_"];

  // more realistic numbers (not always sequential)
  const randNum = Math.floor(Math.random() * 999);

  const style = Math.floor(Math.random() * 10);

  let username = "";

  switch (style) {
    // clean football-style usernames
    case 0:
      username = `${rand(fandom)}${rand(suffixes)}`;
      break;

    // player fan accounts
    case 1:
      username = `${rand(players)}${rand(["fan", "szn", "era", "prime"])}`;
      break;

    // analyst vibe
    case 2:
      username = `${rand(adjectives)}_${rand(["analysis", "tactics", "breakdown"])}`;
      break;

    // casual usernames
    case 3:
      username = `${rand(adjectives)}${rand(roles)}${randNum}`;
      break;

    // fan hub style
    case 4:
      username = `${rand(fandom)}${rand(extras)}`;
      break;

    // debate / opinion accounts
    case 5:
      username = `${rand(["football", "match", "game"])}${rand(["talk", "takes", "debate"])}`;
      break;

    // short + realistic
    case 6:
      username = `${rand(players)}_${randNum}`;
      break;

    // hybrid
    case 7:
      username = `${rand(adjectives)}${rand(separators)}${rand(fandom)}`;
      break;

    // meme / fan energy
    case 8:
      username = `${rand(players)}_${rand(["goat", "baller", "legend"])}`;
      break;

    // structured sports account
    case 9:
      username = `${rand(fandom)}_${rand(["insider", "news", "report"])}`;
      break;
  }

  // guarantee uniqueness
  return `${username}_${i}`.toLowerCase();
}

// =========================
// THREAD GENERATION (🔥 BIG)
// =========================
function generateThreadContent() {
  const teamA = rand(TEAMS);
  const teamB = rand(TEAMS.filter(t => t !== teamA));
  const player = rand(PLAYERS);
  const pos = rand(POSITIONS);

  const threads = [
    {
      title: `${teamA} vs ${teamB} – Tactical Breakdown`,
      content: `${teamA} dominated the ${pos}. What adjustments should ${teamB} have made?`,
      tags: ["analysis", "tactics"]
    },
    {
      title: `Is ${player} the best in the world right now?`,
      content: `${player} is performing at an insane level lately. Is this peak form?`,
      tags: ["player-performance", "discussion"]
    },
    {
      title: `${teamA} transfer window discussion`,
      content: `What positions should ${teamA} prioritize this window?`,
      tags: ["transfer", "team-news"]
    },
    {
      title: `${teamA} lineup predictions for next match`,
      content: `Who starts and who gets benched?`,
      tags: ["prediction", "discussion"]
    },
    {
      title: `${teamA} defensive issues`,
      content: `They keep conceding from transitions. What's going wrong?`,
      tags: ["analysis", "tactics"]
    },
    {
      title: `${player} vs ${rand(PLAYERS)} – who are you taking?`,
      content: `Compare their impact this season.`,
      tags: ["debate", "player-performance"]
    },
    {
      title: `${teamA} title chances this season`,
      content: `Can they realistically win the league?`,
      tags: ["season", "discussion"]
    },
    {
      title: `${teamA} injury concerns`,
      content: `How much will injuries affect their season?`,
      tags: ["injury", "discussion"]
    },
    {
      title: `Best ${teamA} XI of the last decade`,
      content: `Who makes your all-time XI?`,
      tags: ["history", "discussion"]
    },
    {
      title: `${teamA} pressing system analysis`,
      content: `Their pressing structure has improved a lot recently.`,
      tags: ["analysis", "tactics"]
    }
  ];

  return rand(threads);
}

// =========================
// REPLIES (🔥 HUGE VARIETY)
// =========================
function generateReply(p: Personality): string {
  const pool = {
    casual: [
      "Yeah that makes sense",
      "I see your point",
      "Not sure I agree tbh",
      "Good take honestly",
      "Could go either way",
      "Fair argument",
      "I didn’t think about it like that",
      "That’s interesting actually"
    ],
    debater: [
      "You're ignoring the tactical setup completely",
      "That argument falls apart under pressure",
      "Stats don’t support this at all",
      "The midfield imbalance is the real issue",
      "You're oversimplifying the situation",
      "That’s not how the game actually played out",
      "There’s more nuance here",
      "You’re missing key context"
    ],
    troll: [
      "This is a terrible take 😂",
      "Do you even watch games?",
      "Absolutely clueless",
      "Worst opinion I’ve seen today",
      "Bro what are you saying",
      "This ain’t it",
      "Delete this 😭",
      "You can't be serious"
    ],
    analyst: [
      "Their xG buildup suggests a different story",
      "The spacing between lines was the key issue",
      "Pressing triggers were inconsistent",
      "Their defensive transitions were too slow",
      "They lost control in midfield zones",
      "The structure collapsed under pressure",
      "They lacked compactness",
      "Their buildup play was predictable"
    ]
  };

  return rand(pool[p]);
}

// =========================
// API WRAPPER
// =========================
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data as T;
}

// =========================
// USER
// =========================
async function createUser(i: number): Promise<UserSession> {
  const res = await api<any>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      username: generateUsername(i),
      email: `fan_${i}@test.com`,
      password: "password123"
    })
  });

  return {
    id: res.user.id,
    token: res.access_token,
    username: res.user.username,
    personality: assignPersonality()
  };
}

// =========================
// THREAD
// =========================
async function createThread(actor: UserSession): Promise<Thread> {
  const content = generateThreadContent();

  const thread = await api<any>("/api/threads", {
    method: "POST",
    headers: { Authorization: `Bearer ${actor.token}` },
    body: JSON.stringify(content)
  });

  const posts = await api<any[]>(`/api/threads/${thread.id}/posts`);

  return {
    id: thread.id,
    authorId: thread.authorId,
    postId: posts[0].id
  };
}

// =========================
// REPLY (nested)
// =========================
async function reply(
  actor: UserSession,
  thread: Thread,
  parentReplyId?: string
): Promise<string | undefined> {

  const endpoint = parentReplyId
    ? `/api/replies/${parentReplyId}/replies`
    : `/api/posts/${thread.postId}/replies`;

  const res = await api<any>(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${actor.token}` },
    body: JSON.stringify({
      content: generateReply(actor.personality)
    })
  });

  return res.id;
}

// =========================
// FOLLOW
// =========================
async function follow(users: UserSession[], actor: UserSession) {
  const target = rand(users.filter(u => u.id !== actor.id));
  try {
    await api(`/api/follow/${target.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${actor.token}` }
    });
  } catch {}
}

// =========================
// POLL
// =========================
async function createPoll(actor: UserSession, thread: Thread) {
  if (thread.authorId !== actor.id) return;

  const teamA = rand(TEAMS);
  const teamB = rand(TEAMS.filter(t => t !== teamA));

  const poll = await api<Poll>(`/api/threads/${thread.id}/poll`, {
    method: "POST",
    headers: { Authorization: `Bearer ${actor.token}` },
    body: JSON.stringify({
      question: `${teamA} vs ${teamB} – who wins?`,
      deadline: new Date(Date.now() + 3600000).toISOString(),
      options: [teamA, teamB, "Draw"]
    })
  });

  thread.poll = poll;
}

// =========================
// VOTE
// =========================
async function vote(actor: UserSession, poll: Poll) {
  const option = rand(poll.options);

  await api(`/api/polls/${poll.id}/vote`, {
    method: "POST",
    headers: { Authorization: `Bearer ${actor.token}` },
    body: JSON.stringify({ optionId: option.id })
  });
}

// =========================
// SIMULATION
// =========================
async function simulateUser(user: UserSession, users: UserSession[], threads: Thread[]) {
  for (let i = 0; i < ACTIONS_PER_USER; i++) {
    const r = Math.random();

    try {
      if (r < 0.45 && threads.length > 0) {
        const thread = rand(threads);

        const r1 = await reply(user, thread);
        if (r1 && Math.random() < 0.5) {
          const r2 = await reply(user, thread, r1);
          if (r2 && Math.random() < 0.3) {
            await reply(user, thread, r2);
          }
        }

      } else if (r < 0.65) {
        await follow(users, user);

      } else if (r < 0.9) {
        const thread = await createThread(user);

        if (Math.random() < 0.4) {
          await createPoll(user, thread);
        }

        threads.push(thread);

      } else {
        const polls = threads.map(t => t.poll).filter(Boolean) as Poll[];
        if (polls.length > 0) {
          await vote(user, rand(polls));
        }
      }

      console.log(`✔ ${user.username}`);
    } catch (e) {
      console.log(`✖ ${user.username}`);
    }

    await sleep(80);
  }
}

// =========================
// MAIN
// =========================
async function run() {
  const users = await Promise.all(
    Array.from({ length: USER_COUNT }, (_, i) => createUser(i))
  );

  const threads: Thread[] = [];

  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const batch = users.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(u => simulateUser(u, users, threads)));
  }

  console.log("DONE 🔥");
}

run();