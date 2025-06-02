import { BaseRepositoryInterface } from "src/base/base.interface.repository";
import { Post } from "src/schemas/posts.schema";

export interface PostRepositoryInterface extends BaseRepositoryInterface<Post> {}