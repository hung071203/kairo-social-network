import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/users.schema';
import { Post } from 'src/schemas/posts.schema';
import { Report } from 'src/schemas/reports.schema';
import { Comment } from 'src/schemas/comments.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  async getDashboardStatistics() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel execution for better performance
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      bannedUsers,
      totalPosts,
      newPostsToday,
      newPostsThisWeek,
      newPostsThisMonth,
      totalLikes,
      totalComments,
      totalShares,
      totalReports,
      pendingReports,
      resolvedReports,
      topActiveUsers,
    ] = await Promise.all([
      // User statistics
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.userModel.countDocuments({ 
        updatedAt: { $gte: startOfToday } 
      }),
      this.userModel.countDocuments({ 
        bannedUntil: { $ne: null, $gt: now } 
      }),

      // Post statistics
      this.postModel.countDocuments(),
      this.postModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      this.postModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      this.postModel.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Interaction statistics
      this.postModel.aggregate([
        { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } }
      ]).then(result => result[0]?.totalLikes || 0),

      this.commentModel.countDocuments(),

      this.postModel.aggregate([
        { $group: { _id: null, totalShares: { $sum: '$sharesCount' } } }
      ]).then(result => result[0]?.totalShares || 0),

      // Report statistics
      this.reportModel.countDocuments(),
      this.reportModel.countDocuments({ responder: null }),
      this.reportModel.countDocuments({ responder: { $ne: null } }),

      // Top active users (based on posts count)
      this.getTopActiveUsers(),
    ]);

    return {
      // User stats
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      bannedUsers,

      // Post stats
      totalPosts,
      newPostsToday,
      newPostsThisWeek,
      newPostsThisMonth,

      // Interaction stats
      totalLikes,
      totalComments,
      totalShares,

      // Report stats
      totalReports,
      pendingReports,
      resolvedReports,      // Top users
      topActiveUsers,
    };
  }

  private async getTopActiveUsers() {
    return this.postModel.aggregate([
      {
        $group: {
          _id: '$author',
          postsCount: { $sum: 1 },
          lastPostDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          postsCount: 1,
          lastPostDate: 1,
          name: '$user.name',
          username: '$user.username',
          avatar: '$user.avatar',
          role: '$user.role'
        }
      },
      {
        $sort: { postsCount: -1, lastPostDate: -1 }
      },
      {
        $limit: 10
      }
    ]);
  }

  async getUserGrowthChart() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
  }

  async getPostGrowthChart() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.postModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
  }

  async getReportsByType() {
    return this.reportModel.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
  }
}
