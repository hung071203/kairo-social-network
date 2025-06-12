import { IsEnum } from 'class-validator';
import { PaginationDto } from 'src/common/decorators';

export class FilterFollowDto extends PaginationDto {
  @IsEnum(['incoming-requests', 'sent-requests', 'suggestions', 'following', 'followers', 'blockers'])
  tab: 'incoming-requests' | 'sent-requests' | 'suggestions' | 'following' | 'followers' | 'blockers';
}
