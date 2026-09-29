// Сборка Windows-версии: portable .exe + установщик NSIS в dist/.
// На Windows просто вызывает electron-builder. На Linux/macOS деинсталлятор NSIS
// извлекается штатным JS-ридером electron-builder (UninstallerReader) вместо запуска
// установщика под Wine — так сборка работает без 32-битного Wine.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
if (process.platform !== 'win32') {
  const macos = require('app-builder-lib/out/util/macosVersion');
  macos.isMacOsCatalina = () => true;
}
const { build, Platform } = require('electron-builder');

const targets = process.argv.slice(2).filter((a) => !a.startsWith('-'));
await build({
  targets: Platform.WINDOWS.createTarget(targets.length ? targets : ['portable', 'nsis'], require('electron-builder').Arch.x64),
});
console.log('Готово: см. папку dist/');
