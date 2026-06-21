function isIyteStudentEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase();
  return e.endsWith('@iyte.edu.tr') || e.endsWith('@std.iyte.edu.tr');
}

function isAdminEmail(email) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, is_verified, is_verified_student, ...rest } = user;
  const emailVerified = is_verified === 1;
  const studentEligible = is_verified_student === 1;
  return {
    ...rest,
    email_verified: emailVerified,
    is_verified_student: studentEligible && emailVerified,
    is_admin: user.is_admin === 1,
    is_active: user.is_active !== 0,
    is_deleted: user.deleted_at != null,
  };
}

module.exports = { isIyteStudentEmail, isAdminEmail, sanitizeUser };
