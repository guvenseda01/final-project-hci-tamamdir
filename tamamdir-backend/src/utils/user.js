function isIyteStudentEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase();
  return e.endsWith('@iyte.edu.tr') || e.endsWith('@std.iyte.edu.tr');
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
  };
}

module.exports = { isIyteStudentEmail, sanitizeUser };
