import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorAutenticacion } from '../../presentation/controllers/controlador-autenticacion';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    private readonly controlador = new ControladorAutenticacion();

    @Post('login')
    iniciarSesion(@Req() req: Request, @Res() res: Response) {
        return this.controlador.iniciarSesion(req, res);
    }

    @Post('register')
    registrar(@Req() req: Request, @Res() res: Response) {
        return this.controlador.registrar(req, res);
    }

    @Post('refresh')
    refrescarToken(@Req() req: Request, @Res() res: Response) {
        return this.controlador.refrescarToken(req, res);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    cerrarSesion(@Req() req: Request, @Res() res: Response) {
        return this.controlador.cerrarSesion(req, res);
    }
}
