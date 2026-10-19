// The API stores roles as "user" and "admin".
// In this student portal they are shown as "student" and "staff".
export function roleLabel(role) {
  return role === "admin" ? "staff" : "student";
}
