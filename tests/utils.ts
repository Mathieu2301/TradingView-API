export const wait = (ms: number) => (
  new Promise((resolve) => { setTimeout(resolve, ms); })
);

export function calculateTimeGap(periods: { time: number }[]) {
  let minTimeGap = Infinity;

  for (let i = 1; i < 10; i += 1) {
    const time1 = periods[i - 1]?.time;
    const time2 = periods[i]?.time;
    if (!time1 || !time2) continue;

    const timeGap = time1 - time2;
    if (timeGap < minTimeGap) minTimeGap = timeGap;
  }

  return minTimeGap;
}

export default {
  wait,
  calculateTimeGap,
};
