import { IsString, Matches } from 'class-validator';

export class DismissTikTokErrorsDto {
  @IsString()
  @Matches(/^[1-9][0-9]{0,18}$/)
  throughAttemptId: string;
}
