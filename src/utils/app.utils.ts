import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger.utils';
import { ASSETS_PATH } from 'src/common/constants';

export function imageToBase64(filePath: string) {
  const image = fs.readFileSync(filePath);
  return Buffer.from(image).toString('base64');
}

export async function loadProxies() {
  try {
    const response = await axios.get(
      'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=json&timeout=3217',
    );
    const proxyData = response.data.proxies; // Assuming the proxies are in `proxies` array

    // Filter active proxies
    const activeProxies = proxyData
      .filter((proxy) => proxy.alive === true)
      .map((proxy) => proxy.proxy);

    // Save to a JSON file
    fs.writeFileSync(
      path.join(ASSETS_PATH, 'proxies.json'),
      JSON.stringify(activeProxies, null, 2),
    );

    logger.info('Active proxies saved to proxies.json');
  } catch (error) {
    logger.error('Error fetching or saving proxies:', error.message);
  }
}
