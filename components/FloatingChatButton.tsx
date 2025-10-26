'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import AIChatModal from './AIChatModal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 z-40 group"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity animate-pulse" />

          {/* Button */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-2 border-purple-500/30 group-hover:border-purple-500/60">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <X className="w-8 h-8 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Image
                    src="/logo.png"
                    alt="Foxy"
                    width={56}
                    height={56}
                    className="object-contain group-hover:scale-110 transition-transform"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Sparkles animation on hover */}
            <AnimatePresence>
              {isHovered && !isOpen && (
                <>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.1 }}
                    className="absolute -top-1 -left-2"
                  >
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -bottom-2 -right-1"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Tooltip with "Demandez à Foxy" */}
          <AnimatePresence>
            {isHovered && !isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap"
              >
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg shadow-2xl text-sm font-bold border border-purple-400/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'fr' ? 'Demandez à Foxy' : 'Ask Foxy'}</span>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-3 h-3 bg-gradient-to-br from-purple-600 to-blue-600 border-r border-b border-purple-400/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Chat Modal */}
      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
