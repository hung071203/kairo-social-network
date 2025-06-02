import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import {
  isValidDateFormat,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidURL,
} from '../helpers';

export function IsPhoneInVn(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'IsPhoneInVn',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isValidPhone(value);
        },
      },
    });
  };
}

export function IsGmail(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'IsGmail',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isValidEmail(value);
        },
        defaultMessage() {
          return 'Email must end with @gmail.com';
        },
      },
    });
  };
}

export function IsDateFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any) {
          return isValidDateFormat(value);
        },
        defaultMessage() {
          return 'Date format must be DD-MM-YYYY';
        },
      },
    });
  };
}

export function IsValidPass(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any) {
          return isValidPassword(value);
        },
        defaultMessage() {
          return 'Password cần có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
        },
      },
    });
  };
}

export function MinAge(minAge: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'minAge',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [minAge],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!(value instanceof Date)) return false;

          const today = new Date();
          const ageDiff = today.getFullYear() - value.getFullYear();

          const hasBirthdayPassedThisYear =
            today.getMonth() > value.getMonth() ||
            (today.getMonth() === value.getMonth() && today.getDate() >= value.getDate());

          const age = hasBirthdayPassedThisYear ? ageDiff : ageDiff - 1;

          return age >= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments) {
          return `Tuổi phải từ ${args.constraints[0]} trở lên`;
        },
      },
    });
  };
}
