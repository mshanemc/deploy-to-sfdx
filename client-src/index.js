import { buildCustomElementConstructor } from 'lwc';
import Main from './modules/structure/main/main';

customElements.define('structure-main', buildCustomElementConstructor(Main));
