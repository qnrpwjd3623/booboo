import { useCallback, useEffect, useRef, useState } from 'react';

export type UiSound =
  | 'tap'      // 일반 버튼
  | 'open'     // 모달/폼 열기
  | 'close'    // 모달/폼 닫기
  | 'save'     // 저장, 추가 성공
  | 'delete'   // 삭제
  | 'achieve'; // 목표 달성

const STORAGE_KEY = 'booboo_sound_on';

/**
 * UI 사운드. 오디오 파일을 쓰지 않고 Web Audio로 그때그때 합성한다.
 *
 * 파일을 안 쓰는 이유: mp3 몇 개면 번들이 수백 KB 늘어나고, 로딩 타이밍
 * 때문에 첫 클릭에서 소리가 안 나는 일이 생긴다. 아래 소리들은 전부
 * 오실레이터 한두 개 + 게인 엔벨로프라서 코드가 곧 에셋이고 지연이 없다.
 *
 * AudioContext는 사용자 제스처가 있어야 시작할 수 있으므로 첫 재생 시점에
 * 만들고 resume한다. 버튼 클릭이 곧 제스처라 자연스럽게 걸린다.
 */
export function useUiSound() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });

  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const Ctor = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  /** 한 음. freq에서 시작해 endFreq로 미끄러지며 감쇠한다. */
  const tone = useCallback((
    ctx: AudioContext,
    {
      freq,
      endFreq,
      start = 0,
      duration = 0.12,
      gain = 0.05,
      type = 'sine' as OscillatorType,
    }: { freq: number; endFreq?: number; start?: number; duration?: number; gain?: number; type?: OscillatorType }
  ) => {
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);

    // 클릭 노이즈를 막으려면 0에서 시작해 0으로 끝나야 한다
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }, []);

  const play = useCallback((sound: UiSound) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    switch (sound) {
      case 'tap':
        tone(ctx, { freq: 880, endFreq: 660, duration: 0.07, gain: 0.035, type: 'triangle' });
        break;
      case 'open':
        tone(ctx, { freq: 520, endFreq: 780, duration: 0.13, gain: 0.04, type: 'sine' });
        break;
      case 'close':
        tone(ctx, { freq: 620, endFreq: 380, duration: 0.13, gain: 0.035, type: 'sine' });
        break;
      case 'save':
        // 완전5도 위로 — "됐다" 느낌
        tone(ctx, { freq: 660, duration: 0.1, gain: 0.045, type: 'triangle' });
        tone(ctx, { freq: 990, start: 0.075, duration: 0.16, gain: 0.045, type: 'triangle' });
        break;
      case 'delete':
        tone(ctx, { freq: 320, endFreq: 150, duration: 0.18, gain: 0.05, type: 'sawtooth' });
        break;
      case 'achieve':
        // 도-미-솔-도 아르페지오
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          tone(ctx, { freq: f, start: i * 0.085, duration: 0.22, gain: 0.04, type: 'triangle' });
        });
        break;
    }
  }, [enabled, getCtx, tone]);

  const toggle = useCallback(() => setEnabled(v => !v), []);

  return { play, enabled, toggle };
}
