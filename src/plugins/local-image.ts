import { wrapFunction } from 'markmap-common';
import { ITransformHooks } from 'markmap-lib';
import { definePlugin } from 'markmap-lib/plugins';

const name = 'localImage';

function replaceImgSrc(html: string, resolveUrl: (url: string) => string) {
  return html.replace(
    /(<img\s[^>]*\bsrc\s*=\s*)(["'])([^"']*)\2/gi,
    (match, prefix, quote, src) => {
      if (src && !/^[\w-]+:/.test(src)) {
        return `${prefix}${quote}${resolveUrl(src)}${quote}`;
      }
      return match;
    },
  );
}

export default function plugin(resolveUrl: (url: string) => string) {
  return definePlugin({
    name,
    transform(transformHooks: ITransformHooks) {
      transformHooks.parser.tap((md) => {
        md.renderer.renderAttrs = wrapFunction(
          md.renderer.renderAttrs,
          (renderAttrs, token) => {
            if (token.tag === 'img') {
              const src = token.attrGet('src');
              if (src && !/^[\w-]+:/.test(src)) {
                token.attrSet('src', resolveUrl(src));
              }
            }
            return renderAttrs(token);
          },
        );

        const defaultHtmlInline =
          md.renderer.rules.html_inline ||
          ((tokens, idx) => tokens[idx].content);
        md.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
          const html = defaultHtmlInline(tokens, idx, options, env, self);
          return replaceImgSrc(html, resolveUrl);
        };

        const defaultHtmlBlock =
          md.renderer.rules.html_block ||
          ((tokens, idx) => tokens[idx].content);
        md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
          const html = defaultHtmlBlock(tokens, idx, options, env, self);
          return replaceImgSrc(html, resolveUrl);
        };
      });
      return {};
    },
  });
}
