import { randomBytes, scryptSync } from "node:crypto";
import { stdin, stdout } from "node:process";

if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
  console.error("Run this in an interactive VS Code terminal so your password can be hidden.");
  process.exit(1);
}

stdout.write("Owner password (minimum 14 characters; input hidden): ");
stdin.setRawMode(true);
stdin.resume();
let password = "";
const onData = (chunk) => {
  const key = chunk.toString("utf8");
  if (key === "\u0003") { stdout.write("\nCancelled.\n"); process.exit(130); }
  if (key === "\r" || key === "\n") {
    stdin.setRawMode(false); stdin.pause(); stdin.off("data", onData); stdout.write("\n");
    if (password.length < 14) { console.error("Use at least 14 characters, then run the generator again."); process.exit(1); }
    const salt = randomBytes(16).toString("hex");
    const digest = scryptSync(password, salt, 64).toString("hex");
    password = "";
    console.log(`PULSE_OWNER_PASSWORD_HASH=scrypt$${salt}$${digest}`);
    return;
  }
  if (key === "\u007f" || key === "\b") password = password.slice(0, -1);
  else if (key.length === 1 && key >= " ") password += key;
};
stdin.on("data", onData);
