import { IsNotEmpty, IsString } from 'class-validator';

export class CreateShareInvitationDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
