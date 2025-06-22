import { Inject, Injectable } from '@nestjs/common';
import { CommentRepositoryInterface } from 'src/database/interface/comment.interface';
import { CreateCommentDto } from './dto/comment.dto';
import { Types } from 'mongoose';
import { PostsService } from '../posts/posts.service';
import { PaginationDto } from 'src/common/decorators';
import { Comment } from 'src/schemas/comments.schema';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'src/common/enums';

@Injectable()
export class CommentService {
  constructor(
    @Inject('CommentRepositoryInterface')
    private readonly commentRepository: CommentRepositoryInterface,
    private readonly postsService: PostsService, // Assuming you have a PostService to validate post existence
    private readonly notificationService: NotificationService, // Inject NotificationService
  ) {}
  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const { content, parentComment } = dto;
    
    // Lấy thông tin bài viết để biết chủ bài viết
    const post = await this.postsService.getRepository().findOneById(postId);
    if (!post) {
      throw new Error('Bài viết không tồn tại');
    }
    
    const comment = await this.commentRepository.create({
      post: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
      content,
      ...(parentComment
        ? { parentComment: new Types.ObjectId(parentComment) }
        : {}),
    });
    
    await this.postsService
      .getRepository()
      .getModel()
      .updateOne(
        {
          _id: new Types.ObjectId(postId),
        },
        {
          $inc: { commentsCount: 1 },
        },
      );    // Gửi thông báo cho chủ bài viết (không gửi cho chính mình)
    if (post.author.toString() !== userId || post.commentsCount < 10) {
      try {
        await this.notificationService.create(post.author.toString(), {
          title: 'Bình luận mới',
          type: NotificationType.COMMENT,
          message: `Có người đã bình luận về bài viết của bạn`,
          redirectUrl: `/posts/detail/${postId}`,
        });
      } catch (error) {
        // Log lỗi nhưng không throw để không ảnh hưởng việc tạo comment
        console.error('Lỗi khi gửi thông báo comment:', error);
      }
    }

    return comment;
  }

  async getComments(postId: string, dto: PaginationDto) {
    // Bước 1: Lấy 10 bình luận chính gần nhất
    const mainCommentsResult = await this.commentRepository.getModel().paginate(
      { post: new Types.ObjectId(postId), parentComment: null },
      {
        sort: { createdAt: -1 },
        populate: [{ path: 'author', select: '_id name avatar' }],
        lean: true,
        ...dto,
      },
    );

    const mainComments: Comment[] = mainCommentsResult.docs;

    // Bước 2: Lấy tất cả bình luận con ở mọi cấp độ
    const commentMap: any = new Map<string, Comment>();
    mainComments.forEach((comment: any) => {
      comment.replies = [];
      commentMap.set(comment._id.toString(), comment);
    });

    // Lấy tất cả bình luận con của post
    let allReplies: Comment[] = [];
    let parentIds = mainComments.map((c) => c._id);
    while (parentIds.length > 0) {
      const replies: Comment[] = await this.commentRepository
        .getModel()
        .find({ parentComment: { $in: parentIds } })
        .sort({ createdAt: 1 })
        .populate([
          { path: 'author', select: '_id name avatar' },
          {
            path: 'parentComment',
            populate: { path: 'author', select: '_id name avatar' },
          },
        ])
        .lean()
        .exec();

      if (replies.length === 0) break;

      // Thêm replies vào commentMap và cập nhật parentIds
      const nextParentIds: Types.ObjectId[] = [];
      replies.forEach((reply: any) => {
        reply.replies = [];
        commentMap.set(reply._id.toString(), reply);
        nextParentIds.push(reply._id);
        const parentId = reply.parentComment?._id.toString();
        if (parentId && commentMap.has(parentId)) {
          commentMap.get(parentId)!.replies!.push(reply);
        }
      });

      allReplies = allReplies.concat(replies);
      parentIds = nextParentIds;
    }

    // Bước 3: Trả về danh sách bình luận chính
    return mainComments;
  }
}
