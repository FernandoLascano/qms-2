'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, ReactNode, Children } from 'react'

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
}

interface AnimatedListProps {
  children: ReactNode
  className?: string
  /** Si true, usa ul/li para listas HTML válidas */
  asList?: boolean
}

export function AnimatedList({ children, className = '', asList = false }: AnimatedListProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const items = Children.toArray(children)

  const Wrapper = asList ? motion.ul : motion.div
  const ItemWrapper = asList ? motion.li : motion.div

  return (
    <Wrapper
      ref={ref}
      className={asList ? `${className} list-none pl-0 m-0` : className}
      variants={container}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {items.map((child, index) => (
        <ItemWrapper key={index} variants={item}>
          {child}
        </ItemWrapper>
      ))}
    </Wrapper>
  )
}
