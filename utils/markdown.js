import MarkdownIt from 'markdown-it';

/**
 * Markdown渲染工具
 * 使用markdown-it完整解析AI聊天内容,关闭原始HTML避免注入,启用链接识别和换行
 */
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

// 渲染Markdown文本为HTML
export function renderMarkdown(markdown) {
  if (!markdown) return '';
  return md.render(String(markdown));
}