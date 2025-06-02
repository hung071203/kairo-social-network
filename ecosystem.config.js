module.exports = {
    apps: [
      {
        name: 'kairo-social-network', // Tên của ứng dụng
        script: './dist/main.js', // Đường dẫn tới file entry-point (main.js) đã được biên dịch
        instances: 'max', // Số lượng worker được tạo bằng số lượng CPU máy bạn có
        exec_mode: 'cluster', // Chạy ở chế độ cluster
        env: {
        //   NODE_ENV: 'production',
        },
      },
    ],
  };
  