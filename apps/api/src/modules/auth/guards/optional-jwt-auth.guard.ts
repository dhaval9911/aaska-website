import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** Same as JwtAuthGuard but never throws — sets req.user = null for guests. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const token = this.extractToken(request);

    if (!token) {
      request['user'] = null;
      return true;
    }

    try {
      request['user'] = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'development-secret',
      });
    } catch {
      request['user'] = null;
    }

    return true;
  }

  private extractToken(request: Record<string, unknown>): string | undefined {
    const headers = request['headers'] as Record<string, string> | undefined;
    const [type, token] = (headers?.['authorization'] ?? '').split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
