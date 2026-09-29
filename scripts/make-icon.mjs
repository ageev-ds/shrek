// build/icon.svg → build/icon.png (512) + build/icon.ico (16…256)
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const svg = fs.readFileSync('build/icon.svg');
const render = (size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
fs.writeFileSync('build/icon.png', render(512));
const sizes = [16, 24, 32, 48, 64, 128, 256];
fs.writeFileSync('build/icon.ico', await pngToIco(sizes.map(render)));
console.log('build/icon.png и build/icon.ico готовы');
