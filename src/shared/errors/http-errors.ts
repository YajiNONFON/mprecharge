// src/shared/errors/http-errors.ts

import { AppError } from "./app-error";

export class BadRequestException extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictException extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class UnprocessableEntityException extends AppError {
  constructor(message = "Unprocessable entity") {
    super(message, 422);
  }
}

export class TooManyRequestsException extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

export class InternalServerErrorException extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500);
  }
}
