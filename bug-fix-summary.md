# Bug Fix Summary - Edit Profile Page

## Vấn đề gốc
```
profile:1686  Uncaught (in promise) TypeError: Cannot read properties of null (reading 'innerHTML')
    at HTMLFormElement.<anonymous> (profile:1686:47)
```

## Nguyên nhân
Lỗi xảy ra trong JavaScript xử lý form `formChangeMail` tại dòng 1284. Code đang cố gắng tìm button submit bằng:
```javascript
const submitButton = this.querySelector('button[type="submit"]');
```

Tuy nhiên, button submit không nằm bên trong form mà nằm ở `modal-footer` và được liên kết với form thông qua attribute `form="formChangeMail"`. Do đó `querySelector` trả về `null`, gây ra lỗi khi truy cập `innerHTML`.

## Cấu trúc HTML
```html
<form id="formChangeMail">
    <!-- Form fields -->
</form>
<!-- Button nằm ngoài form -->
<div class="modal-footer">
    <button type="submit" form="formChangeMail" class="btn btn-primary me-2">
        Lưu thay đổi
    </button>
</div>
```

## Giải pháp
1. **Sửa lỗi form đổi email**: Thay đổi cách tìm button submit từ:
   ```javascript
   const submitButton = this.querySelector('button[type="submit"]');
   ```
   Thành:
   ```javascript
   const submitButton = document.querySelector('button[form="formChangeMail"][type="submit"]');
   if (!submitButton) {
       console.error('Submit button not found for formChangeMail');
       return;
   }
   ```

2. **Thêm xử lý cho form đổi mật khẩu**: Tạo JavaScript xử lý tương tự cho form `formChangePass` để đảm bảo nhất quán và tránh lỗi trong tương lai.

## Lợi ích
- ✅ Sửa lỗi TypeError khi submit form đổi email
- ✅ Thêm validation và error handling cho form đổi mật khẩu
- ✅ Đảm bảo UI/UX nhất quán giữa các form
- ✅ Thêm loading states và feedback cho người dùng
- ✅ Thêm validation input phía client

## Files đã chỉnh sửa
- `src/views/admins/pages/users/edit-profile.njk`: Sửa JavaScript xử lý forms

## Test checklist
- [ ] Test form đổi email hoạt động bình thường
- [ ] Test form đổi mật khẩu hoạt động bình thường  
- [ ] Test validation các trường bắt buộc
- [ ] Test loading states của buttons
- [ ] Test error handling khi server trả về lỗi
