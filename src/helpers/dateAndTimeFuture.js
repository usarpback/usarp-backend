const { parse, isValid, format, addHours } = require("date-fns");
const { toZonedTime } = require("date-fns-tz");

function validateDateTimeInFuture(date, time) {
  const brazilTimeZone = "America/Sao_Paulo";

  const parsedDate = parse(date, "dd/MM/yyyy", new Date());
  const [hours, minutes] = time.split(":").map(Number);
  parsedDate.setHours(hours, minutes, 0, 0);

  if (!isValid(parsedDate) || format(parsedDate, "dd/MM/yyyy") !== date) {
    throw new Error("The date must be valid and in the format DD/MM/AAAA.");
  }

  const now = new Date();
  const nowPlusOneHour = addHours(now, 1);
  const zonedPlusOneHour = toZonedTime(nowPlusOneHour, brazilTimeZone);

  if (parsedDate <= zonedPlusOneHour) {
    throw new Error("The time must be at least one hour in the future.");
  }
}

module.exports = validateDateTimeInFuture;
