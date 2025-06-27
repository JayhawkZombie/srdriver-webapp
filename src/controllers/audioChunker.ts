/**
 * Audio chunking utilities for extracting PCM data from audio files and chunking it for analysis.
 */

/**
 * Decodes an audio file into an AudioBuffer using the Web Audio API.
 * @param file The audio file to decode
 * @returns Promise<AudioBuffer>
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Extracts PCM data from a specific channel of an AudioBuffer.
 * @param audioBuffer The AudioBuffer
 * @param channel Channel index (default 0)
 * @returns Float32Array of PCM data
 */
export function getPCMData(audioBuffer: AudioBuffer, channel: number = 0): Float32Array {
  return audioBuffer.getChannelData(channel);
}

/**
 * Extracts mono PCM data by averaging all channels of an AudioBuffer.
 * @param audioBuffer The AudioBuffer
 * @returns Float32Array of mono PCM data
 */
export function getMonoPCMData(audioBuffer: AudioBuffer): Float32Array {
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      mono[i] += data[i] / channels;
    }
  }
  return mono;
}

/**
 * Generator that yields chunked PCM data from a Float32Array.
 * @param pcmData The PCM data to chunk
 * @param windowSize Number of samples per chunk
 * @param hopSize Number of samples to advance per chunk (hopSize < windowSize for overlap)
 * @yields Float32Array window of PCM data
 */
export function* chunkPCMData(
  pcmData: Float32Array,
  windowSize: number,
  hopSize: number
): Generator<Float32Array> {
  for (let start = 0; start + windowSize <= pcmData.length; start += hopSize) {
    yield pcmData.subarray(start, start + windowSize);
  }
} 