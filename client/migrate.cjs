const fs = require('fs');
const path = require('path');

const replacements = {
  // backgrounds
  'bg-surface-light': 'bg-surface',
  'bg-surface-lighter': 'bg-page',
  
  // text colors
  'text-text-primary': 'text-ink',
  'text-text-secondary': 'text-muted',
  'text-text-muted': 'text-muted',
  'text-primary-700': 'text-brand',
  'text-primary-800': 'text-brand',
  'text-emerald-500': 'text-brand',
  'text-emerald-600': 'text-brand',
  'text-emerald-700': 'text-brand',
  'text-rose-500': 'text-danger-text',
  'text-rose-600': 'text-danger-text',
  'text-amber-500': 'text-warning-text',
  'text-amber-600': 'text-warning-text',
  
  // borders
  'border-border': 'border-line',
  'border-primary-200': 'border-brand-ghost',
  'border-emerald-200': 'border-brand-ghost',
  'border-border-input': 'border-line-input',
  'border-border-pill': 'border-line',
  
  // utilities
  'glass-card': 'bg-surface border border-line rounded-[var(--radius-card)] p-[24px]',
  'glow-orb': '',
  'pulse-glow': '',
  'gradient-text': 'text-brand',
  'backdrop-blur-sm': '',
  'backdrop-blur-md': '',
  'backdrop-blur-lg': '',
  'backdrop-blur': '',
  'bg-white/70': 'bg-surface',
  'bg-white/80': 'bg-surface',
  'bg-white/90': 'bg-surface',
  
  // background colors
  'bg-primary-50': 'bg-brand-tint',
  'bg-emerald-50': 'bg-brand-tint',
  'bg-rose-50': 'bg-danger-bg',
  'bg-amber-50': 'bg-warning-bg',
  'bg-cyan-50': 'bg-info-bg',
  'bg-emerald-500/10': 'bg-brand-tint',
  'bg-rose-500/10': 'bg-danger-bg',

  // old UI class replacements from my previous components that got renamed
  'text-reuse-text': 'text-reuse-fg',
  'text-resell-text': 'text-resell-fg',
  'text-refurbish-text': 'text-refurbish-fg',
  'text-recycle-text': 'text-recycle-fg',
  'border-brand-ghost-border': 'border-brand-ghost',
  'text-pill-text': 'text-ink'
};

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules') walk(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      let original = content;
      
      // Do word replacements
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
        content = content.replace(regex, newClass);
      }
      
      // Remove arbitrary gradients e.g., bg-gradient-to-br, from-..., to-...
      content = content.replace(/\bbg-gradient-to-[a-z]+\b/g, '');
      content = content.replace(/\bfrom-[a-z]+-\d+(?:\/\d+)?\b/g, '');
      content = content.replace(/\bto-[a-z]+-\d+(?:\/\d+)?\b/g, '');
      content = content.replace(/\bvia-[a-z]+-\d+(?:\/\d+)?\b/g, '');
      
      // Hex values replacement
      content = content.replace(/#0a0f1e/gi, 'var(--color-ink)');
      content = content.replace(/#111827/gi, 'var(--color-ink)');
      content = content.replace(/#1f2937/gi, 'var(--color-ink)');
      content = content.replace(/#6366f1/gi, 'var(--color-brand)');
      content = content.replace(/#4f46e5/gi, 'var(--color-brand)');
      content = content.replace(/#818cf8/gi, 'var(--color-brand-tint)');
      content = content.replace(/#34d399/gi, 'var(--color-brand)');

      // Clean up multiple spaces
      content = content.replace(/  +/g, ' ');
      
      if (content !== original) {
        fs.writeFileSync(full, content);
      }
    }
  }
}
walk('c:/Users/Lenovo/Desktop/Mini Project/client/src');
console.log('Migration complete');
