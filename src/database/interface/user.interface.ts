import { BaseRepositoryInterface } from "src/base/base.interface.repository";
import { User } from "src/schemas/users.schema";

export interface UserRepositoryInterface extends BaseRepositoryInterface<User> {}