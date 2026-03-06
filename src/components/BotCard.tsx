import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, RefreshCw, Sparkles } from 'lucide-react';
import type { BotMessage } from '@/types';
import { useInView } from '@/hooks/useInView';

interface BotCardProps {
  messages: BotMessage[];
  currentNetWorth: number;
  targetNetWorth: number;
  streak: number;
}

export function BotCard({ messages, currentNetWorth, targetNetWorth, streak }: BotCardProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const progress = (currentNetWorth / targetNetWorth) * 100;
  const monthsLeft = 12 - new Date().getMonth() - 1;

  // Generate contextual message
  const getContextualMessage = (): BotMessage => {
    if (progress >= 80) {
      return {
        id: 'context-1',
        type: 'celebration',
        message: `와 ${progress.toFixed(0)}% 달성! 거의 다 왔다! 🎉 마지막까지 힘내자 💪`,
        emoji: '🎉'
      };
    } else if (progress >= 50) {
      return {
        id: 'context-2',
        type: 'praise',
        message: `벌써 절반 넘었네! ${streak}개월 연속 달성 중이야 🔥`,
        emoji: '🔥'
      };
    } else if (streak >= 3) {
      return {
        id: 'context-3',
        type: 'praise',
        message: `연속 ${streak}개월 달성! 이 기세 그대로 가보자 🚀`,
        emoji: '🚀'
      };
    } else {
      return {
        id: 'context-4',
        type: 'tip',
        message: `올해 목표까지 ${monthsLeft}개월 남았어! 천천히 합시다 😊`,
        emoji: '😊'
      };
    }
  };

  const allMessages = [getContextualMessage(), ...messages];
  const currentMessage = allMessages[currentMessageIndex];

  useEffect(() => {
    if (isInView) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInView, currentMessageIndex]);

  const handleRefresh = () => {
    setIsTyping(true);
    setCurrentMessageIndex((prev) => (prev + 1) % allMessages.length);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[28px] p-6 text-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bot className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold">부부동산봇</h3>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span className="text-xs text-white/80">AI 재무 조언</span>
            </div>
          </div>
        </div>
        <motion.button
          onClick={handleRefresh}
          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Message bubble */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 relative">
        {/* Speech bubble tail */}
        <div className="absolute -top-2 left-6 w-4 h-4 bg-white/10 backdrop-blur-sm transform rotate-45" />
        
        <AnimatePresence mode="wait">
          {isTyping ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 h-12"
            >
              <motion.span
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>
          ) : (
            <motion.p
              key="message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white/95 text-base leading-relaxed"
            >
              {currentMessage.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
        <div className="text-center">
          <p className="text-xs text-white/70 mb-1">목표 달성률</p>
          <p className="text-xl font-bold">{progress.toFixed(0)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/70 mb-1">연속 달성</p>
          <p className="text-xl font-bold">{streak}개월</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/70 mb-1">남은 기간</p>
          <p className="text-xl font-bold">{monthsLeft}개월</p>
        </div>
      </div>
    </motion.div>
  );
}
