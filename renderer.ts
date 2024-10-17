/**
 * Text (plaintext | markdown | latex) to HTML
 * Author: Daniel (DanielZFLiu)
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { markedHighlight } from "marked-highlight";
import 'highlight.js/styles/tokyo-night-dark.css';
import markedFootnote from 'marked-footnote'
import {v4 as uuidv4} from 'uuid';

// ==============================
// Render Latex
// ==============================
function renderLatex(text: string) {
    // replace multi-line and inline latex enclosed by $$...$$
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => {
        try {
            const rendered = katex.renderToString(p1, {
                displayMode: true,
                throwOnError: false
            });
            return rendered;
        } catch (e) {
            console.error(e);
            return match;
        }
    });

    // replace display \[...\] with rendered HTML
    text = text.replace(/\\\[(.+?)\\\]/gs, (match, p1) => {
        try {
            const rendered = katex.renderToString(p1, {
                displayMode: true,
                throwOnError: false
            });
            return rendered;
        } catch (e) {
            console.error(e);
            return match;
        }
    });

    // replace inline LaTeX expressions \(...\) with rendered HTML
    text = text.replace(/\\\((.+?)\\\)/g, (match, p1) => {
        try {
            return katex.renderToString(p1, {
                displayMode: false,
                throwOnError: false
            });
        } catch (e) {
            console.error(e);
            return match;
        }
    });

    // replace single $...$ inline expressions
    text = text.replace(/\$(.+?)\$/g, (match, p1) => {
        try {
            return katex.renderToString(p1, {
                displayMode: false,
                throwOnError: false
            });
        } catch (e) {
            console.error(e);
            return match;
        }
    });

    return text;
}

// ==============================
// Render Markdown
// ==============================
function getMarked(){
    return new Marked(
        markedHighlight({
            langPrefix: 'hljs language-',
            highlight(code, lang, info) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            }
        })
    ).use(markedFootnote({
        prefixId: `footnote-${uuidv4()}`
    }));
}

// ==============================
// Additional Styling
// ==============================
function injectInlineStyles(html: string) {
    const styles = {
        'table': 'border: 1px solid var(--voithos-silver); border-collapse: collapse;',
        'tr': 'border: 1px solid var(--voithos-silver);',
        'th, td': 'border: 1px solid var(--voithos-silver); padding: 5px;',
        'code': 'font-family: monospace; border-radius: 5px; font-size: 0.8em;',
        '.katex-html': 'display: inline-block'
    };

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    Object.entries(styles).forEach(([selector, style]) => {
        doc.querySelectorAll(selector).forEach(element => {
            // @ts-ignore
            element.style.cssText += style;
        });
    });

    return doc.body.innerHTML;
}

export async function renderText(text: string) {
    let renderedText = renderLatex(text);
    renderedText = await getMarked().parse(renderedText);
    renderedText = DOMPurify.sanitize(renderedText);
    return injectInlineStyles(renderedText);
}
