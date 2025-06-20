import { Inject, Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/common/decorators';
import { PostRepositoryInterface } from 'src/database/interface/post.interface';
import { CommentRepositoryInterface } from 'src/database/interface/comment.interface';
import { ReportRepositoryInterface } from 'src/database/interface/report.interface';
import { FilterPostManagementDto } from './dto/post.dto';
import { ReportType } from 'src/common/enums';
import { isValidObjectId, Types } from 'mongoose';

@Injectable()
export class PostManagementService {
  constructor(
    @Inject('PostRepositoryInterface')
    private readonly postRepository: PostRepositoryInterface,
    @Inject('CommentRepositoryInterface')
    private readonly commentRepository: CommentRepositoryInterface,
    @Inject('ReportRepositoryInterface')
    private readonly reportRepository: ReportRepositoryInterface,
  ) {}
  async getPosts(dto: FilterPostManagementDto, pagination: PaginationDto) {
    const form: any = {};

    if (dto.search && dto.search.trim()) {
      const searchTerm = dto.search.trim();

      // Nếu là ObjectId hợp lệ → tìm chính xác theo _id
      if (isValidObjectId(searchTerm)) {
        form._id = searchTerm;
        console.log('Searching by ObjectId');
      } else {
        // Escape special regex characters
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        form.$or = [{ content: { $regex: escapedSearch, $options: 'i' } }];
      }
    }

    // Add population for author information
    const options = {
      ...pagination,
      populate: [{ path: 'author', select: 'name username email avatar' }],
      sort: { createdAt: -1 }, // Sort by newest first
    };

    const result = await this.postRepository.findAll(form, options);

    return result;
  }
  async getPostById(id: string) {
    if (!isValidObjectId(id)) {
      throw new Error('ID bài viết không hợp lệ');
    }
    const post = await this.postRepository
      .getModel()
      .findOne({ _id: id })
      .populate('author', 'name username email avatar');
    return post || null;
  }
  async getPostComments(postId: string) {
    if (!isValidObjectId(postId)) {
      throw new Error('ID bài viết không hợp lệ');
    }

    // Check if post exists
    const post = await this.postRepository.findOne({ _id: postId });
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    // Get all comments for this post
    const comments = await this.commentRepository.findAll(
      { post: new Types.ObjectId(postId) },
      {
        page: 1,
        limit: 100, // Increased limit to get more comments
        populate: [{ path: 'author', select: 'name username avatar' }],
        sort: { createdAt: 1 }, // Sort by oldest first to maintain thread order
      },
    );

    // Handle both paginated and non-paginated results
    let commentsList = [];
    if (Array.isArray(comments)) {
      commentsList = comments;
    } else {
      commentsList = comments.docs || [];
    }

    // Organize comments into threaded structure
    const parentComments = [];
    const replyComments = [];

    // Separate parent comments and replies
    commentsList.forEach(comment => {
      if (!comment.parentComment) {
        parentComments.push(comment);
      } else {
        replyComments.push(comment);
      }
    });

    // Build the threaded comment structure
    const threadedComments = [];
    
    parentComments.forEach(parentComment => {
      // Add parent comment first
      threadedComments.push({
        ...parentComment,
        isReply: false,
        level: 0
      });

      // Find and add all replies to this parent comment
      const replies = replyComments.filter(reply => {
        // Check if this reply belongs to current parent (directly or indirectly)
        return reply.parentComment && 
               (reply.parentComment.toString() === parentComment._id.toString() ||
                replyComments.some(r => r._id.toString() === reply.parentComment.toString() && 
                                       r.parentComment && r.parentComment.toString() === parentComment._id.toString()));
      });      // Sort replies by creation time
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Add all replies with indentation
      replies.forEach(reply => {
        threadedComments.push({
          ...reply,
          isReply: true,
          level: 1,
          parentCommentAuthor: parentComment.author?.name || 'Unknown'
        });
      });
    });

    return threadedComments;
  }

  async deletePost(id: string) {
    if (!isValidObjectId(id)) {
      throw new Error('ID bài viết không hợp lệ');
    }

    const post = await this.postRepository.findOne({ _id: id });
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    } // Delete the post
    await this.postRepository.delete(id);

    // Note: Comments should be deleted via cascade or separate cleanup job

    return { message: 'Xóa bài viết thành công' };
  }

  async reportPost(
    postId: string,
    reportData: { reason: string; description?: string },
  ) {
    if (!isValidObjectId(postId)) {
      throw new Error('ID bài viết không hợp lệ');
    }

    const post = await this.postRepository.findOne({ _id: postId });
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    } // Create report
    const report = await this.reportRepository.create({
      target: new Types.ObjectId(postId),
      type: ReportType.POST,
      reason: reportData.reason,
      reporter: new Types.ObjectId('000000000000000000000000'), // Default admin ID, should be replaced with actual admin user ID
      isResolved: false,
    });

    return report;
  }
}
