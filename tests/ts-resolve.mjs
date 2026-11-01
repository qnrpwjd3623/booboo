// 테스트 전용: Vercel 배포용 '.js' 상대 import를 로컬 '.ts' 소스로 연결한다.
import { register } from 'node:module';

register('data:text/javascript,' + encodeURIComponent(`
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
    const tsUrl = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
    const jsUrl = new URL(specifier, context.parentURL);
    if (!existsSync(fileURLToPath(jsUrl)) && existsSync(fileURLToPath(tsUrl))) {
      return next(tsUrl.href, context);
    }
  }
  return next(specifier, context);
}
`));
