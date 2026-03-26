import {Component, Property} from '@wonderlandengine/api';

export class MobileControls extends Component {
    static TypeName = 'mobile-controls';
    static Properties = {
        headObject: Property.object()
    };

    start() {
        this.moveX = 0;
        this.moveY = 0;
        this.isLooking = false;
        this.joystickActive = false;
        this.joystickId = null;
        this.lookId = null;
        this.lookStartX = 0;
        this.lookStartY = 0;

        // Solo activar en dispositivos tactiles
        if (!('ontouchstart' in window)) return;

        // Deshabilitar mouse-look en movil
        const mouseLook = this.headObject?.getComponent('mouse-look');
        if (mouseLook) mouseLook.active = false;

        this.createJoystick();

        window.addEventListener('touchstart', this.onTouchStart.bind(this), {passive: false});
        window.addEventListener('touchmove', this.onTouchMove.bind(this), {passive: false});
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    createJoystick() {
        const style = document.createElement('style');
        style.textContent = `
            #joyBase {
                position: fixed;
                bottom: 80px;
                left: 60px;
                width: 110px;
                height: 110px;
                background: rgba(255,255,255,0.12);
                border: 2px solid rgba(255,255,255,0.35);
                border-radius: 50%;
                z-index: 9999;
                touch-action: none;
            }
            #joyKnob {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 48px;
                height: 48px;
                background: rgba(255,255,255,0.55);
                border-radius: 50%;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);

        const base = document.createElement('div');
        base.id = 'joyBase';
        const knob = document.createElement('div');
        knob.id = 'joyKnob';
        base.appendChild(knob);
        document.body.appendChild(base);

        this.joyBase = base;
        this.joyKnob = knob;
    }

    onTouchStart(e) {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.clientX < window.innerWidth * 0.5 && !this.joystickActive) {
                this.joystickActive = true;
                this.joystickId = t.identifier;
                this.joyRect = this.joyBase.getBoundingClientRect();
            } else if (t.clientX >= window.innerWidth * 0.5 && !this.isLooking) {
                this.isLooking = true;
                this.lookId = t.identifier;
                this.lookStartX = t.clientX;
                this.lookStartY = t.clientY;
            }
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier === this.joystickId) {
                const cx = this.joyRect.left + this.joyRect.width / 2;
                const cy = this.joyRect.top + this.joyRect.height / 2;
                const dx = t.clientX - cx;
                const dy = t.clientY - cy;
                const max = 40;
                const dist = Math.min(Math.hypot(dx, dy), max);
                const angle = Math.atan2(dy, dx);
                const kx = Math.cos(angle) * dist;
                const ky = Math.sin(angle) * dist;

                this.joyKnob.style.transform =
                    `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;

                this.moveX = dx / max;
                this.moveY = dy / max;

            } else if (t.identifier === this.lookId) {
                const dx = t.clientX - this.lookStartX;
                const dy = t.clientY - this.lookStartY;
                this.lookStartX = t.clientX;
                this.lookStartY = t.clientY;

                this.object.rotateAxisAngleDegObject([0,1,0], -dx * 0.2);
                if (this.headObject) {
                    this.headObject.rotateAxisAngleDegObject([1,0,0], -dy * 0.2);
                }
            }
        }
    }

    onTouchEnd(e) {
        for (const t of e.changedTouches) {
            if (t.identifier === this.joystickId) {
                this.joystickActive = false;
                this.joystickId = null;
                this.moveX = 0;
                this.moveY = 0;
                this.joyKnob.style.transform = 'translate(-50%, -50%)';
            }
            if (t.identifier === this.lookId) {
                this.isLooking = false;
                this.lookId = null;
            }
        }
    }

    update(dt) {
        if (!this.joystickActive) return;
        const speed = 0.1;
        this.object.translateObject([
            this.moveX * speed,
            0,
            this.moveY * speed
        ]);
    }
}
