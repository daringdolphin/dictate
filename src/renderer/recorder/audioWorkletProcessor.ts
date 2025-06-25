const pcmWorkletCode = `
class PCMWorklet extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    const i16 = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      i16[i] = s * 0x7fff;
    }
    this.port.postMessage(i16.buffer, [i16.buffer]);
    return true;
  }
}
registerProcessor('pcm-worklet', PCMWorklet);
`;
export default pcmWorkletCode;
