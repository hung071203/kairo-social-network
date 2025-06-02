import { BaseRepositoryInterface } from "src/base/base.interface.repository";
import { Comment } from "src/schemas/comments.schema";

export interface CommentRepositoryInterface extends BaseRepositoryInterface<Comment> {}