const rateLimitStore = {};
const MAX_REQUESTS = 5; // Max requests per window
const WINDOW_SIZE_IN_SECONDS = 60; // 1 minute window

export const rateLimiter = (ip) => {
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;

  const userRequests = (rateLimitStore[ip] || []).filter(
    (timestamp) => timestamp > windowStart
  );

  if (userRequests.length >= MAX_REQUESTS) {
    return false; // Limit exceeded
  }

  userRequests.push(now);
  rateLimitStore[ip] = userRequests;
  return true; // Allowed
};
