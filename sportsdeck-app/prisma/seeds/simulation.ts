import fetch, { type RequestInit } from "node-fetch";

const BASE_URL = "http://localhost:3000";

const USER_COUNT = 120;
const ACTIONS_PER_USER = 25;
const CONCURRENCY = 10;
const RUN_ID = Date.now();

type Personality = "casual" | "debater" | "troll" | "analyst";

type UserSession = {
  id: string;
  token: string;
  username: string;
  personality: Personality;
};

type PollOption = {
  id: string;
};

type Poll = {
  id: string;
  options: PollOption[];
};

type Thread = {
  id: string;
  authorId: string;
  postId: string;
  poll?: Poll;
};

type SignupResponse = {
  user: {
    id: string;
    username: string;
  };
  access_token: string;
};

type ThreadCreateResponse = {
  id: string;
  authorId: string;
};

type PostSummary = {
  id: string;
};

type ApiErrorShape = {
  error?: string;
  message?: string;
};

// =========================
// UTILS
// =========================
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function rand<T>(arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error("rand() received an empty array");
  }

  return arr[Math.floor(Math.random() * arr.length)];
}

function assignPersonality(): Personality {
  return rand<Personality>(["casual", "debater", "troll", "analyst"]);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

// =========================
// USERNAME
// =========================
export function generateUsername(i: number): string {
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

  const number = `_${i}`; // guaranteed unique

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

// =========================
// API
// =========================
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as ApiErrorShape;
    throw new Error(err.error || err.message || "Request failed");
  }

  return data as T;
}

// =========================
// AUTH
// =========================
async function createUser(i: number): Promise<UserSession> {
  const email = `sim_${RUN_ID}_${i}@test.com`;

  const signup = await api<SignupResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      username: generateUsername(i),
      email,
      password: "password123",
    }),
  });

  return {
    id: signup.user.id,
    token: signup.access_token,
    username: signup.user.username,
    personality: assignPersonality(),
  };
}

// =========================
// THREAD
// =========================
async function createThread(actor: UserSession): Promise<Thread> {
  const thread = await api<ThreadCreateResponse>("/api/threads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
    body: JSON.stringify({
      title: "Hot take discussion",
      content: "Thoughts?",
      tags: ["hot take", "debate"],
    }),
  });

  const posts = await api<PostSummary[]>(`/api/threads/${thread.id}/posts`);
  const rootPost = posts[0];

  if (!rootPost) {
    throw new Error(`Thread ${thread.id} was created but no root post was returned`);
  }

  return {
    id: thread.id,
    authorId: thread.authorId,
    postId: rootPost.id,
  };
}

// =========================
// POLL
// =========================
async function createPoll(actor: UserSession, thread: Thread): Promise<Poll | undefined> {
  if (thread.authorId !== actor.id) {
    return undefined;
  }

  return api<Poll>(`/api/threads/${thread.id}/poll`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
    body: JSON.stringify({
      question: "Who wins?",
      deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      options: ["yes", "no", "maybe"],
    }),
  });
}

// =========================
// REPLY
// =========================
async function reply(actor: UserSession, thread: Thread): Promise<void> {
  await api<unknown>(`/api/posts/${thread.postId}/replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
    body: JSON.stringify({
      content: "Interesting take",
    }),
  });
}

// =========================
// FOLLOW
// =========================
async function follow(users: UserSession[], actor: UserSession): Promise<void> {
  const candidates = users.filter((u) => u.id !== actor.id);

  if (candidates.length === 0) {
    return;
  }

  const target = rand(candidates);

  try {
    await api<unknown>(`/api/follow/${target.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${actor.token}`,
      },
    });
  } catch {
    // ignore duplicate/self-like follow failures during simulation
  }
}

// =========================
// VOTE
// =========================
async function vote(actor: UserSession, poll: Poll): Promise<void> {
  if (poll.options.length === 0) {
    return;
  }

  const option = rand(poll.options);

  await api<unknown>(`/api/polls/${poll.id}/vote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${actor.token}`,
    },
    body: JSON.stringify({
      optionId: option.id,
    }),
  });
}

// =========================
// SIMULATION
// =========================
async function simulateUser(
  user: UserSession,
  users: UserSession[],
  threads: Thread[]
): Promise<void> {
  for (let i = 0; i < ACTIONS_PER_USER; i++) {
    const r = Math.random();

    try {
      if (r < 0.5 && threads.length > 0) {
        await reply(user, rand(threads));
      } else if (r < 0.75) {
        await follow(users, user);
      } else if (r < 0.9) {
        const thread = await createThread(user);

        if (Math.random() < 0.3) {
          const poll = await createPoll(user, thread);
          if (poll) {
            thread.poll = poll;
          }
        }

        threads.push(thread);
      } else {
        const threadsWithPolls = threads
          .map((t) => t.poll)
          .filter(isDefined);

        if (threadsWithPolls.length > 0) {
          await vote(user, rand(threadsWithPolls));
        }
      }

      console.log(`✔ ${user.username}`);
    } catch (error: unknown) {
      console.log(`✖ ${user.username}: ${getErrorMessage(error)}`);
    }

    await sleep(100);
  }
}

// =========================
// MAIN
// =========================
async function run(): Promise<void> {
  const users = await Promise.all(
    Array.from({ length: USER_COUNT }, (_, i) => createUser(i))
  );

  const threads: Thread[] = [];

  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const batch = users.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((user) => simulateUser(user, users, threads)));
  }

  console.log("Done");
}

void run();