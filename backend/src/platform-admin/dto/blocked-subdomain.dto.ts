import { IsString, MaxLength, MinLength } from 'class-validator';

export class BlockedSubdomainDto {
  @IsString()
  @MinLength(1)
  @MaxLength(63)
  subdomain: string;
}
