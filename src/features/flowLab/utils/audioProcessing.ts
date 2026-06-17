export function normalizeAudioData(channelData: Float32Array): Float32Array {
  let max = 0;
  for (let i = 0; i < channelData.length; i++) {
    const val = Math.abs(channelData[i]);
    if (val > max) max = val;
  }
  if (max === 0) return channelData;
  const result = new Float32Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    result[i] = channelData[i] / max;
  }
  return result;
}
