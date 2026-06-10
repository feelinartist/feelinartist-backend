import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorConfigPublica } from '../../presentation/controllers/controlador-config-publica';

@Controller('config')
export class CatalogsController {
    private readonly controlador = new ControladorConfigPublica();

    @Get('categorias-artista')
    obtenerCategoriasArtista(@Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerCategoriasArtista(req, res);
    }

    @Get('redes-sociales')
    obtenerRedesSociales(@Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerRedesSociales(req, res);
    }

    @Get('metodos-donacion')
    obtenerMetodosDonacion(@Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerMetodosDonacion(req, res);
    }
}
