import { BaseRepositoryInterface } from "src/base/base.interface.repository";
import { Message } from "src/schemas/messages.schema";

export interface MessageRepositoryInterface extends BaseRepositoryInterface<Message> {}