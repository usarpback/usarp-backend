const date_fns = require("date-fns");
const date_fns_tz = require("date-fns-tz");
const brazilTimeZone = "America/Sao_Paulo";

function validateDateTimeInFuture(date, time) {
  const brazilTimeZone = "America/Sao_Paulo";

  const parsedDate = date_fns.parse(date, "dd/MM/yyyy", new Date());
  const [hours, minutes] = time.split(":").map(Number);
  parsedDate.setHours(hours, minutes, 0, 0);

  if (
    !date_fns.isValid(parsedDate) ||
    date_fns.format(parsedDate, "dd/MM/yyyy") !== date
  ) {
    throw new Error("The date must be valid and in the format DD/MM/AAAA.");
  }

  const now = new Date();
  const nowPlusOneHour = date_fns.addHours(now, 1);
  const zonedPlusOneHour = date_fns_tz.toZonedTime(
    nowPlusOneHour,
    brazilTimeZone,
  );

  if (parsedDate <= zonedPlusOneHour) {
    throw new Error("The time must be at least one hour in the future.");
  }
}

function formatBlockedAccountMessage(lockUntil) {
  const unlockTime = date_fns_tz.formatInTimeZone(
    lockUntil,
    brazilTimeZone,
    "dd/MM/yyyy HH:mm",
  );
  return `You have exceeded the login or account deletion attempt limit. Please try again at ${unlockTime}.`;
}

module.exports = { validateDateTimeInFuture, formatBlockedAccountMessage };
