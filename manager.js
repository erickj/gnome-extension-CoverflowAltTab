/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

/* CoverflowAltTab::Manager
 *
 * This class is a helper class to start the actual switcher.
 */

const Lang = imports.lang;
const Main = imports.ui.main;

const CoverflowAltTab = imports.ui.extensionSystem.extensions["CoverflowAltTab@palatis.blogspot.com"];

const Switcher = CoverflowAltTab.switcher;

/**
 * This class handles window events, so we can keep a stack of windows ordered
 * by the most recently focused window.
 */
function Manager() {
	this._init();
}

Manager.prototype = {
	_init: function() {
	},

	_activateSelectedWindow: function(win) {
		Main.activateWindow(win);
	},

	_removeSelectedWindow: function(win) {
		win.delete(global.get_current_time());
	},

	_startWindowSwitcher: function (shellwm, binding, mask, window, backwards) {
		let windows = [];
		let actions = {};
		let currentWorkspace = global.screen.get_active_workspace();
		let currentIndex = 0;

		// construct a list with all windows
		let windowActors = global.get_window_actors();
		for (let i in windowActors) {
			windows.push(windowActors[i].get_meta_window());
		}
		windowActors = null;
		windows.sort(Lang.bind(this,
			function(win1, win2) {
				let t1 = win1.get_user_time();
				let t2 = win2.get_user_time();

				return (t2 > t1) ? 1 : -1 ;
			}
		));

		// filter by modes
		if (binding == 'switch_group') {
			windows = windows.filter(
				function(win) {
					return win.get_workspace() == currentWorkspace && !win.is_skip_taskbar();
				}
			);
		} else if (binding == 'switch_panels') {
			let focused = global.display.focus_window;
			if (!focused)
				focused = windows[0];

			windows = windows.filter(
				function(win) {
					return win.get_wm_class() == focused.get_wm_class() && !win.is_skip_taskbar();
				}
			);
		} else {
			windows = windows.filter(
				function(win) {
					return !win.is_skip_taskbar();
				}
			);
		}

		if (windows.length) {
			actions['activate_selected'] = this._activateSelectedWindow;
			actions['remove_selected'] = this._removeSelectedWindow;

			if (!global.display.focus_window) {
				currentIndex = -1;
			}

			let switcher = new Switcher.Switcher(windows, actions);
			switcher._currentIndex = currentIndex;

			if (!switcher.show(shellwm, binding, mask, window, backwards)) {
				switcher.destroy();
			}
		}
	},
}
