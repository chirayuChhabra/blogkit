import * as fs from 'fs'
import { Lesson, Block, BuildOptions, QuizFile, QuizQuestion } from './types'

// ─── Simple markdown → HTML (no deps) ────────────────────────────────────────

function mdToHtml(md: string): { html: string; title: string } {
  let title = ''
  const lines = md.split('\n')
  const out: string[] = []
  let inCode = false
  let codeLines: string[] = []
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
        codeLines = []
      } else {
        out.push(`<pre><code class="lang-${codeLang}">${escHtml(codeLines.join('\n'))}</code></pre>`)
        inCode = false
      }
      continue
    }
    if (inCode) { codeLines.push(line); continue }

    if (line.startsWith('# ')) {
      title = line.slice(2)
      out.push(`<h2>${inline(line.slice(2))}</h2>`)
    } else if (line.startsWith('## ')) {
      out.push(`<h3>${inline(line.slice(3))}</h3>`)
    } else if (line.startsWith('### ')) {
      out.push(`<h4>${inline(line.slice(4))}</h4>`)
    } else if (line.startsWith('> ')) {
      out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Collect list items
      const items: string[] = []
      let j = i
      while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* '))) {
        items.push(`<li>${inline(lines[j].slice(2))}</li>`)
        j++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      i = j - 1
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      let j = i
      while (j < lines.length && /^\d+\. /.test(lines[j])) {
        items.push(`<li>${inline(lines[j].replace(/^\d+\. /, ''))}</li>`)
        j++
      }
      out.push(`<ol>${items.join('')}</ol>`)
      i = j - 1
    } else if (line.startsWith('---') || line.startsWith('===')) {
      out.push('<hr>')
    } else if (line.trim() === '') {
      out.push('')
    } else {
      out.push(`<p>${inline(line)}</p>`)
    }
  }

  return { html: out.join('\n'), title }
}

function inline(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Read file or inline string ───────────────────────────────────────────────

function readContent(src: string | { inline: string }): string {
  if (typeof src === 'object' && 'inline' in src) return src.inline
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ File not found: ${src}`)
    return `_Content not found: ${src}_`
  }
  return fs.readFileSync(src, 'utf-8')
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function renderBlock(block: Block, idx: number): { html: string; navEntry?: string } {
  switch (block.type) {

    case 'head': {
      const md = readContent(block.src)
      const { html, title } = mdToHtml(md)
      const label = block.title ?? title ?? 'Section'
      const id = `section-${idx}`
      return {
        html: `<section id="${id}" class="bk-section bk-head">${html}</section>`,
        navEntry: `<a href="#${id}" class="bk-nav-item bk-nav-head" data-id="${id}">${escHtml(label)}</a>`
      }
    }

    case 'add': {
      const md = readContent(block.src)
      const { html } = mdToHtml(md)
      return { html: `<div class="bk-add">${html}</div>` }
    }

    case 'subhead': {
      const md = readContent(block.src)
      const { html, title } = mdToHtml(md)
      const label = block.label ?? title ?? 'Subsection'
      const id = `section-${idx}`
      return {
        html: `<section id="${id}" class="bk-section bk-subhead">${html}</section>`,
        navEntry: `<a href="#${id}" class="bk-nav-item bk-nav-sub" data-id="${id}">${escHtml(label)}</a>`
      }
    }

    case 'imp': {
      const variantMap = { important: '⚡ Important', warning: '⚠ Warning', tip: '💡 Tip' }
      const label = variantMap[block.variant ?? 'important']
      const content = readContent(block.src)
      const { html } = mdToHtml(content)
      return {
        html: `<div class="bk-callout bk-callout--${block.variant ?? 'important'}">
          <div class="bk-callout-label">${label}</div>
          <div class="bk-callout-body">${html}</div>
        </div>`
      }
    }

    case 'note': {
      const variantMap = { info: 'ℹ Note', caution: '⚡ Caution' }
      const label = variantMap[block.variant ?? 'info']
      const content = readContent(block.src)
      const { html } = mdToHtml(content)
      return {
        html: `<div class="bk-callout bk-callout--${block.variant ?? 'info'}">
          <div class="bk-callout-label">${label}</div>
          <div class="bk-callout-body">${html}</div>
        </div>`
      }
    }

    case 'code': {
      const raw = readContent(block.src)
      const lang = block.lang ?? (typeof block.src === 'string' ? block.src.split('.').pop() ?? '' : '')
      return {
        html: `<div class="bk-code-block">
          ${block.label ? `<div class="bk-code-label">${escHtml(block.label)}</div>` : ''}
          <pre><code class="lang-${lang}">${escHtml(raw)}</code></pre>
        </div>`
      }
    }

    case 'sim': {
      const propsJson = JSON.stringify(block.props ?? {})
      const simSrc = fs.existsSync(block.engine)
        ? fs.readFileSync(block.engine, 'utf-8')
        : `console.warn('Sim not found: ${block.engine}')`
      return {
        html: `<div class="bk-embed bk-sim">
          <div class="bk-embed-label">
            <span class="bk-embed-badge bk-badge--sim">Simulation</span>
            ${block.label ? escHtml(block.label) : ''}
          </div>
          <div class="bk-embed-frame" style="height:${block.height ?? 420}px">
            <iframe srcdoc="${iframeDoc(simSrc, propsJson)}" 
              sandbox="allow-scripts" 
              style="width:100%;height:100%;border:none;border-radius:8px">
            </iframe>
          </div>
        </div>`
      }
    }

    case 'anim': {
      const animSrc = fs.existsSync(block.engine)
        ? fs.readFileSync(block.engine, 'utf-8')
        : `console.warn('Anim not found: ${block.engine}')`
      return {
        html: `<div class="bk-embed bk-anim">
          <div class="bk-embed-label">
            <span class="bk-embed-badge bk-badge--anim">Animation</span>
            ${block.label ? escHtml(block.label) : ''}
          </div>
          <div class="bk-embed-frame" style="height:${block.height ?? 360}px">
            <iframe srcdoc="${iframeDoc(animSrc, '{}', block.loop)}"
              sandbox="allow-scripts"
              style="width:100%;height:100%;border:none;border-radius:8px">
            </iframe>
          </div>
        </div>`
      }
    }

    case 'quiz': {
      let quiz: QuizFile = { questions: [] }
      if (fs.existsSync(block.src)) {
        quiz = JSON.parse(fs.readFileSync(block.src, 'utf-8'))
      } else {
        console.warn(`  ⚠ Quiz not found: ${block.src}`)
      }
      return {
        html: `<div class="bk-quiz" id="quiz-${idx}">
          <div class="bk-quiz-head">Check your understanding</div>
          ${quiz.questions.map((q, qi) => renderQuestion(q, `quiz-${idx}`, qi)).join('\n')}
        </div>`,
        navEntry: `<a href="#quiz-${idx}" class="bk-nav-item bk-nav-quiz" data-id="quiz-${idx}">Questions</a>`
      }
    }

    case 'divider':
      return { html: '<hr class="bk-divider">' }

    default:
      return { html: '' }
  }
}

function renderQuestion(q: QuizQuestion, quizId: string, qi: number): string {
  const qid = `${quizId}-q${qi}`
  const options = q.options.map((opt, oi) => `
    <button class="bk-opt" data-correct="${oi === q.answer}" onclick="bkAnswer(this,'${qid}')">
      <span class="bk-opt-dot"></span>${escHtml(opt)}
    </button>`).join('')
  return `
    <div class="bk-question" id="${qid}">
      <p class="bk-q-text">${escHtml(q.q)}</p>
      <div class="bk-opts">${options}</div>
      ${q.explanation ? `<div class="bk-explanation" id="${qid}-exp" hidden>${escHtml(q.explanation)}</div>` : ''}
    </div>`
}

// Wraps a JS string in a minimal iframe document
function iframeDoc(js: string, props: string, loop?: boolean): string {
  const doc = `<!DOCTYPE html><html><head>
<style>*{margin:0;box-sizing:border-box}body{background:#0f0f13;color:#eee;font-family:sans-serif;overflow:hidden}</style>
</head><body>
<canvas id="c" style="display:block"></canvas>
<script>window.__simProps=${props};window.__loop=${loop ?? false};
${js}<\/script>
</body></html>`
  return doc.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')
}

// ─── Page shell ───────────────────────────────────────────────────────────────

function renderPage(
  lesson: Lesson,
  navHtml: string,
  bodyHtml: string,
  opts: BuildOptions
): string {
  const theme = opts.theme ?? 'auto'
  const schemeAttr = theme === 'auto' ? '' : `color-scheme="${theme}"`

  return `<!DOCTYPE html>
<html lang="en" ${schemeAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(lesson.meta.title)}</title>
${lesson.meta.description ? `<meta name="description" content="${escHtml(lesson.meta.description)}">` : ''}
<style>
${pageCSS(theme)}
</style>
</head>
<body>
<div class="bk-shell">
  <nav class="bk-sidebar">
    <div class="bk-sidebar-title">${escHtml(lesson.meta.title)}</div>
    <div class="bk-nav">${navHtml}</div>
  </nav>
  <main class="bk-main">
    <div class="bk-content">${bodyHtml}</div>
  </main>
</div>
<script>
${clientScript()}
</script>
</body>
</html>`
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

function pageCSS(theme: string): string {
  const scheme = theme === 'auto'
    ? '@media(prefers-color-scheme:dark){:root{--bg:#0f0f13;--bg2:#1a1a22;--bg3:#22222e;--text:#e8e8f0;--text2:#9090a8;--text3:#5a5a72;--border:#2e2e40;--accent:#7f77dd;--accent-bg:#1e1c38}}'
    : theme === 'dark'
    ? ':root{--bg:#0f0f13;--bg2:#1a1a22;--bg3:#22222e;--text:#e8e8f0;--text2:#9090a8;--text3:#5a5a72;--border:#2e2e40;--accent:#7f77dd;--accent-bg:#1e1c38}'
    : ''

  return `
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#ffffff;--bg2:#f8f8fc;--bg3:#f0f0f8;
  --text:#1a1a2e;--text2:#5a5a78;--text3:#9090b0;
  --border:#e0e0ee;--accent:#534ab7;--accent-bg:#eeedfe;
  --imp:#854f0b;--imp-bg:#faeeda;--imp-border:#ef9f27;
  --warn:#993c1d;--warn-bg:#faece7;--warn-border:#d85a30;
  --tip:#0f6e56;--tip-bg:#e1f5ee;--tip-border:#1d9e75;
  --info:#185fa5;--info-bg:#e6f1fb;--info-border:#378add;
  --sim-bg:#e6f1fb;--sim-border:#378add;--sim-text:#185fa5;
  --anim-bg:#f0f0f8;--anim-border:#b4b2a9;
  --quiz-bg:#f8f8fc;--quiz-border:#e0e0ee;
  --correct:#0f6e56;--wrong:#993c1d;
}
${scheme}

html{font-size:16px;line-height:1.7}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}

.bk-shell{display:grid;grid-template-columns:240px 1fr;min-height:100vh}

/* Sidebar */
.bk-sidebar{
  background:var(--bg2);border-right:1px solid var(--border);
  padding:24px 0;position:sticky;top:0;height:100vh;overflow-y:auto
}
.bk-sidebar-title{
  font-size:13px;font-weight:600;color:var(--text3);
  padding:0 20px 16px;letter-spacing:.04em;text-transform:uppercase
}
.bk-nav{display:flex;flex-direction:column;gap:2px}
.bk-nav-item{
  display:block;padding:8px 20px;font-size:14px;
  color:var(--text2);text-decoration:none;
  border-left:2px solid transparent;transition:all .15s
}
.bk-nav-item:hover{color:var(--text);background:var(--bg3)}
.bk-nav-item.active{color:var(--accent);border-left-color:var(--accent);background:var(--accent-bg)}
.bk-nav-sub{padding-left:32px;font-size:13px}
.bk-nav-quiz{font-style:italic}

/* Main content */
.bk-main{padding:48px 64px;max-width:860px}
.bk-content{display:flex;flex-direction:column;gap:28px}

/* Typography */
.bk-section h2,.bk-head h2{font-size:26px;font-weight:600;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px}
.bk-section h3,.bk-subhead h3{font-size:20px;font-weight:600;margin-bottom:12px;color:var(--text)}
.bk-section h4{font-size:17px;font-weight:500;margin-bottom:8px}
p{color:var(--text2);line-height:1.8;margin-bottom:12px}
p:last-child{margin-bottom:0}
ul,ol{padding-left:24px;color:var(--text2);margin-bottom:12px}
li{margin-bottom:4px}
blockquote{border-left:3px solid var(--accent);padding:8px 16px;background:var(--accent-bg);border-radius:0 8px 8px 0;margin-bottom:12px}
code{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:.88em;font-family:monospace}
pre{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:20px;overflow-x:auto;margin-bottom:12px}
pre code{background:none;border:none;padding:0;font-size:.9em}
a{color:var(--accent)}

/* Callouts */
.bk-callout{border-radius:10px;padding:16px 20px;border-left:3px solid}
.bk-callout--important{background:var(--imp-bg);border-color:var(--imp-border)}
.bk-callout--warning{background:var(--warn-bg);border-color:var(--warn-border)}
.bk-callout--tip{background:var(--tip-bg);border-color:var(--tip-border)}
.bk-callout--info{background:var(--info-bg);border-color:var(--info-border)}
.bk-callout-label{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;opacity:.7}
.bk-callout--important .bk-callout-label{color:var(--imp)}
.bk-callout--warning .bk-callout-label{color:var(--warn)}
.bk-callout--tip .bk-callout-label{color:var(--tip)}
.bk-callout--info .bk-callout-label{color:var(--info)}

/* Code block */
.bk-code-block{border:1px solid var(--border);border-radius:10px;overflow:hidden}
.bk-code-label{background:var(--bg2);padding:8px 16px;font-size:12px;color:var(--text3);border-bottom:1px solid var(--border);font-family:monospace}
.bk-code-block pre{border:none;border-radius:0;margin:0}

/* Embeds */
.bk-embed{border:1px solid var(--border);border-radius:12px;overflow:hidden}
.bk-embed-label{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--border);font-size:13px;color:var(--text2)}
.bk-embed-frame{background:var(--bg3)}
.bk-embed-badge{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:3px 8px;border-radius:4px}
.bk-badge--sim{background:var(--sim-bg);color:var(--sim-text);border:1px solid var(--sim-border)}
.bk-badge--anim{background:var(--anim-bg);color:var(--text3);border:1px solid var(--anim-border)}

/* Quiz */
.bk-quiz{border:1px solid var(--border);border-radius:12px;overflow:hidden}
.bk-quiz-head{background:var(--bg2);padding:12px 20px;font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border)}
.bk-question{padding:20px;border-bottom:1px solid var(--border)}
.bk-question:last-child{border-bottom:none}
.bk-q-text{font-size:15px;font-weight:500;color:var(--text);margin-bottom:14px}
.bk-opts{display:flex;flex-direction:column;gap:8px}
.bk-opt{
  display:flex;align-items:center;gap:10px;width:100%;text-align:left;
  padding:10px 14px;border-radius:8px;border:1px solid var(--border);
  background:var(--bg);color:var(--text2);font-size:14px;cursor:pointer;transition:all .15s
}
.bk-opt:hover{border-color:var(--accent);color:var(--text);background:var(--accent-bg)}
.bk-opt.correct{background:var(--tip-bg);border-color:var(--tip-border);color:var(--correct);pointer-events:none}
.bk-opt.wrong{background:var(--warn-bg);border-color:var(--warn-border);color:var(--wrong);pointer-events:none}
.bk-opt.disabled{opacity:.5;pointer-events:none}
.bk-opt-dot{width:14px;height:14px;border-radius:50%;border:1.5px solid currentColor;flex-shrink:0}
.bk-opt.correct .bk-opt-dot{background:var(--correct);border-color:var(--correct)}
.bk-opt.wrong .bk-opt-dot{background:var(--wrong);border-color:var(--wrong)}
.bk-explanation{margin-top:12px;font-size:13px;color:var(--text2);background:var(--bg2);border-radius:8px;padding:10px 14px;border:1px solid var(--border)}
.bk-divider{border:none;border-top:1px solid var(--border);margin:8px 0}

@media(max-width:720px){
  .bk-shell{grid-template-columns:1fr}
  .bk-sidebar{display:none}
  .bk-main{padding:24px 20px}
}
`
}

// ─── Client-side script (injected inline) ─────────────────────────────────────

function clientScript(): string {
  return `
// Quiz interaction
function bkAnswer(btn, qid) {
  const isCorrect = btn.dataset.correct === 'true'
  const question = document.getElementById(qid)
  question.querySelectorAll('.bk-opt').forEach(b => {
    b.classList.add(b.dataset.correct === 'true' ? 'correct' : (b === btn ? 'wrong' : 'disabled'))
  })
  const exp = document.getElementById(qid + '-exp')
  if (exp) exp.hidden = false
}

// Active sidebar link on scroll
const sections = document.querySelectorAll('[id^="section-"], [id^="quiz-"]')
const navLinks = document.querySelectorAll('.bk-nav-item')
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.id === e.target.id))
    }
  })
}, { threshold: 0.2 })
sections.forEach(s => obs.observe(s))
`
}

// ─── Main render function ─────────────────────────────────────────────────────

export function render(lesson: Lesson, opts: BuildOptions = {}): string {
  const navItems: string[] = []
  const bodyItems: string[] = []

  lesson.blocks.forEach((block, idx) => {
    const { html, navEntry } = renderBlock(block, idx)
    bodyItems.push(html)
    if (navEntry) navItems.push(navEntry)
  })

  return renderPage(lesson, navItems.join('\n'), bodyItems.join('\n'), opts)
}
