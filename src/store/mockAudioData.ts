export const makeSineWave = (length: number) =>
  Array.from({ length }, (_, i) => Math.sin((i / length) * 4 * Math.PI));

export const makeNoise = (length: number) =>
  Array.from({ length }, () => Math.random() * 2 - 1);

export const makeRandomBarData = (length: number) =>
  Array.from({ length }, () => Math.random());

export const makeSineBarData = (length: number) =>
  Array.from({ length }, (_, i) => Math.abs(Math.sin((i / length) * 4 * Math.PI)));

export const makeBeatBarData = (length: number) =>
  Array.from({ length }, (_, i) => (i % 32 < 4 ? 1 : Math.random() * 0.4));

export const makeScreenshotLikeBarData = (length: number) => {
  const N = length;
  return Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    let env = 1;
    if (t < 0.1) env = t / 0.1;
    else if (t > 0.9) env = (1 - t) / 0.1;
    const beat = Math.sin(2 * Math.PI * t * 8) * 0.2 + 0.8;
    const noise = 0.85 + Math.random() * 0.15;
    return Math.max(0, Math.min(1, env * beat * noise));
  });
}; 