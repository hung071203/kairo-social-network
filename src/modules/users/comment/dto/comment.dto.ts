import { IsOptional, IsString } from "class-validator";

export class CreateCommentDto {
    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    parentComment: string;
}