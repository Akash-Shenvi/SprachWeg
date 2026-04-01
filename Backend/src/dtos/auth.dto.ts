import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
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

    @IsString()
    @IsOptional()
    public phoneNumber?: string;

    @IsString()
    @IsOptional()
    public germanLevel?: string;
}

export class InstitutionRegisterDto {
    @IsString()
    @IsNotEmpty()
    public institutionName!: string;

    @IsString()
    @IsNotEmpty()
    public contactPersonName!: string;

    @IsEmail()
    @IsNotEmpty()
    public email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    public password!: string;

    @IsString()
    @IsNotEmpty()
    public phoneNumber!: string;

    @IsString()
    @IsNotEmpty()
    public city!: string;

    @IsString()
    @IsNotEmpty()
    public state!: string;

    @IsString()
    @IsNotEmpty()
    public address!: string;

    @IsString()
    @IsNotEmpty()
    public tagline!: string;
}

export class GoogleLoginDto {
    @IsString()
    @IsNotEmpty()
    public token!: string;
}

export class VerifyOtpDto {
    @IsEmail()
    public email!: string;

    @IsString()
    @IsNotEmpty()
    public otp!: string;
}

export class ResendOtpDto {
    @IsEmail()
    public email!: string;
}

export class LoginDto {
    @IsEmail()
    public email!: string;

    @IsString()
    @IsNotEmpty()
    public password!: string;
}
