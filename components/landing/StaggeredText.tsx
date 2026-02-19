'use client'

import { motion } from 'framer-motion'

const STAGGER_DELAY = 0.12
const baseDelay = 0.4

interface WordConfig {
  text?: string
  highlight?: boolean
  withUnderline?: boolean
  lineBreak?: boolean
}

interface StaggeredTextProps {
  words: WordConfig[]
  className?: string
}

function WordSpan({
  word,
  delay
}: {
  word: WordConfig
  delay: number
}) {
  return (
    <motion.span
      className="inline-block"
      style={{ marginRight: '0.25em' }}
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {word.withUnderline ? (
        <span className="relative inline-block">
<span className="text-brand-700">{word.text ?? ''}</span>
              <svg className="absolute -bottom-2 left-0 w-full text-brand-700" viewBox="0 0 200 12" fill="none">
                <motion.path
                  d="M2 8C50 2 150 2 198 8"
                  stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        </span>
      ) : word.highlight ? (
        <span className="text-brand-700">{word.text ?? ''}</span>
      ) : (
        word.text ?? ''
      )}
    </motion.span>
  )
}

export function StaggeredText({ words, className = '' }: StaggeredTextProps) {
  const lineBreakIndex = words.findIndex((w) => w.lineBreak)
  const firstLine = lineBreakIndex >= 0 ? words.slice(0, lineBreakIndex) : words
  const secondLine = lineBreakIndex >= 0 ? words.slice(lineBreakIndex + 1) : []

  let wordIndex = 0
  return (
    <h1 className={className}>
      <span className="whitespace-nowrap inline-block">
        {firstLine.map((word, i) => (
          <WordSpan key={i} word={word} delay={baseDelay + wordIndex++ * STAGGER_DELAY} />
        ))}
      </span>
      {secondLine.length > 0 && (
        <>
          <br />
          {secondLine.map((word, i) => (
            <WordSpan key={i} word={word} delay={baseDelay + wordIndex++ * STAGGER_DELAY} />
          ))}
        </>
      )}
    </h1>
  )
}
