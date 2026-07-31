import { useCallback, useSyncExternalStore } from 'react';

export type UiSound =
  | 'tap'      // 일반 버튼, 드롭다운 열기
  | 'select'   // 목록에서 항목 고르기 (월/연도 선택)
  | 'nav'      // 이전/다음 이동
  | 'open'     // 모달/폼 열기
  | 'close'    // 모달/폼 닫기, 선택 해제
  | 'save'     // 저장, 추가 성공
  | 'delete'   // 삭제
  | 'achieve'; // 목표 달성

const STORAGE_KEY = 'booboo_sound_on';

/**
 * UI 사운드. 오디오 파일 없이 Web Audio로 그때그때 합성한다.
 *
 * 파일을 안 쓰는 이유: mp3 몇 개면 번들이 수백 KB 늘고, 로딩 타이밍 때문에
 * 첫 클릭에서 소리가 안 나는 일이 생긴다. 아래 소리는 전부 오실레이터 한둘에
 * 게인 엔벨로프라서 코드가 곧 에셋이고 지연이 없다.
 *
 * 모듈 수준 싱글턴인 이유: 소리를 내야 하는 버튼이 앱 곳곳에 흩어져 있어서
 * 훅으로만 두면 컴포넌트마다 play를 프롭으로 넘겨야 한다. AudioContext는
 * 어차피 앱당 하나면 충분하다.
 */

let ctx: AudioContext | null = null;
let enabled = readEnabled();
const listeners = new Set<() => void>();

function readEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === 'true';
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // 브라우저는 사용자 제스처 전에는 오디오를 막는다. 버튼 클릭이 곧 제스처라
  // 첫 재생 시점에 resume하면 자연스럽게 풀린다.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** 한 음. freq에서 시작해 endFreq로 미끄러지며 감쇠한다. */
function tone(
  audio: AudioContext,
  {
    freq,
    endFreq,
    start = 0,
    duration = 0.12,
    gain = 0.05,
    type = 'sine' as OscillatorType,
  }: { freq: number; endFreq?: number; start?: number; duration?: number; gain?: number; type?: OscillatorType }
) {
  const t0 = audio.currentTime + start;
  const osc = audio.createOscillator();
  const amp = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);

  // 딱딱거리는 노이즈를 막으려면 0에서 올라가 0으로 내려와야 한다
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(amp).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playUiSound(sound: UiSound) {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;

  switch (sound) {
    case 'tap':
      tone(audio, { freq: 880, endFreq: 660, duration: 0.06, gain: 0.03, type: 'triangle' });
      break;
    case 'select':
      tone(audio, { freq: 740, endFreq: 988, duration: 0.09, gain: 0.035, type: 'triangle' });
      break;
    case 'nav':
      tone(audio, { freq: 620, endFreq: 760, duration: 0.07, gain: 0.03, type: 'sine' });
      break;
    case 'open':
      tone(audio, { freq: 520, endFreq: 780, duration: 0.13, gain: 0.04, type: 'sine' });
      break;
    case 'close':
      tone(audio, { freq: 620, endFreq: 380, duration: 0.12, gain: 0.032, type: 'sine' });
      break;
    case 'save':
      // 완전5도 위로 — "됐다" 느낌
      tone(audio, { freq: 660, duration: 0.1, gain: 0.045, type: 'triangle' });
      tone(audio, { freq: 990, start: 0.075, duration: 0.16, gain: 0.045, type: 'triangle' });
      break;
    case 'delete':
      tone(audio, { freq: 320, endFreq: 150, duration: 0.18, gain: 0.045, type: 'sawtooth' });
      break;
    case 'achieve':
      // 도-미-솔-도 아르페지오
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(audio, { freq: f, start: i * 0.085, duration: 0.22, gain: 0.04, type: 'triangle' });
      });
      break;
  }
}

export function setUiSoundEnabled(next: boolean) {
  enabled = next;
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, String(next));
  listeners.forEach(fn => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** 토글 UI를 그릴 때만 쓰면 된다. 소리만 낼 거면 playUiSound를 직접 부른다. */
export function useUiSound() {
  const isOn = useSyncExternalStore(subscribe, () => enabled, () => true);
  const toggle = useCallback(() => setUiSoundEnabled(!enabled), []);
  return { play: playUiSound, enabled: isOn, toggle };
}
