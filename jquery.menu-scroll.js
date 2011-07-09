/*
Plugin Name: Menu Scroll
Description: Add custom menu scroll functionality
*/
(function($) {
	"use strict";
	var PROP_NAME = 'menuscroll',
		instActive;

	function MenuScroll() {
		this._defaults = {
			menuClass: 'menu-scroll',
			menuWrapperClass: 'menu-scroll-wrapper',
			menuWrapperHiddenClass: 'menu-scroll-hidden',
			scrollUpClass: 'menu-scroll-up',
			scrollUpHiddenClass: 'menu-scroll-up-hidden',
			scrollUpVisibleClass: 'menu-scroll-up-visible',
			scrollUpText: 'scroll up',
			scrollDownClass: 'menu-scroll-down',
			scrollDownHiddenClass: 'menu-scroll-down-hidden',
			scrollDownVisibleClass: 'menu-scroll-down-visible',
			scrollDownText: 'scroll down',
			toggleActivatedClass: 'activated',
			mouseOutHideMenu: true,
			enableMouseSlide: false,
			enableTouchSlide: true,
			clickTrigger: true,
			touchTrigger: true,
			touchMoveDetect: 15,
			touchTextResize: true,
			menuMoveY: 15
		};
	}

	$.extend(MenuScroll.prototype, {

		_init: function(menu, settings) {

			var inst = {
				menu: $(menu),
				trigger: $([]),
				menuWrapper: $([]),
				navScrollUp: $([]),
				navScrollDown: $([]),
				settings: $.extend({}, this._defaults, settings || {}),
				menuOffset: 0,
				menuScrollbarHeight: 40,
				active: false
			};

			inst.trigger = settings.trigger ? $(settings.trigger) : inst.menu.parent();

			$.data(menu, PROP_NAME, inst);

			this._initMenu(inst);
			this._attachHandlers(inst);

			if (!instActive) {
				instActive = inst;
			}
			this._setMenuPosition(inst, 0);
		},

		_initMenu: function(inst) {
			inst.menuWrapper = $('<div />').addClass(inst.settings.menuWrapperClass)
				.insertBefore(inst.menu)
				.append(inst.menu);

			if (!inst.settings.hideNavScrollUp) {
				inst.navScrollUp = $('<div />')
					.addClass(inst.settings.scrollUpClass)
					.addClass(inst.settings.scrollUpHiddenClass)
					.text(inst.settings.scrollUpText)
					.prependTo(inst.menuWrapper)
					.data('menu-scroll-up', true);
			}

			if (!inst.settings.hideNavScrollDown) {
				inst.navScrollDown = $('<div />')
					.addClass(inst.settings.scrollDownClass)
					.addClass(inst.settings.scrollDownHiddenClass)
					.text(inst.settings.scrollDownText)
					.appendTo(inst.menuWrapper);
			}
			
			if (inst.settings.container && inst.settings.container !== '') {
				var container = $(inst.settings.container);
				if (container && container.length) {
					inst.container = container;
				}
			}
		},

		_attachHandlers: function(inst) {
			var data = {
				inst: inst,
				fn: this
			};

			var triggerIsMenuParent = inst.menu.closest(inst.trigger).length !== 0;

			if (this._hasTouchSupport()) {
				if (inst.settings.touchTrigger) {
					inst.trigger.on('touchstart', data, this._onTouchTrigger);
				}

				// Allow the keyboard to resize without hiding menu
				if (inst.settings.touchTextResize) {
					inst.menu.on('touchstart focus blur', ':text', function() {
						clearTimeout(inst.textResizeTimout);
						inst.textResize = true;
						inst.textResizeTimout = setTimeout(function() {
							inst.textResize = false;
						}, 1000);
					});
				}
			}
			else {
				if (inst.settings.mouseOutHideMenu) {
					inst.trigger.on('mouseover', data, this._onMouseOverMenu);
					inst.trigger.on('mouseout', data, this._onMouseOutMenu);
				}
				else if (inst.settings.clickTrigger) {
					inst.trigger.on('click', data, this._onMouseOverMenu);
				}

				inst.trigger.on('mousewheel DOMMouseScroll', data, this._onMouseWheel);
				if (!triggerIsMenuParent) {
					inst.menu.on('mousewheel DOMMouseScroll', data, this._onMouseWheel);
				}
			}

			inst.navScrollDown.on('mouseover touchstart', data, this._onMouseOverNav);
			inst.navScrollDown.on('mouseout touchend', data, this._onMouseOutNav);
			inst.navScrollUp.on('mouseover touchstart', data, this._onMouseOverNav);
			inst.navScrollUp.on('mouseout touchend', data, this._onMouseOutNav);

			if (inst.settings.enableTouchSlide && this._hasTouchSupport()) {

				inst.touchStartOffset = 0;

				inst.menu.on('touchstart', data, this._onTouchStartHandler)
					.on('touchend', data, this._onTouchEndHandler);
			}

			else if (inst.settings.enableMouseSlide) {
				inst.menu.on('mousedown', data, this._onTouchStartHandler)
					.on('mouseup mouseout', data, this._onTouchEndHandler);
			}

			$('body').on('screendata-resized', function() {
				if (!inst.textResize) {
					$.menuscroll.hideMenu(inst);
				}
			});
		},

		_setMenuPosition: function(inst, pos) {
			var windowHeight, scrollTop, menuOffset;

			if (isNaN(pos)) {
				return;
			}

			inst.menuHeight = (inst.container && inst.container.length > 0 && inst.container[0] == inst.menu[0]) ? inst.menu[0].scrollHeight : inst.menu.height();
			inst.menuWidth = (inst.container && inst.container.length > 0 && inst.container[0] == inst.menu[0]) ? inst.menu[0].scrollWidth : inst.menu.width();

			if (inst.container) {
				windowHeight = $(inst.container).height();
				scrollTop = $(inst.container).scrollTop();
				menuOffset = inst.menu.position().top;
			}
			else {
				windowHeight = $.menuscroll._isMobileSafari() ? $.menuscroll._getMobileSafariWindowHeight() : $(window).height();
				scrollTop = $(window).scrollTop();
				menuOffset = inst.menu.offset().top;
			}

			if (inst.settings.menuFullWindowHeight) {
				inst.menuVisibleHeight = windowHeight;
			}
			else {
				inst.menuVisibleHeight = windowHeight + scrollTop - inst.menu.offset().top;

				if (windowHeight < inst.menuVisibleHeight) {
					inst.menuVisibleHeight = windowHeight;
				}
			}

			if (pos > 0) {
				inst.navScrollUp.removeClass(inst.settings.scrollUpHiddenClass)
					.addClass(inst.settings.scrollUpVisibleClass);
			}
			else if (pos <= 0) {
				pos = 0;
				inst.navScrollUp.addClass(inst.settings.scrollUpHiddenClass)
					.removeClass(inst.settings.scrollUpVisibleClass);
			}

			if (pos < inst.menuHeight - inst.menuVisibleHeight) {
				inst.navScrollDown.removeClass(inst.settings.scrollDownHiddenClass)
					.addClass(inst.settings.scrollDownVisibleClass);
			}
			else if (pos >= inst.menuHeight - inst.menuVisibleHeight - inst.navScrollDown.height()) {
				inst.navScrollDown.addClass(inst.settings.scrollDownHiddenClass)
					.removeClass(inst.settings.scrollDownVisibleClass);
			}

			inst.menuOffset = pos;

			if (inst.settings.useScrolltop) {
				inst.menu.scrollTop(pos);
			}
			else if (inst.settings.useTransformPositioning) {
				inst.menu.css({
					'transform': 'translate3d(0px,-'+ pos +'px,0px)'
				});
			}
			else {
				inst.menu.css({
					top: inst.menuTop - pos
				});
			}
		},

		_onMouseWheel: function(e) {
			var inst = e.data.inst;
			var fn = e.data.fn;

			if (!inst.active) {
				return;
			}

			if (e && e.originalEvent) {
				var deltaY = 0;
				if (e.originalEvent.wheelDeltaY) {
					deltaY = e.originalEvent.wheelDeltaY;
				}
				else if (e.originalEvent.deltaY) {
					deltaY = -e.originalEvent.deltaY;
				}
				else if (e.originalEvent.detail) {
					deltaY = -e.originalEvent.detail;
				}

				if (deltaY < 0) {
					fn.moveMenuUp(inst);
				}
				else if (deltaY > 0) {
					fn.moveMenuDown(inst);
				}
			}
			else {
				fn.moveMenuUp(inst);
			}

			return false;
		},

		_onMouseOverNav: function(e) {
			var inst = e.data.inst,
				fn = e.data.fn;

            instActive = e.data.inst;

			fn._disableTouchMoveHandler(inst);

			inst.isMoving = true;

			clearTimeout(inst.tapDetect);
			clearInterval(inst.animateInterval);

			inst.animateInterval = setInterval(function() {
				if ($(e.target).data('menu-scroll-up')) {
					fn.moveMenuDown(inst);
				}
				else {
					fn.moveMenuUp(inst);
				}
			}, 50);

			return false;
		},

		_onMouseOutNav: function(e) {
			var inst = e.data.inst;

            instActive = e.data.inst;

			$.menuscroll._disableTouchMoveHandler(inst);

			clearTimeout(inst.tapDetect);
			clearInterval(inst.animateInterval);

			return false;
		},

		_onTouchTrigger: function (e) {
			var inst = e.data.inst;

            instActive = e.data.inst;

			inst.active = false;

			if (!inst.trigger.hasClass(inst.settings.toggleActivatedClass)) {
				inst.trigger.addClass(inst.settings.toggleActivatedClass);
				$.menuscroll._onMouseOverMenu(e, inst);
			}
			else {
				$.menuscroll.hideMenu(inst);
			}

			e.stopPropagation();
		},

		_getMobileSafariWindowHeight: function() {
			var zoomLevel = document.documentElement.clientWidth / window.innerWidth;
			return window.innerHeight * zoomLevel;
		},

		_isMobileSafari: function() {
			return navigator.platform.indexOf('iPhone') !== -1 || navigator.platform.indexOf('iPod') !== -1;
		},

		_onMouseOverMenu: function(e, inst) {
			var windowHeight, scrollTop, menuOffset;
	
			if (!inst) {
				inst = instActive = e.data.inst;
			}

			if (!inst || inst.active) {
				return;
			}
			inst.active = true;

			if (!inst.settings.disableHideWrapper) {
				inst.menuWrapper.removeClass(inst.settings.menuWrapperHiddenClass);
			}

			if (!inst.menuHeight) {
				inst.menuHeight = inst.menu.height();
				inst.menuWidth = inst.menu.width();
				inst.navScrollDown.width(inst.menuWidth);
				inst.navScrollUp.width(inst.menuWidth);
			}

			if (inst.container) {
				windowHeight = $(inst.container).height();
				scrollTop = $(inst.container).scrollTop();
				menuOffset = inst.menu.position().top;
			}
			else {
				windowHeight = $.menuscroll._isMobileSafari() ? $.menuscroll._getMobileSafariWindowHeight() : $(window).height();
				scrollTop = $(window).scrollTop();
				menuOffset = inst.menu.offset().top;
			}
			
			if (inst.settings.menuFullWindowHeight) {
				inst.menuVisibleHeight = windowHeight;
			}
			else {
				inst.menuVisibleHeight = windowHeight + scrollTop - inst.menu.offset().top;

				if (windowHeight < inst.menuVisibleHeight) {
					inst.menuVisibleHeight = windowHeight;
				}
			}
			
			if (inst.menuVisibleHeight >= inst.menuHeight) {
				inst.navScrollUp.addClass(inst.settings.scrollUpHiddenClass)
					.removeClass(inst.settings.scrollUpVisibleClass);
				inst.navScrollDown.addClass(inst.settings.scrollDownHiddenClass)
					.removeClass(inst.settings.scrollDownVisibleClass);
				return;
			}

			inst.menuTop = inst.menu.position().top;

			inst.menuWrapper.height(inst.menuVisibleHeight);
			
			if (!inst.settings.disableHideWrapper) {
				inst.menuWrapper.css('overflow', 'hidden');
			}

			inst.navScrollUp.addClass(inst.settings.scrollUpHiddenClass)
				.removeClass(inst.settings.scrollUpVisibleClass);
			inst.navScrollDown.removeClass(inst.settings.scrollDownHiddenClass)
				.addClass(inst.settings.scrollDownVisibleClass);
		},

		_onMouseOutMenu: function(e) {
			var inst = e.data.inst;

			instActive = e.data.inst;

			if (e && e.relatedTarget) {
				var parent = $(e.relatedTarget).closest(inst.trigger);
				if (parent.length) {
					return false;
				}
			}

			if (!inst.isMoving && inst.active) {
				inst.active = false;

				$.menuscroll.hideMenu(inst);
			}
		},

		hideMenu: function(inst) {
			// Reset menu position
			inst.menuOffset = 0;

			inst.menu.css({
				top: '',
				transform: 'none'
			});

			inst.menuWrapper.css({
				height: ''
			});

			if (!inst.settings.disableHideWrapper) {
				inst.menuWrapper.addClass(inst.settings.menuWrapperHiddenClass)
					.css('overflow', 'visible');
			}

			inst.trigger.removeClass(inst.settings.toggleActivatedClass);

			inst.navScrollDown.addClass(inst.settings.scrollDownHiddenClass)
				.removeClass(inst.settings.scrollDownVisibleClass);
			inst.navScrollUp.addClass(inst.settings.scrollUpHiddenClass)
				.removeClass(inst.settings.scrollUpVisibleClass);

			inst.active = false;
		},

		moveMenuUp: function(inst) {
			if ( inst.menuOffset <= inst.menuHeight - inst.menuVisibleHeight - inst.settings.menuMoveY) {
				this._setMenuPosition(inst, inst.menuOffset + inst.settings.menuMoveY);
			}
			else if (inst.menuOffset <= inst.menuHeight - inst.menuVisibleHeight) {
				this._setMenuPosition(inst, inst.menuHeight - inst.menuVisibleHeight);
			}
		},

		moveMenuDown: function(inst) {
			if ( inst.menuOffset >= inst.settings.menuMoveY) {
				this._setMenuPosition(inst, inst.menuOffset - inst.settings.menuMoveY);
			}
			else if (inst.menuOffset < inst.settings.menuMoveY) {
				this._setMenuPosition(inst, 0);
			}
		},

		_hasTouchSupport: function() {

			if (window.Modernizr) {
				return window.Modernizr.touch;
			}

			return (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
		},

		_onTouchStartHandler: function(e) {
			var inst = e.data.inst, windowHeight, scrollTop, menuOffset;

            instActive = e.data.inst;

			var isTouch = e.type.indexOf('touch') === 0;

			inst.isMoving = false;

			inst.touchStartPageY = $.menuscroll._getPageY(e);
			inst.touchStartOffset = inst.menuOffset || 0;

			$.menuscroll._enableTouchMoveHandler(inst, e.type);

			if (isTouch) {
				return;
			}

			return false;
		},

		_onTouchEndHandler: function(e) {
			var inst = e.data.inst,
                isTouch = e.type.indexOf('touch') === 0,
                parent;

			if (e && e.relatedTarget && !isTouch) {
				parent = $(e.relatedTarget).closest(inst.trigger);
				if (parent.length) {
					return false;
				}

				parent = $(e.relatedTarget).closest(inst.menu);
				if (parent.length) {
					return false;
				}
			}

			$.menuscroll._disableTouchMoveHandler(inst);

			if (inst.isMoving) {
				return false;
			}

			if (!isTouch) {
				$.menuscroll._setMenuPosition(inst, inst.touchStartOffset);
			}
		},

		_onTouchMoveHandler: function(e) {

			var inst = e.data.inst;
			if (inst && inst.touchEnabled) {
				var diffY = parseInt($.menuscroll._getPageY(e) - inst.touchStartPageY, 10);

				// Number of pixels the cursor needs to move to be considered moving horizontally
				if (inst.isMoving || Math.abs(diffY) > inst.settings.touchMoveDetect) {
					inst.isMoving = true;

					var time = new Date().getTime();

					if (!inst.lastMove || time - inst.lastMove > 50) {
						inst.lastMove = time;

						var pos = inst.touchStartOffset - diffY;

						if (pos < 0) {
							pos = 0;
						}
						else if (pos > inst.menuHeight - inst.menuVisibleHeight) {
							pos = inst.menuHeight - inst.menuVisibleHeight;
						}

						$.menuscroll._setMenuPosition(inst, pos);
					}
				}

				return false;
			}
		},

		_enableTouchMoveHandler: function(inst, eventType) {
			if (!inst.touchEnabled) {
				inst.touchEnabled = true;
				var moveEvent = eventType && eventType.indexOf('touch') === 0 ? 'touchmove' : 'mousemove';
				inst.menuWrapper.on(moveEvent, {inst: inst}, this._onTouchMoveHandler);
			}
		},

		_disableTouchMoveHandler: function(inst) {
			if (inst.touchEnabled) {
				inst.touchEnabled = false;
				inst.menuWrapper.off('touchmove mousemove', this._onTouchMoveHandler);
			}
		},

		/* Get the position of the cursor: mouse pointer or touch location */
		_getPageY: function(e) {
			return e.type.indexOf('touch') === 0 ? e.originalEvent.touches[0].pageY : e.pageY;
		},

		/* Get a setting value, defaulting if necessary. */
		_get: function(inst, name) {
			return inst.settings[name] !== undefined ?
				inst.settings[name] : this._defaults[name];
		},

		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw "Missing instance data";
			}
		},

		_optionMethod: function(target, name, value) {
			var settings,
				inst = this._getInst(target);

			if (arguments.length === 2 && typeof name === "string") {
				return (name === "defaults" ? $.extend({}, $.menuscroll._defaults) :
					(inst ? (name === "all" ? $.extend({}, inst.settings) :
					this._get(inst, name)) : null));
			}

			settings = name || {};
			if (typeof name === "string") {
				settings = {};
				settings[name] = value;
			}

			if (inst) {
				$.extend(inst.settings, settings);

				for (var setting in settings) {
					if (settings[setting] === null) {
						inst.settings[setting] = settings[setting];
					}
				}
			}
		},

		_showMethod: function(target) {
			var inst = this._getInst(target);
			if (inst) {
				this._onMouseOverMenu(null, inst);
			}
		},

		_hideMethod: function(target) {
			var inst = this._getInst(target);
			if (inst) {
				this.hideMenu(inst);
			}
		},

		_toggleMethod: function(target, show) {
			var inst = this._getInst(target);
			if (inst) {
				if (show === undefined) {
					show = !inst.active;
				}
				if (show) {
					this._onMouseOverMenu(null, inst);
				}
				else {
					this.hideMenu(inst);
				}
			}
		}
	});

	$.fn.menuscroll = function(options) {
		if ( !this.length ) {
			return this;
		}

		var args = typeof options === "string" ? Array.prototype.slice.call(arguments, 1) : null;

		// Get option
		if (options === "option" && arguments.length === 2 && typeof arguments[1] === "string") {
			return $.menuscroll["_" + options + "Method"].
				apply($.menuscroll, [this[0]].concat(args));
		}

		return this.each(function() {
			// Call method
			if (typeof options === "string") {
				$.menuscroll["_" + options + "Method"].apply($.menuscroll, [this].concat(args));
			}
			// Init control
			else {
				$.menuscroll._init(this, options);
			}
		});

	};

	$.menuscroll = new MenuScroll();

})(jQuery);

(function($) {
    "use strict";
	$(function() {
		var childCount = 0;
		if (window.Modernizr.touch) {
			childCount = $("#js-category-tab-content").find("li").length;
			$('#js-category-tab-content').menuscroll({
				menuWrapperClass: 'search-menu-scroll-wrapper-cats on',
				mouseOutHideMenu: false,
				touchTrigger: false,
				clickTrigger: false,
				container: '#js-category-tab-content',
				hideNavScrollUp: childCount <= 32,
				hideNavScrollDown: childCount <= 32,
				disableHideWrapper: true,
				useScrolltop: true
			});
			childCount = $("#js-tag-tab-content").find("li").length;
			$('#js-tag-tab-content').menuscroll({
				menuWrapperClass: 'search-menu-scroll-wrapper-tags',
				mouseOutHideMenu: false,
				touchTrigger: false,
				clickTrigger: false,
				container: '#js-tag-tab-content',
				hideNavScrollUp: childCount <= 32,
				hideNavScrollDown: childCount <= 32,
				disableHideWrapper: true,
				useScrolltop: true
			});
		}

		if (!window.Modernizr.touch || (window.Modernizr.touch && window.screenData.width < 768)) {
			$('#js-side-menu').menuscroll({
				trigger: '#js-side-menu-toggle',
				menuWrapperClass: 'side-menu-scroll-wrapper menu-scroll-hidden',
				mouseOutHideMenu: false,
				touchTrigger: false,
				clickTrigger: false,
				menuFullWindowHeight: true,
				hideNavScrollUp: true,
				hideNavScrollDown: true,
				disableHideWrapper: true,
				useTransformPositioning: true
			});
		}
	});
})(jQuery);
