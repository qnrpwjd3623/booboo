import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroSplashProps {
  /** 표시할 워드마크. 기본값은 집 이름. */
  word?: string;
  /** 워드마크 아래 작게 깔리는 한 줄. */
  caption?: string;
  onDone: () => void;
}

const LETTER_DURATION = 0.55;
const LETTER_STAGGER = 0.07;
const HOLD_AFTER_REVEAL = 0.75;

/**
 * 로그인 직후 한 번 지나가는 타이포그래피 인트로.
 *
 * 글자를 마스크 안에서 밀어 올려 한 자씩 세우고, 밑줄이 좌에서 우로 그어진 뒤
 * 전체가 위로 빠지면서 대시보드가 드러난다. 이미지도 로고 파일도 쓰지 않는다.
 * 화면에 있는 건 글자와 선 두 가지뿐이다.
 */
export function IntroSplash({ word = '부부동산집', caption, onDone }: IntroSplashProps) {
  const [visible, setVisible] = useState(true);
  const letters = useMemo(() => [...word], [word]);

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const revealDone = reduceMotion
    ? 0.4
    : letters.length * LETTER_STAGGER + LETTER_DURATION;
  const total = revealDone + HOLD_AFTER_REVEAL;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), total * 1000);
    return () => clearTimeout(timer);
  }, [total]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[color:var(--c-canvas)]"
          initial={{ opacity: 1 }}
          exit={reduceMotion
            ? { opacity: 0, transition: { duration: 0.3 } }
            : { y: '-100%', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
        >
          {/* 워드마크 */}
          <div className="flex overflow-hidden px-4" aria-label={word}>
            {letters.map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                className="inline-block font-bold text-[color:var(--c-ink)]
                           text-[15vw] sm:text-[11vw] lg:text-[8.5vw] leading-[1.05]"
                style={{ letterSpacing: '-0.045em' }}
                initial={reduceMotion ? { opacity: 0 } : { y: '110%' }}
                animate={reduceMotion ? { opacity: 1 } : { y: '0%' }}
                transition={reduceMotion
                  ? { duration: 0.3 }
                  : { duration: LETTER_DURATION, delay: i * LETTER_STAGGER, ease: [0.22, 1, 0.36, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* 밑줄 — 글자가 다 선 다음 좌에서 우로 */}
          <motion.div
            className="mt-4 h-px w-[62vw] sm:w-[46vw] lg:w-[34vw] origin-left"
            style={{ backgroundColor: 'var(--c-ink)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: revealDone - 0.25, ease: [0.22, 1, 0.36, 1] }}
          />

          {caption && (
            <motion.p
              className="mt-4 text-[13px] sm:text-sm text-[color:var(--c-ink-3)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: revealDone - 0.1 }}
            >
              {caption}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
