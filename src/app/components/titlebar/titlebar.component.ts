import { Component, Input } from '@angular/core';
import { PopoverController, Platform } from '@ionic/angular';
import { TitlebarmenuitemComponent } from '../titlebarmenuitem/titlebarmenuitem.component';
import {
  TitleBarTheme,
  TitleBarSlotItem,
  TitleBarMenuItem,
  TitleBarIconSlot,
  TitleBarIcon,
  TitleBarNavigationMode,
  TitleBarForegroundMode,
} from './titlebar.types';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-titlebar',
  templateUrl: './titlebar.component.html',
  styleUrls: ['./titlebar.component.scss'],
})
export class TitleBarComponent {
  public menu: any = null;
  @Input() lightThemeType: number = 1;
  @Input()
  set title(title: string) {
    this._title = title;
  }

  public _title: string = '';

  public visibile: boolean = true;
  public menuVisible: boolean = false;
  public newNotifications: boolean = false;
  private navigationMode: TitleBarNavigationMode;

  //public theme: TitleBarTheme = { backgroundColor: "#FFFFFF", color: "000000" };
  public foregroundMode: TitleBarForegroundMode;

  public icons: TitleBarSlotItem[] = [
    TitleBarComponent.makeDefaultIcon(), // outer left
    TitleBarComponent.makeDefaultIcon(), // inner left
    TitleBarComponent.makeDefaultIcon(), // inner right
    TitleBarComponent.makeDefaultIcon(), // outer right
  ];

  private itemClickedListeners: ((
    icon: TitleBarSlotItem | TitleBarMenuItem,
  ) => void)[] = [];

  public menuItems: TitleBarMenuItem[] = [];

  constructor(
    private popoverCtrl: PopoverController,
    private platform: Platform,
    public theme: ThemeService,
  ) {}

  public isIOSPlatform(): boolean {
    if (this.platform.is('ios')) {
      return true;
    }

    return false;
  }

  private static makeDefaultIcon(): TitleBarSlotItem {
    return {
      visible: false,
      key: null,
      iconPath: null,
      badgeCount: 0,
    };
  }

  /**
   * Sets the main title bar title information. Pass null to clear the previous title.
   * Apps are responsible for managing this title from their internal screens.
   *
   * @param title Main title to show on the title bar. If title is not provided, the title bar shows the default title (the app name)
   */
  public setTitle(title: string) {
    this._title = title;
  }

  /**
   * Sets the status bar background color.
   *
   * @param hexColor Hex color code with format "#RRGGBB"
   */
  public setTheme(
    backgroundColor: string,
    foregroundMode: TitleBarForegroundMode,
  ) {
    this.setBackgroundColor(backgroundColor);
    this.setForegroundMode(foregroundMode);
  }

  /**
   * Sets the status bar background color.
   *
   * @param hexColor Hex color code with format "#RRGGBB"
   */
  public setBackgroundColor(hexColor: string) {
    //this.theme.backgroundColor = hexColor;
  }

  /**
   * Sets the title bar foreground (title, icons) color. Use this API in coordination with
   * setBackgroundColor() in order to adjust foreground with background.
   *
   * @param foregroundMode A @TitleBarForegroundMode mode, LIGHT or DARK.
   */
  public setForegroundMode(foregroundMode: TitleBarForegroundMode) {
    this.foregroundMode = foregroundMode;

    // if (foregroundMode == TitleBarForegroundMode.LIGHT)
    //   this.theme.color = "#FFFFFF";
    // else
    //   this.theme.color = "#000000";
  }

  /**
   * Adds a listener to be notified when an icon is clicked. This works for both flat icons
   * (setIcon()) and menu items (setupMenuItems()). Use the icon "key" field to know which
   * icon was clicked.
   *
   * @param onItemClicked Callback called when an item is clicked.
   */
  public addOnItemClickedListener(
    onItemClicked: (icon: TitleBarSlotItem | TitleBarMenuItem) => void,
  ) {
    this.itemClickedListeners.push(onItemClicked);
  }

  /**
   * Remove a listener.
   *
   * @param onItemClicked Callback called when an item is clicked.
   */
  public removeOnItemClickedListener(
    onItemClicked: (icon: TitleBarSlotItem | TitleBarMenuItem) => void,
  ) {
    this.itemClickedListeners.splice(
      this.itemClickedListeners.indexOf(onItemClicked),
      1,
    );
  }

  /**
   * Configures icons displayed on the left or right of the main title.
   *
   * If a caller requests to edit the OUTER_LEFT icon, we automatically switch to CUSTOM navigation mode.
   *
   * @param iconSlot Location to configure.
   * @param icon Icon and action to be used at this slot. Use null to clear any existing configuration.
   */
  public setIcon(iconSlot: TitleBarIconSlot, icon: TitleBarIcon) {
    if (icon) {
      this.icons[iconSlot].visible = true;
      this.icons[iconSlot].key = icon.key;
      this.icons[iconSlot].iconPath = icon.iconPath;
    } else {
      this.icons[iconSlot].visible = false;
      this.icons[iconSlot].key = null;
      this.icons[iconSlot].iconPath = null;
    }
  }

  getIconPath(iconSlot: TitleBarIconSlot) {
    // Special case for the outer right icon in case a menu is configured
    return this.icons[iconSlot].iconPath;
  }

  /**
   * Configures the menu popup that is opened when the top right menu icon is touched.
   * This menu popup mixes app-specific items (menuItems) and native system actions.
   * When a menu item is touched, the item click listener is called.
   *
   * In case this menu items is configured, it overwrites any icon configured on the OUTER_RIGHT
   * slot.
   *
   * @param menuItems List of app-specific menu entries @TitleBarMenuItem . Pass null to remove the existing menu.
   */
  public setupMenuItems(menuItems: TitleBarMenuItem[]) {
    this.menuItems = menuItems;
  }

  /**
   * Adds a badge marker on the top right of an icon slot. Used for example to shows that some
   * notifications are available, unread messages, etc.
   *
   * @param badgeSlot Location to configure.
   * @param count Number to display as a badge over the icon. A value of 0 hides the badge.
   */
  public setBadgeCount(iconSlot: TitleBarIconSlot, count: number) {
    this.icons[iconSlot].badgeCount = count;
  }

  /**
   * Toggles the visibility status of both the elastOS internal title bar, and the native system
   * status bar. Hiding both bars makes the application become fullscreen.
   *
   * Note that calling this API requires a user permission in order to safely enter fullscreen mode.
   */
  public setVisibility(visibile: boolean) {
    this.visibile = visibile;
  }

  /**
   * Setting this to true will automatically add the icon to TitleBarIconSlot.OUTER_RIGHT slot with key 'menu' to be listened to
   */
  public setMenuVisibility(visible: boolean) {
    if (visible) {
      this.menuVisible = visible;
    } else {
      this.setIcon(TitleBarIconSlot.OUTER_RIGHT, null);
    }
  }

  private listenableIconClicked(icon: TitleBarSlotItem | TitleBarMenuItem) {
    // Custom icon, call the icon listener
    this.itemClickedListeners.forEach(listener => {
      listener(icon);
    });
  }

  outerLeftIconClicked() {
    this.listenableIconClicked(this.icons[TitleBarIconSlot.OUTER_LEFT]);
  }

  innerLeftIconClicked() {
    this.listenableIconClicked(this.icons[TitleBarIconSlot.INNER_LEFT]);
  }

  innerRightIconClicked() {
    this.listenableIconClicked(this.icons[TitleBarIconSlot.INNER_RIGHT]);
  }

  outerRightIconClicked(ev) {
    this.menuVisible
      ? this.openMenu(ev)
      : this.listenableIconClicked(this.icons[TitleBarIconSlot.OUTER_RIGHT]);
  }

  async openMenu(ev) {
    this.menu = await this.popoverCtrl.create({
      mode: 'ios',
      component: TitlebarmenuitemComponent,
      componentProps: {
        items: this.menuItems,
      },
      cssClass: 'titlebarmenu-component',
      backdropDismiss: true,
      event: ev,
    });
    this.menu.onWillDismiss().then(res => {
      if (res.data) {
        this.listenableIconClicked(res.data.item);
      }
      this.menu = null;
    });
    return await this.menu.present();
  }

  public setTitleBarTheme() {
    // document.body.classList.remove("dark");
    // this.theme.backgroundColor = '#f8f8ff';
    // this.theme.color = '#000000'
    // this.foregroundMode = TitleBarForegroundMode.DARK;
  }
}
