export const AppConstant = {
  baseUrl: 'http://localhost:3001',
};

export const ASSETS_PATH = process.cwd() + '/src/common/assets/';

export const REMAINING_REQUESTS_DEFAULT = 500;

export const TIMEBAN = {
  1: 60 * 1000, // 1 minute
  2: 60 * 60 * 1000, // 1 hour
  3: 24 * 60 * 60 * 1000, // 1 day
}