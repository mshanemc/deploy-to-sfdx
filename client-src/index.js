import { buildCustomElementConstructor } from 'lwc';
import Main from './modules/c/main/main';

customElements.define('c-main', buildCustomElementConstructor(Main));
