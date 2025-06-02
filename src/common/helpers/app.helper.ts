export const cleanAndCheckString = (input) => {
  // Kiểm tra và loại bỏ phần đặc biệt nếu có
  const containsSpecial1 = /\$~~~\$.*?\$~~~\$/gs.test(input); // Kiểm tra $~~~$...$~~~$
  const containsSpecial2 = /\$@\$.*?\$@\$/gs.test(input); // Kiểm tra $@$...$@$

  // Loại bỏ phần đặc biệt nếu tồn tại
  if (containsSpecial1) {
    input = input.replace(/\$~~~\$.*?\$~~~\$/gs, ''); // Loại bỏ phần $~~~$...$~~~$
  }
  if (containsSpecial2) {
    input = input.replace(/\$@\$.*?\$@\$/gs, ''); // Loại bỏ phần $@$...$@$
  }

  return input.trim(); // Trả về chuỗi đã xử lý
};

export const generateUsername = (name: string) => {
  // Chuyển đổi tên thành chữ thường
  const lowerCaseName = name.toLowerCase();

  // Thay thế các ký tự không phải chữ cái hoặc số bằng dấu gạch dưới
  const username = lowerCaseName.replace(/[^a-z0-9]/g, '_');

  // Trả về tên người dùng đã được xử lý
  return username + Date.now(); // Thêm timestamp để đảm bảo tính duy nhất
};

export function extractTags(content: string): string[] {
  // Biểu thức chính quy để lấy hashtag hợp lệ
  // Chỉ lấy # theo sau bởi chữ cái, số hoặc dấu gạch dưới, và phải đứng riêng (không dính với # khác)
  const tagRegex = /(^|\s)#([a-zA-Z0-9_]+)(?=\s|$|[.,!?])/g;

  // Lấy tất cả hashtag hợp lệ
  const tags = [...content.matchAll(tagRegex)].map((match) => match[2]);

  return tags;
}
