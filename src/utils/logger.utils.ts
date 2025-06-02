import * as winston from 'winston';
import * as Color from 'color'; // Import thư viện color
import * as figlet from 'figlet';

const gradientPalettes = [
  // Cầu vồng chuẩn (7 màu)
  ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],

  // Cầu vồng sáng
  ['#FF4D4D', '#FF9933', '#FFFF66', '#66FF66', '#66CCFF', '#6666FF', '#CC66FF'],

  // Cầu vồng mượt hơn
  [
    '#FF0000',
    '#FF5F00',
    '#FFAF00',
    '#FFD700',
    '#ADFF2F',
    '#00FF7F',
    '#00FA9A',
    '#4682B4',
    '#0000FF',
    '#4B0082',
    '#8A2BE2',
    '#9400D3',
  ],

  // Cầu vồng neon
  [
    '#FF007F',
    '#FF00FF',
    '#7F00FF',
    '#0000FF',
    '#007FFF',
    '#00FFFF',
    '#00FF7F',
    '#00FF00',
    '#7FFF00',
    '#FFFF00',
    '#FF7F00',
    '#FF0000',
  ],

  // Cầu vồng pastel
  [
    '#FFADAD',
    '#FFD6A5',
    '#FDFFB6',
    '#CAFFBF',
    '#9BF6FF',
    '#A0C4FF',
    '#BDB2FF',
    '#FFC6FF',
  ],
];

function rgbToAnsi(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

const lerpColor = (color1: string, color2: string, factor: number) => {
  return Color(color1).mix(Color(color2), factor);
};

// Tạo gradient màu từ `startColor` đến `endColor`
function gradientText(text: string | object) {
  const colors = gradientPalettes[Math.floor(Math.random() * gradientPalettes.length)]; // Chọn palette ngẫu nhiên
  const inputText = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
  const chars = inputText.split('');
  let result = typeof text === 'string' ? '' : '\n';

  const interpolatedColors = [];
  for (let i = 0; i < colors.length - 1; i++) {
    for (let j = 0; j < 10; j++) {
      interpolatedColors.push(lerpColor(colors[i], colors[i + 1], j / 10).hex());
    }
  }

  chars.forEach((char, i) => {
    const factor = i / (chars.length - 1); // Xác định vị trí ký tự trong tổng thể
    const colorIndex = Math.floor(factor * (interpolatedColors.length - 1)); // Xác định chỉ số màu trong bảng màu

    const color = interpolatedColors[colorIndex];
    const { r, g, b } = Color(color).rgb().object();

    result += `${rgbToAnsi(r, g, b)}${char}`;
  });

  return result + '\x1b[0m'; // Reset màu sau khi log
}

const colorize = (text: string, hex: string) => {
  const color = Color(hex);
  return `\x1b[38;2;${color.red()};${color.green()};${color.blue()}m${text}\x1b[0m`;
};

// 🌈 Định nghĩa màu cho từng level
const levelColors: Record<string, string> = {
  info: '#3498db', // Xanh dương
  error: '#e74c3c', // Đỏ
  warn: '#f1c40f', // Vàng
  debug: '#2ecc71', // Xanh lá
};

// 📝 Winston Logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      ({
        level,
        message,
        timestamp,
      }: {
        level: string;
        message: string;
        timestamp: string;
      }) => {
        const timestampStr = colorize(`[${timestamp}]`, '#95a5a6'); // Xám
        const levelStr = colorize(
          `[${level.toUpperCase()}]`,
          levelColors[level] || '#ffffff',
        ); // Màu riêng từng level
        const messageStr = level == 'error' ? colorize(message, levelColors[level] || '#ffffff'):  gradientText(message); // Cùng màu với level

        return `${timestampStr} ${levelStr} - ${messageStr}`;
      },
    ),
  ),
  transports: [new winston.transports.Console()],
});

export const rainbowLog = (text: string) => {
  figlet.text(
    text,
    {
      font: 'Standard', // Bạn có thể thay đổi font tại đây
      horizontalLayout: 'default',
      verticalLayout: 'default',
    },
    (err, data) => {
      if (err) {
        console.error('Error generating ASCII text:', err);
        return;
      }

      // Tạo màu cầu vồng cho từng ký tự
      const lines = (data || '').split('\n');
      const rainbowColors = [
        '#ff0000',
        '#ff9900',
        '#ffff00',
        '#33cc33',
        '#0099ff',
        '#9900cc',
      ];

      const coloredLines = lines.map((line) => {
        return line
          .split('') // Chia từng ký tự
          .map((char, index) => {
            const hexColor = rainbowColors[index % rainbowColors.length]; // Chọn màu theo thứ tự
            return colorize(char, hexColor); // Áp dụng màu cho ký tự
          })
          .join(''); // Ghép lại thành chuỗi hoàn chỉnh
      });

      // In ra từng dòng với màu sắc
      console.log(coloredLines.join('\n'));
    },
  );
};
