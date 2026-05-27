import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateQuery } from './validate';

describe('Validation Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: any;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        mockNext = vi.fn();
    });

    const testSchema = z.object({
        name: z.string(),
        age: z.number().optional()
    });

    describe('validate (body)', () => {
        it('should call next if validation succeeds', () => {
            mockReq.body = { name: 'John Doe', age: 30 };
            const middleware = validate(testSchema);

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 400 and mapped errors if ZodError is thrown', () => {
            mockReq.body = { name: 123, age: 'invalid' };
            const middleware = validate(testSchema);

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Error de validación',
                    errors: expect.arrayContaining([
                        { field: 'name', message: expect.any(String) },
                        { field: 'age', message: expect.any(String) }
                    ])
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should propagate unexpected errors via next', () => {
            mockReq.body = { name: 'John' };
            const fakeError = new Error('Unexpected database down error');
            const badSchema = {
                parse: () => {
                    throw fakeError;
                }
            } as any;

            const middleware = validate(badSchema);

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(fakeError);
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('validateQuery (query)', () => {
        it('should call next if query validation succeeds', () => {
            mockReq.query = { name: 'John Doe' };
            const middleware = validateQuery(testSchema);

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 400 and mapped errors if ZodError is thrown on query', () => {
            mockReq.query = { name: 123 } as any;
            const middleware = validateQuery(testSchema);

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Error de validación en parámetros',
                    errors: expect.arrayContaining([
                        { field: 'name', message: expect.any(String) }
                    ])
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should propagate unexpected errors in query validation via next', () => {
            mockReq.query = {};
            const fakeError = new Error('Unexpected schema parsing error');
            const badSchema = {
                parse: () => {
                    throw fakeError;
                }
            } as any;

            const middleware = validateQuery(badSchema);

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(fakeError);
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });
});
