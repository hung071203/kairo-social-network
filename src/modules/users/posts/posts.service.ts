import { Inject, Injectable } from '@nestjs/common';
import { PostRepositoryInterface } from 'src/database/interface/post.interface';
import { StorageService } from '../storage/storage.service';
import { Types } from 'mongoose';
import { TagsService } from '../tags/tags.service';
import { extractTags } from 'src/common/helpers';
import { PaginationDto } from 'src/common/decorators';
import { ProfileService } from '../profile/profile.service';
import { FollowService } from '../follow/follow.service';
import { PostTypeEnum } from 'src/common/enums';
import { CreatePostDto, FilterPostDto } from './dto/post.dto';
import { create } from 'domain';

@Injectable()
export class PostsService {
  constructor(
    @Inject('PostRepositoryInterface')
    private readonly postRepository: PostRepositoryInterface,
    private readonly storageService: StorageService,
    private readonly tagsService: TagsService,
    private readonly profileService: ProfileService,
    private readonly followService: FollowService,
  ) {}

  getRepository() {
    return this.postRepository;
  }

  async createPost(
    id: string,
    { content, privacy }: CreatePostDto,
    files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    // Implement your logic to create a post here
    const medias = [...(files.images ?? []), ...(files.video ?? [])];
    let mediaUrls = [];
    if (medias.length > 0) {
      const datas = await this.storageService.createStorage(medias);
      mediaUrls = datas.map((item) => {
        return { url: item.url, mimeType: item.mimeType };
      });
    }

    // tags
    const tags = extractTags(content);
    let tagIds = [];
    if (tags.length > 0) {
      tagIds = await this.tagsService.createTags(tags);
    }

    const post = await this.postRepository.create({
      content,
      author: new Types.ObjectId(id),
      mediaUrls,
      tags: tagIds,
      type: privacy,
    });

    return post;
  }

  async getPosts(
    id: string,
    { postId, seenPostIds, author }: FilterPostDto,
    pagination: PaginationDto,
  ) {
    let seenPostIdArrs: string[] = [];
    if (seenPostIds) {
      try {
        seenPostIdArrs = JSON.parse(seenPostIds);
      } catch (error) {
        throw new Error('Loại dữ liệu không hợp lệ');
      }
    }
    const followingIds = await this.followService.getAllFollowing(id);
    const blockedIds = await this.followService.getAllBlocked(id);

    const selfId = new Types.ObjectId(id);
    followingIds.push(selfId);

    const postModel = this.postRepository.getModel();

    let pinnedPost = null;

    // Lấy bài pinned (nếu có & user có quyền)
    if (postId && pagination.page === 1) {
      const pinnedQuery = {
        _id: postId,
        $or: [
          { type: PostTypeEnum.PUBLIC, author: { $nin: blockedIds } },
          { author: { $in: followingIds } },
        ],
      };

      pinnedPost = await postModel
        .findOne(pinnedQuery)
        .populate('author', 'name username avatar')
        .populate('likes', 'name username avatar')
        .populate('tags', '_id name postCount')
        .lean();

      if (pinnedPost) {
        pinnedPost.isSearch = true;
      }
    }

    const filter: any = {
      $or: [
        { author: { $in: followingIds } },
        { type: PostTypeEnum.PUBLIC, author: { $nin: blockedIds } },
      ],
    };

    const excludePostIds = [
      ...(postId ? [postId] : []),
      ...(seenPostIdArrs || []),
    ].map((id) => new Types.ObjectId(id));

    if (excludePostIds.length) {
      filter._id = { $nin: excludePostIds };
    }

    if (author) {
      filter.author = new Types.ObjectId(author);
      if (id === author) {
        filter.$or.push({ type: PostTypeEnum.PRIVATE });
      }
    }

    const posts = await postModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .populate('author', 'name username avatar')
      .populate('likes', 'name username avatar')
      .populate('tags', '_id name postCount')
      .lean();

    const returnPosts = pinnedPost ? [pinnedPost, ...posts] : posts;
    let message = null;
    if (postId && !pinnedPost && pagination.page === 1) {
      message =
        'Bài viết không tồn tại hoặc bạn không có quyền xem bài viết này';
    }
    return { message, returnPosts };
  }

  async likePost(userId: string, postId: string) {
    const post = await this.postRepository.getModel().findById(postId);
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    const user = await this.profileService.getRepository().findOne({
      _id: userId,
    });

    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const userIdStr = user._id.toString();

    const likedIndex = post.likes.findIndex(
      (like) => like.toString() === userIdStr,
    );

    if (likedIndex !== -1) {
      // Nếu đã like, thì bỏ like
      post.likes.splice(likedIndex, 1);
    } else {
      // Nếu chưa like, thì thêm like
      post.likes.push(new Types.ObjectId(userIdStr));
    }

    await post.save();
    return post;
  }

  async sharePost(userId: string, postId: string) {
    const post = await this.postRepository.findOneById(postId);
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }
    return await this.postRepository.update(postId, {
      sharesCount: post.sharesCount + 1,
    });
  }

  async getPostDetail(userId: string, postId: string) {
    const blockedIds = await this.followService.getAllBlocked(userId);
    const post = await this.postRepository
      .getModel()
      .findById(postId)
      .populate('author', '_id name username avatar')
      .populate('likes', '_id name username avatar')
      .populate('tags', '_id name postCount')
      .lean();

    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    const arrs = blockedIds.map((item) => item.toString());
    if (arrs.includes(post.author._id.toString())) {
      throw new Error('Bạn không có quyền xem bài viết này');
    }

    if (post.type === PostTypeEnum.PRIVATE) {
      throw new Error('Bài viết này là riêng tư');
    }

    if (post.type === PostTypeEnum.FOLLOWERS) {
      if (post.author._id.toString() != userId) {
        const followingIds = await this.followService.getAllFollowing(userId);
        if (
          !followingIds
            .map((item) => item.toString())
            .includes(post.author._id.toString())
        ) {
          throw new Error('Bạn không có quyền xem bài viết này');
        }
      }
    }

    const user = await this.profileService.getRepository().findOne({
      _id: userId,
    });

    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const userIdStr = user._id.toString();
    const likedIndex = post.likes.findIndex(
      (like) => like['_id'].toString() === userIdStr,
    );

    // gen content with tags
    const contents = post.content.split(' ');
    const tagNames = post.tags.map((tag) => tag['name']);
    const textWithTags = contents
      .map((word) => {
        if (tagNames.includes(word.replace('#', ''))) {
          return `<a href="/posts/tags/${word.replace(
            '#',
            '',
          )}" class="text-blue-400 hover:underline">#${word.replace(
            '#',
            '',
          )}</a>`;
        }
        return word;
      })
      .join(' ');
    return {
      ...post,
      isLiked: likedIndex !== -1,
      content: textWithTags,
      createdAt: this.formatDateTime(post['createdAt']),
    };
  }

  async updateTypePost(userId: string, postId: string, type: PostTypeEnum) {
    const post = await this.postRepository.findOne({
      _id: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
    });
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    return await this.postRepository.update(postId, {
      type,
    });
  }

  formatDateTime(isoString) {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    };
    const formatter = new Intl.DateTimeFormat('vi-VN', options);
    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'day').value;
    const month = parts.find((p) => p.type === 'month').value;
    const hour = parts.find((p) => p.type === 'hour').value;
    const minute = parts.find((p) => p.type === 'minute').value;
    return `${day} ${month} lúc ${hour}:${minute}`;
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.postRepository.findOne({
      _id: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
    });
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }
    await this.postRepository.delete(postId);
  }

  async searchPost(userId: string, search: string, pagination: PaginationDto) {
    const condition: any = {};
    if (search) {
      condition.content = { $regex: search, $options: 'i' };
    }
    const followingIds = await this.followService.getAllFollowing(userId);
    const blockedIds = await this.followService.getAllBlocked(userId);
    const selfId = new Types.ObjectId(userId);
    followingIds.push(selfId);
    condition.$or = [
      { type: PostTypeEnum.PUBLIC, author: { $nin: blockedIds } },
      { author: { $in: followingIds } },
    ];
    if (this.isValidTag(search)) {
      condition.tags = { $ne: [] };
    }
    return await this.postRepository.findAll(condition, {
      ...pagination,
      populate: [
        { path: 'author', select: 'name username avatar' },
        { path: 'likes', select: 'name username avatar' },
        { path: 'tags', select: '_id name postCount' },
      ],
    });
  }

  isValidTag(text: string): boolean {
    const hashTagPattern = /^#[a-zA-Z0-9_]+$/;
    return hashTagPattern.test(text.trim());
  }
}
