export function isValidPhone(phone: string): boolean {
  var phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
  return phoneRegex.test(phone);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@gmail\.com$/.test(email);
}

export function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isValidDateFormat(date: string): boolean {
  const dateRegex = /^([0-2]\d|3[0-1])-(0\d|1[0-2])-\d{4}$/;
  return dateRegex.test(date);
}

export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

