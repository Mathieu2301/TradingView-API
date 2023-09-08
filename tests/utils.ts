export const wait = (ms: number) => (
  new Promise((resolve) => setTimeout(resolve, ms))
);

export function calculateTimeGap(periods: { time: number }[]) {
  let minTimeGap = Infinity;
  for (let i = 1; i < 10; i += 1) {
    const timeGap = periods[i - 1].time - periods[i]?.time;
    if (timeGap < minTimeGap) minTimeGap = timeGap;
  }
  return minTimeGap;
};

export default {
  wait,
  calculateTimeGap,
};
