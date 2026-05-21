import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided.');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'development-secret',
      });
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private extractToken(request: Record<string, unknown>): string | undefined {
    const headers = request['headers'] as Record<string, string> | undefined;
    const [type, token] = (headers?.['authorization'] ?? '').split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
