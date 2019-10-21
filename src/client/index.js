import { buildCustomElementConstructor, register } from 'lwc';
import { registerWireService } from '@lwc/wire-service';

import Main from './modules/structure/main/main';

registerWireService(register);

customElements.define('structure-main', buildCustomElementConstructor(Main));
