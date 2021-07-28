import { AnimationController, Animation } from '@ionic/angular';

export const customAnimation = (baseEl: HTMLElement, opts?: any): Animation => {
  const DURATION = 800;

  const animationCtrl = new AnimationController();

  if (opts.direction === 'forward') {
    return animationCtrl
      .create()
      .addElement(opts.enteringEl)
      .duration(DURATION)
      .easing('cubic-bezier(.36,.66,.04,1)')
      .fromTo('transform', `translateX(100%)`, 'translateX(0px)')
      .fromTo('opacity', 1, 1);
  }
  if (opts.direction === 'back') {
    const rootAnimation = animationCtrl
      .create()
      .addElement(opts.enteringEl)
      .easing('cubic-bezier(.36,.66,.04,1)')
      .fromTo('transform', 'translateX(0)', 'translateX(100%)')
      .fromTo('opacity', 1, 0.3);

    const leavingAnimation = animationCtrl
      .create()
      .addElement(opts.leavingEl)
      .easing('cubic-bezier(.36,.66,.04,1)')
      .fromTo('transform', 'translateX(0)', 'translateX(100%)')
      .fromTo('opacity', 1, 1);

    return animationCtrl
      .create()
      .addAnimation([rootAnimation, leavingAnimation]);
  }
};
