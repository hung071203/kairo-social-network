import { Inject, Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/common/decorators';
import { PostRepositoryInterface } from 'src/database/interface/post.interface';
import { CommentRepositoryInterface } from 'src/database/interface/comment.interface';
import { ReportRepositoryInterface } from 'src/database/interface/report.interface';
import { FilterPostManagementDto } from './dto/post.dto';
import { ReportType } from 'src/common/enums';
import { isValidObjectId, Types } from 'mongoose';
import { TagsService } from 'src/modules/users/tags/tags.service';

@Injectable()
export class PostManagementService {
  constructor(
    @Inject('PostRepositoryInterface')
    private readonly postRepository: PostRepositoryInterface,
    @Inject('CommentRepositoryInterface')
    private readonly commentRepository: CommentRepositoryInterface,
    @Inject('ReportRepositoryInterface')
    private readonly reportRepository: ReportRepositoryInterface,
    private readonly tagsService: TagsService,
  ) {}  async getPosts(dto: FilterPostManagementDto, pagination: PaginationDto) {
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
    }    // Filter by tag name if provided
    if (dto.tagName && dto.tagName.trim()) {
      try {
        // Find the tag by name first
        const tag = await this.tagsService.getRepository().findOne({ name: dto.tagName.trim() });
        if (tag) {
          // Add tag filter to posts
          form.tags = tag._id;
        } else {
          // If tag doesn't exist, return empty result
          form._id = new Types.ObjectId(); // Non-existent ID to return empty
        }
      } catch (error) {
        console.error('Error finding tag:', error);
        // If error finding tag, return empty result
        form._id = new Types.ObjectId(); // Non-existent ID to return empty
      }
    }

    // Add population for author information
    const options = {
      ...pagination,
      populate: [
        { path: 'author', select: 'name username email avatar' },
        { path: 'tags', select: 'name' }
      ],
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
  }  async getPostComments(postId: string, pagination?: PaginationDto) {
    if (!isValidObjectId(postId)) {
      throw new Error('ID bài viết không hợp lệ');
    }

    // Check if post exists
    const post = await this.postRepository.findOne({ _id: postId });
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    // Set default pagination if not provided
    const paginationOptions = pagination || { page: 1, limit: 20 };

    // Get comments in flat structure with pagination
    const result = await this.commentRepository.findAll(
      { post: new Types.ObjectId(postId) },
      {
        ...paginationOptions,
        populate: [
          { path: 'author', select: 'name username avatar' },
          { 
            path: 'parentComment', 
            select: 'author content',
            populate: { path: 'author', select: 'name username' }
          }
        ],
        sort: { createdAt: -1 }, // Sort by newest first for better UX
      },
    );

    // Process comments to add reply information
    let comments = [];
    if (Array.isArray(result)) {
      comments = result;
    } else {
      comments = result.docs || [];
    }

    // Add additional info for replies
    const processedComments = comments.map(comment => ({
      ...comment.toObject ? comment.toObject() : comment,
      isReply: !!comment.parentComment,
      parentCommentAuthor: comment.parentComment?.author?.name || null,
      parentCommentContent: comment.parentComment?.content || null,
    }));

    // Return in the same format as findAll for consistency
    if (Array.isArray(result)) {
      return processedComments;
    } else {
      return {
        ...result,
        docs: processedComments
      };
    }
  }
  async deletePost(id: string) {
    if (!isValidObjectId(id)) {
      throw new Error('ID bài viết không hợp lệ');
    }

    const post = await this.postRepository.findOne({ _id: id });
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    // Giảm postCount của các tags liên quan
    if (post.tags && post.tags.length > 0) {
      const tagIds = post.tags.map(tag => tag.toString());
      await this.tagsService.decrementTagsPostCount(tagIds);
    }

    // Delete the post
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
