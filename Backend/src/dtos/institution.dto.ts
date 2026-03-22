import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InstitutionStudentDto {
    @IsString()
    @IsNotEmpty()
    public name!: string;

    @IsEmail()
    @IsNotEmpty()
    public email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    public password!: string;
}

export class CreateInstitutionSubmissionDto {
    @IsString()
    @IsIn(['German'])
    public language!: 'German';

    @IsString()
    @IsNotEmpty()
    public courseTitle!: string;

    @IsString()
    @IsNotEmpty()
    public levelName!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => InstitutionStudentDto)
    public students!: InstitutionStudentDto[];
}

export class RejectInstitutionSubmissionDto {
    @IsOptional()
    @IsString()
    public reason?: string;
}
