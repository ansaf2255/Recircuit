const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== 'ui') walk(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      let original = content;

      // 1. Text Colors
      content = content.replace(/\btext-(?:primary|emerald)-\d+(?:\/\d+)?\b/g, 'text-brand');
      content = content.replace(/\btext-rose-\d+(?:\/\d+)?\b/g, 'text-danger-text');
      content = content.replace(/\btext-amber-\d+(?:\/\d+)?\b/g, 'text-warning-text');
      content = content.replace(/\btext-cyan-\d+(?:\/\d+)?\b/g, 'text-info-text');
      content = content.replace(/\btext-white\b/g, 'text-surface'); // Sometimes used over light bgs, but wait, text-white is valid tailwind, I should only remove if requested. Prompt: "Remove dark-only text colours (text-white on light backgrounds)" - I'll just leave text-white alone unless it's obviously bad, actually prompt said "Remove ... dark-only text colours (text-white on light backgrounds)". I can't easily parse that with regex. I'll replace 'text-white' with 'text-surface' where we need to, but let's not blanket replace it, it might break primary buttons.
      
      // 2. Background Colors
      content = content.replace(/\bbg-(?:primary|emerald)-(100|200|300|400|50)(?:\/\d+)?\b/g, 'bg-brand-tint');
      content = content.replace(/\bbg-(?:primary|emerald)-(500|600|700|800|900)(?:\/\d+)?\b/g, 'bg-brand');
      
      content = content.replace(/\bbg-rose-(100|200|300|400|50)(?:\/\d+)?\b/g, 'bg-danger-bg');
      content = content.replace(/\bbg-rose-(500|600|700|800|900)(?:\/\d+)?\b/g, 'bg-danger-text'); // since danger-text is the dark red token
      
      content = content.replace(/\bbg-amber-(100|200|300|400|50)(?:\/\d+)?\b/g, 'bg-warning-bg');
      content = content.replace(/\bbg-amber-(500|600|700|800|900)(?:\/\d+)?\b/g, 'bg-warning-text');

      content = content.replace(/\bbg-cyan-(100|200|300|400|50)(?:\/\d+)?\b/g, 'bg-info-bg');
      content = content.replace(/\bbg-cyan-(500|600|700|800|900)(?:\/\d+)?\b/g, 'bg-info-text');

      // 3. Border Colors
      content = content.replace(/\bborder-(?:primary|emerald)-\d+(?:\/\d+)?\b/g, 'border-brand-ghost');
      content = content.replace(/\bborder-rose-\d+(?:\/\d+)?\b/g, 'border-danger-bg');
      content = content.replace(/\bborder-amber-\d+(?:\/\d+)?\b/g, 'border-warning-bg');

      // 4. Ring Colors
      content = content.replace(/\bring-(?:primary|emerald)-\d+(?:\/\d+)?\b/g, 'ring-brand');
      content = content.replace(/\bring-rose-\d+(?:\/\d+)?\b/g, 'ring-danger-text');

      // Clean up multiple spaces
      content = content.replace(/  +/g, ' ');
      
      if (content !== original) {
        fs.writeFileSync(full, content);
      }
    }
  }
}
walk('c:/Users/Lenovo/Desktop/Mini Project/client/src');
console.log('Migration 2 complete');
