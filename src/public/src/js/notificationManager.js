let choicesInstance = null;
function loadChoices(choicesElement, choicesInstance, allChoices) {
  // Nếu Choices đã được khởi tạo, hủy khởi tạo trước
  if (choicesInstance) {
    choicesInstance.removeActiveItems();
    choicesInstance.destroy();
  }

  // Khởi tạo lại Choices với dữ liệu mới
  choicesInstance = new Choices(choicesElement, {
    removeItemButton: true,
    placeholderValue: 'Chọn người dùng',
    searchPlaceholderValue: 'Tìm kiếm...',
    shouldSort: false,
  });

  // Cập nhật Choices với tất cả các lựa chọn
  choicesInstance.setChoices(allChoices, 'value', 'label', false);
  return choicesInstance; // Trả về đối tượng Choices mới
}

async function openAddNotification() {
  try {
    const choicesElement = document.getElementById('choices-multiple-user');

    const predefinedOptions = [
      { value: 0, label: 'Dev', selected: false },
      { value: 1, label: 'Admin', selected: false },
      { value: 2, label: 'User', selected: false },
    ];

    choicesInstance = loadChoices(choicesElement, choicesInstance, predefinedOptions);

    const addUserModal = new bootstrap.Offcanvas(
      document.getElementById('offcanvasAddUser'),
    );
    addUserModal.show();
  } catch (error) {
    showToast({
      message: error.message,
      header: 'Lỗi!',
      type: 'error',
      delay: 5000,
    });
  }
}

function handleChoiceChange(event, users) {
  const selectedValues = choicesInstance.getValue(true); // Lấy giá trị đã chọn

  if (!selectedValues || selectedValues.length === 0) return;

  const roles = {
    dev: 0,
    admin: 1,
    user: 2,
  };

  const lastSelectedValue = selectedValues[selectedValues.length - 1];

  Object.entries(roles).forEach(([key, role]) => {
    const userIds = users
      .filter((user) => user.role === role)
      .map((user) => user._id);

    // Kiểm tra nếu tất cả userIds đã nằm trong các giá trị đã chọn
    const allUserIdsSelected = userIds.every((id) =>
      selectedValues.includes(id),
    );
    const someUserIdsSelected = userIds.some((id) =>
      selectedValues.includes(id),
    );

    if (selectedValues.includes(key)) {
      if (
        (!allUserIdsSelected && !someUserIdsSelected) ||
        lastSelectedValue === key
      ) {
        choicesInstance.setChoiceByValue(userIds);
      } else if (!allUserIdsSelected && someUserIdsSelected) {
        choicesInstance.removeActiveItemsByValue(key);
      }
    } else {
      if (allUserIdsSelected) {
        userIds.forEach((id) => choicesInstance.removeActiveItemsByValue(id));
      }
    }
  });
}
