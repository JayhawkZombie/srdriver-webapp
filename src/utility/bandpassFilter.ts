export async function bandpassFilterPCM(
  pcm: Float32Array,
  sampleRate: number,
  freq: number,
  Q: number = 1
): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, pcm.length, sampleRate);
  const buffer = ctx.createBuffer(1, pcm.length, sampleRate);
  buffer.copyToChannel(pcm, 0);

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = Q;

  source.connect(filter).connect(ctx.destination);
  source.start();

  const rendered = await ctx.startRendering();
  return rendered.getChannelData(0).slice(); // Copy to new Float32Array
} 