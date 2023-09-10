export const wait = (ms: number) => (
  new Promise((resolve) => { setTimeout(resolve, ms); })
);

export function calculateTimeGap(periods: { time: number }[]) {
  let minTimeGap = Infinity;

  for (let i = 1; i < periods.length; i += 1) {
    minTimeGap = Math.min(
      minTimeGap,
      periods[i - 1].time - periods[i].time,
    );
  }

  return minTimeGap;
}

export default {
  wait,
  calculateTimeGap,
};
