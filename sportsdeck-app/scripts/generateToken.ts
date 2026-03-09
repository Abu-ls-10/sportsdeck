import dotenv from "dotenv"

dotenv.config()

import { generateAccessToken } from "../src/lib/auth"

const token = generateAccessToken({
  userId: "cmmj550lf0000uh94gahbh4f5",
  role: "ADMIN",
  isBanned: false
})

console.log(token)