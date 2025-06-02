import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { FollowInteraction } from "src/schemas/followInteractions.chema";
import { FollowInteractionRepositoryInterface } from '../interface/followInteraction.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class FollowInteractionRepository
  extends BaseRepository<FollowInteraction>
  implements FollowInteractionRepositoryInterface
{
  constructor(
    @InjectModel(FollowInteraction.name)
    private readonly followInteractionRepository: PaginateModel<FollowInteraction>,
  ) {
    super(followInteractionRepository);
  }
}
