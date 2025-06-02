import axios from 'axios';
import * as FormData from 'form-data';

export async function postImgur(readStream: any, fileName: string) {
  try {
    const form = new FormData();
    form.append('image', readStream);
    form.append('type', 'file'); // Chỉ định loại file
    form.append('name', fileName); // Tên file
    const response = await axios.post('https://api.imgur.com/3/upload', form, {
      headers: {
        Authorization: 'Client-ID ' + process.env.IMGUR_CLIENT_ID, // Thay thế bằng Client ID của bạn
        ...form.getHeaders(), // Thiết lập headers để gửi multipart/form-data
      },
    });
    return {
      url: response.data?.data?.link,
      mimeType: response.data?.data?.type,
    }; // Trả về link ảnh
  } catch (error) {
    console.error('Error uploading to Imgur:', error.response?.data);
    throw new Error('Failed to upload image to Imgur');
  }
}

export async function uploadCatbox(readStream: any, option?: {filename: string, mimeType?: string}) {
  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('userhash', ''); // Thêm userhash nếu cần
    formData.append('fileToUpload', readStream, option); // Đọc tệp nhị phân
  
    // Gửi yêu cầu POST tới API với headers từ formData
    const response = await axios.post(
      'https://catbox.moe/user/api.php',
      formData,
      {
        headers: {
          ...formData.getHeaders(), // Thêm headers tự động của formData
        },
      },
    );
  
    return response.data; // Trả về dữ liệu từ API
  } catch (error) {
    console.error('Error uploading to Catbox:', error.response?.data ? error.response.data : error);
    throw new Error('Failed to upload image to Catbox');
    
  }
}
