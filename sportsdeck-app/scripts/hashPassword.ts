import dotenv from "dotenv"
dotenv.config()

import { hashPassword } from "../src/lib/auth"

async function main() {
  try {
    const password = "password123"

    const hash = await hashPassword(password)

    console.log("\nGenerated password hash:\n")
    console.log(hash)
    console.log("\nUse this in your seed file as passwordHash\n")

  } catch (error) {
    console.error("Error generating password hash:", error)
  }
}

main()