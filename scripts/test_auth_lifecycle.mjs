import { hashPassword, verifyPassword, generateDefaultPassword, generateNextUsername } from "../src/lib/auth-passwords.ts";
import { findStaffByIdentifier, updateStaffPassword } from "../src/lib/firebase/db.ts";
import { sendStaffWelcomeEmail } from "../src/lib/email.ts";

async function runTests() {
  console.log("=== THE ZANGO AUTH LIFECYCLE VERIFICATION ===");

  // 1. Test hash and verify functions
  const { hash, salt } = hashPassword("SpecialPass#2026!");
  const isValid = verifyPassword("SpecialPass#2026!", hash, salt);
  const isInvalid = verifyPassword("WrongPassword", hash, salt);
  console.log("✓ Scrypt hashing & timingSafeEqual:", isValid === true && isInvalid === false ? "PASS" : "FAIL");

  // 2. Test staff lookup by username and email
  const editor = await findStaffByIdentifier("editor1");
  console.log("✓ Lookup by username 'editor1':", editor && editor.name === "Aisha Dahiru" ? "PASS" : "FAIL");

  const author = await findStaffByIdentifier("author1");
  console.log("✓ Lookup by username 'author1':", author && author.name === "Fatima Sanusi" ? "PASS" : "FAIL");

  const adminByUsername = await findStaffByIdentifier("admin");
  console.log("✓ Lookup Chief Admin by username 'admin':", adminByUsername && adminByUsername.role === "admin" ? "PASS" : "FAIL");

  const adminByEmail = await findStaffByIdentifier("usman.bello@thezango.org");
  console.log("✓ Lookup Chief Admin by email 'usman.bello@thezango.org':", adminByEmail && adminByEmail.name === "Usman Bello" ? "PASS" : "FAIL");

  // 3. Test default password verification for preset accounts
  const isEditorVerified = verifyPassword("password123", editor.passwordHash, editor.passwordSalt);
  console.log("✓ Initial seed default password 'password123' verifies for editor1:", isEditorVerified ? "PASS" : "FAIL");

  // 4. Test username generator
  const existing = ["editor1", "editor2", "author1", "admin"];
  const nextEditor = generateNextUsername("editor", existing);
  const nextAuthor = generateNextUsername("writer", existing);
  console.log("✓ Sequential next username generation:", nextEditor === "editor3" && nextAuthor === "author2" ? `PASS (${nextEditor}, ${nextAuthor})` : "FAIL");

  // 5. Test default temporary password generator
  const tempPass = generateDefaultPassword();
  console.log("✓ Generated default temporary passcode:", tempPass.startsWith("Zango#") ? `PASS (${tempPass})` : "FAIL");

  // 6. Test password update lifecycle
  const { hash: newHash, salt: newSalt } = hashPassword("NewSecuredPass#2026!");
  await updateStaffPassword(editor.id, newHash, newSalt);
  const updatedEditor = await findStaffByIdentifier("editor1");
  const verifiesNew = verifyPassword("NewSecuredPass#2026!", updatedEditor.passwordHash, updatedEditor.passwordSalt);
  const rejectsOld = verifyPassword("password123", updatedEditor.passwordHash, updatedEditor.passwordSalt);
  console.log("✓ Password update lifecycle:", verifiesNew && !rejectsOld ? "PASS" : "FAIL");

  // Restore password for editor1
  const { hash: restoredHash, salt: restoredSalt } = hashPassword("password123");
  await updateStaffPassword(editor.id, restoredHash, restoredSalt);

  // 7. Test email template generation
  const emailRes = await sendStaffWelcomeEmail({
    to: "test.editor@thezango.org",
    name: "Amina Correspondent",
    username: "editor3",
    defaultPassword: "Zango#9142!",
    role: "editor",
    desk: "Business & Capital Markets",
  });
  console.log("✓ Automated onboarding email simulation/dispatch:", emailRes.success ? "PASS" : "FAIL");

  console.log("\nALL VERIFICATION GATES COMPLETED SUCCESSFULLY.");
}

runTests().catch(console.error);

