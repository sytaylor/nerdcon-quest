import { type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary:
    'bg-nerdcon-blue text-terminal-white shadow-glow-blue hover:brightness-110 active:scale-[0.97]',
  secondary:
    'border border-white/10 bg-panel-dark text-terminal-white hover:border-nerdcon-blue/40 active:scale-[0.97]',
  ghost:
    'text-fog-gray hover:text-terminal-white active:scale-[0.97]',
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-mono text-sm font-medium transition-colors ${styles[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
